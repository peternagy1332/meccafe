import { z } from "zod/v4";
import { publicProcedure, router } from "../trpc";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase-server";
import {
  interestSchema,
  genderSchema,
  ageRangeSchema,
} from "@/lib/zod";

export const profileRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.email(),
        myInterests: z.array(interestSchema).min(1),
        myGender: genderSchema,
        myAgeRange: ageRangeSchema,
        prefInterests: z.array(interestSchema).min(1),
        prefGender: genderSchema.nullable(),
        prefAgeRange: ageRangeSchema.nullable(),
        avatarBase64: z.string(),
        avatarContentType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = await createServerSupabaseClient();
      const serviceClient = createServiceRoleClient();

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: input.email,
      });

      if (otpError) {
        throw new Error(otpError.message);
      }

      const { data: userData, error: userError } =
        await serviceClient.auth.admin.listUsers();

      if (userError) {
        throw new Error(userError.message);
      }

      const user = userData.users.find((u) => u.email === input.email);

      if (!user) {
        throw new Error("User not found after OTP");
      }

      const buffer = Buffer.from(input.avatarBase64, "base64");
      const extension = input.avatarContentType.split("/")[1] || "jpg";
      const avatarPath = `${user.id}.${extension}`;

      const { error: uploadError } = await serviceClient.storage
        .from("avatars")
        .upload(avatarPath, buffer, {
          contentType: input.avatarContentType,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { error: profileError } = await serviceClient
        .from("profiles")
        .upsert({
          auth_id: user.id,
          my_interests: input.myInterests,
          my_gender: input.myGender,
          my_age_range: input.myAgeRange,
          pref_interests: input.prefInterests,
          pref_gender: input.prefGender,
          pref_age_range: input.prefAgeRange,
          avatar_path: avatarPath,
        });

      if (profileError) {
        throw new Error(profileError.message);
      }

      return { success: true };
    }),

  getMyProfile: publicProcedure.query(async () => {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    return data;
  }),

  updatePreferences: publicProcedure
    .input(
      z.object({
        myInterests: z.array(interestSchema).min(1).optional(),
        myGender: genderSchema.optional(),
        myAgeRange: ageRangeSchema.optional(),
        prefInterests: z.array(interestSchema).min(1).optional(),
        prefGender: genderSchema.nullable().optional(),
        prefAgeRange: ageRangeSchema.nullable().optional(),
        avatarBase64: z.string().optional(),
        avatarContentType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = await createServerSupabaseClient();
      const serviceClient = createServiceRoleClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, avatar_path")
        .eq("auth_id", user.id)
        .single();

      if (!profile) {
        throw new Error("Profile not found");
      }

      const updateData: Record<string, unknown> = {};

      if (input.myInterests !== undefined) {
        updateData.my_interests = input.myInterests;
      }
      if (input.myGender !== undefined) {
        updateData.my_gender = input.myGender;
      }
      if (input.myAgeRange !== undefined) {
        updateData.my_age_range = input.myAgeRange;
      }
      if (input.prefInterests !== undefined) {
        updateData.pref_interests = input.prefInterests;
      }
      if (input.prefGender !== undefined) {
        updateData.pref_gender = input.prefGender;
      }
      if (input.prefAgeRange !== undefined) {
        updateData.pref_age_range = input.prefAgeRange;
      }

      if (input.avatarBase64 && input.avatarContentType) {
        const buffer = Buffer.from(input.avatarBase64, "base64");
        const extension = input.avatarContentType.split("/")[1] || "jpg";
        const avatarPath = `${user.id}.${extension}`;

        const { error: uploadError } = await serviceClient.storage
          .from("avatars")
          .upload(avatarPath, buffer, {
            contentType: input.avatarContentType,
            upsert: true,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        updateData.avatar_path = avatarPath;
      }

      const { error: updateError } = await serviceClient
        .from("profiles")
        .update(updateData)
        .eq("auth_id", user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return { success: true };
    }),

  getMyMatches: publicProcedure.query(async () => {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!profile) {
      return [];
    }

    const { data: matches, error } = await supabase
      .from("matches")
      .select("id, matched_at, user1_profile_id, user2_profile_id")
      .or(`user1_profile_id.eq.${profile.id},user2_profile_id.eq.${profile.id}`)
      .order("matched_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    if (!matches || matches.length === 0) {
      return [];
    }

    const partnerIds = matches.map((match) =>
      match.user1_profile_id === profile.id
        ? match.user2_profile_id
        : match.user1_profile_id
    );

    const { data: partners, error: partnersError } = await supabase
      .from("profiles")
      .select("id, avatar_path, my_interests, my_gender, my_age_range")
      .in("id", partnerIds);

    if (partnersError) {
      throw new Error(partnersError.message);
    }

    const partnerMap = new Map(
      (partners || []).map((p) => [p.id, p])
    );

    return matches.map((match) => {
      const partnerId =
        match.user1_profile_id === profile.id
          ? match.user2_profile_id
          : match.user1_profile_id;
      const partner = partnerMap.get(partnerId);

      if (!partner) {
        return null;
      }

      return {
        id: match.id,
        matchedAt: match.matched_at,
        partner: {
          id: partner.id,
          avatarPath: partner.avatar_path,
          interests: partner.my_interests,
          gender: partner.my_gender,
          ageRange: partner.my_age_range,
        },
      };
    }).filter((match): match is NonNullable<typeof match> => match !== null);
  }),
});
