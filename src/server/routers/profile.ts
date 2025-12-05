import { z } from "zod/v4";
import { publicProcedure, router } from "../trpc";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase-server";

const interestSchema = z.enum([
  "programming",
  "music",
  "sports",
  "art",
  "gaming",
  "reading",
  "cooking",
  "travel",
  "photography",
  "films",
  "science",
  "languages",
]);

const genderSchema = z.enum(["male", "female", "other"]);

const ageRangeSchema = z.enum([
  "range14to16",
  "range17to18",
  "range19to21",
  "range22plus",
]);

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
});
