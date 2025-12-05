import { z } from "zod/v4";
import { publicProcedure, router } from "../trpc";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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
  create: publicProcedure
    .input(
      z.object({
        myInterests: z.array(interestSchema).min(1),
        myGender: genderSchema,
        myAgeRange: ageRangeSchema,
        prefInterests: z.array(interestSchema).min(1),
        prefGender: genderSchema.nullable(),
        prefAgeRange: ageRangeSchema.nullable(),
        avatarPath: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = await createServerSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          auth_id: user.id,
          my_interests: input.myInterests,
          my_gender: input.myGender,
          my_age_range: input.myAgeRange,
          pref_interests: input.prefInterests,
          pref_gender: input.prefGender,
          pref_age_range: input.prefAgeRange,
          avatar_path: input.avatarPath,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    }),

  uploadAvatar: publicProcedure
    .input(
      z.object({
        base64: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = await createServerSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const buffer = Buffer.from(input.base64, "base64");
      const extension = input.contentType.split("/")[1] || "jpg";
      const path = `${user.id}.${extension}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, buffer, {
          contentType: input.contentType,
          upsert: true,
        });

      if (error) {
        throw new Error(error.message);
      }

      return { path };
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
