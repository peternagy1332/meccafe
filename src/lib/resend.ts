import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type ProfileWithEmail = {
  id: string;
  name: string | null;
  avatar_path: string | null;
  my_interests: string[];
  my_gender: string;
  my_age_range: string;
  email: string;
};

const AGE_RANGE_LABELS: Record<string, string> = {
  range14to16: "14-16",
  range17to18: "17-18",
  range19to21: "19-21",
  range22plus: "22+",
};

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

function formatInterests(interests: string[]): string {
  return interests
    .map((i) => i.charAt(0).toUpperCase() + i.slice(1))
    .join(", ");
}

function getAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarPath}`;
}

export async function sendMatchEmail(
  recipient: ProfileWithEmail,
  match: ProfileWithEmail
): Promise<{ success: boolean; error?: string }> {
  const matchName = match.name || "Your Match";
  const recipientName = recipient.name || "there";
  const avatarUrl = getAvatarUrl(match.avatar_path);

  const { error } = await resend.emails.send({
    from: "MacCafe <matches@maccafe.hu>",
    to: recipient.email,
    subject: `You have a new match: ${matchName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Hey ${recipientName}! 🎉</h1>
        <p style="color: #666; font-size: 16px; text-align: center;">
          We found someone who matches your preferences!
        </p>
        
        <div style="background: #f9f9f9; border-radius: 12px; padding: 24px; margin: 24px 0;">
          ${
            avatarUrl
              ? `<img src="${avatarUrl}" alt="${matchName}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto 16px;" />`
              : ""
          }
          <h2 style="color: #333; text-align: center; margin: 0 0 16px;">${matchName}</h2>
          
          <div style="color: #666; font-size: 14px;">
            <p><strong>Gender:</strong> ${GENDER_LABELS[match.my_gender] || match.my_gender}</p>
            <p><strong>Age Range:</strong> ${AGE_RANGE_LABELS[match.my_age_range] || match.my_age_range}</p>
            <p><strong>Interests:</strong> ${formatInterests(match.my_interests)}</p>
          </div>
        </div>
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent by MacCafe matching system.
        </p>
      </div>
    `,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
