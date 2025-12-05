import { createClient } from "@supabase/supabase-js";
import { findBestMatch } from "@/lib/matching";
import { sendMatchEmail } from "@/lib/resend";

const BATCH_SIZE = 100;
const MATCH_COOLDOWN_DAYS = 7;

type ProfileRow = {
  id: string;
  auth_id: string;
  name: string | null;
  avatar_path: string | null;
  my_interests: string[];
  my_gender: string;
  my_age_range: string;
  pref_interests: string[];
  pref_gender: string | null;
  pref_age_range: string | null;
  matched_at: string | null;
};

type ProfileWithEmail = ProfileRow & { email: string };

function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getEligibleProfiles(
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<ProfileRow[]> {
  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - MATCH_COOLDOWN_DAYS);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`matched_at.is.null,matched_at.lt.${cooldownDate.toISOString()}`);

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`);
  }

  return data || [];
}

async function getEmailsForProfiles(
  supabase: ReturnType<typeof createServiceRoleClient>,
  authIds: string[]
): Promise<Map<string, string>> {
  const emailMap = new Map<string, string>();

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  for (const user of data.users) {
    if (authIds.includes(user.id) && user.email) {
      emailMap.set(user.id, user.email);
    }
  }

  return emailMap;
}

async function updateMatchedAt(
  supabase: ReturnType<typeof createServiceRoleClient>,
  profileIds: string[]
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ matched_at: new Date().toISOString() })
    .in("id", profileIds);

  if (error) {
    throw new Error(`Failed to update matched_at: ${error.message}`);
  }
}

export async function GET(request: Request): Promise<Response> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const profiles = await getEligibleProfiles(supabase);

  if (profiles.length < 2) {
    return Response.json({
      success: true,
      message: "Not enough profiles to match",
      matchesCreated: 0,
    });
  }

  const authIds = profiles.map((p) => p.auth_id);
  const emailMap = await getEmailsForProfiles(supabase, authIds);

  const profilesWithEmail: ProfileWithEmail[] = profiles
    .filter((p) => emailMap.has(p.auth_id))
    .map((p) => ({
      ...p,
      email: emailMap.get(p.auth_id)!,
    }));

  const matchedIds = new Set<string>();
  const matchPairs: [ProfileWithEmail, ProfileWithEmail][] = [];

  for (let i = 0; i < profilesWithEmail.length; i += BATCH_SIZE) {
    const batch = profilesWithEmail.slice(i, i + BATCH_SIZE);

    for (const profile of batch) {
      if (matchedIds.has(profile.id)) continue;

      const availableCandidates = profilesWithEmail.filter(
        (p) => !matchedIds.has(p.id)
      );

      const bestMatch = findBestMatch(profile, availableCandidates);

      if (bestMatch) {
        matchedIds.add(profile.id);
        matchedIds.add(bestMatch.id);
        matchPairs.push([
          profile,
          profilesWithEmail.find((p) => p.id === bestMatch.id)!,
        ]);
      }
    }
  }

  let emailsSent = 0;
  const errors: string[] = [];

  for (const [profileA, profileB] of matchPairs) {
    const [resultA, resultB] = await Promise.all([
      sendMatchEmail(profileA, profileB),
      sendMatchEmail(profileB, profileA),
    ]);

    if (resultA.success) emailsSent++;
    else if (resultA.error) errors.push(resultA.error);

    if (resultB.success) emailsSent++;
    else if (resultB.error) errors.push(resultB.error);
  }

  if (matchedIds.size > 0) {
    await updateMatchedAt(supabase, Array.from(matchedIds));
  }

  return Response.json({
    success: true,
    matchesCreated: matchPairs.length,
    emailsSent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
