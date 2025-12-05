import { z } from "zod/v4";

export const interestSchema = z.enum([
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

export const genderSchema = z.enum(["male", "female", "other"]);

export const ageRangeSchema = z.enum([
  "range14to16",
  "range17to18",
  "range19to21",
  "range22plus",
]);

export type Interest = z.infer<typeof interestSchema>;
export type Gender = z.infer<typeof genderSchema>;
export type AgeRange = z.infer<typeof ageRangeSchema>;

export const INTEREST_KEYS = interestSchema.options as readonly Interest[];
export const GENDER_KEYS = genderSchema.options as readonly Gender[];
export const AGE_RANGE_VALUES = ageRangeSchema.options as readonly AgeRange[];

export const INTEREST_EMOJIS: Record<Interest, string> = {
  programming: "💻",
  music: "🎵",
  sports: "⚽",
  art: "🎨",
  gaming: "🎮",
  reading: "📚",
  cooking: "👨‍🍳",
  travel: "✈️",
  photography: "📷",
  films: "🎬",
  science: "🔬",
  languages: "🌍",
};

export const GENDER_EMOJIS: Record<Gender, string> = {
  male: "👨",
  female: "👩",
  other: "🧑",
};

export const AGE_RANGES = [
  { value: "range14to16" as const, label: "14-16" },
  { value: "range17to18" as const, label: "17-18" },
  { value: "range19to21" as const, label: "19-21" },
  { value: "range22plus" as const, label: "22+" },
] as const;

export const AGE_RANGE_LABELS: Record<AgeRange, string> = {
  range14to16: "14-16",
  range17to18: "17-18",
  range19to21: "19-21",
  range22plus: "22+",
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};
