"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Coffee, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";

const INTEREST_EMOJIS: Record<string, string> = {
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

function getAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarPath}`;
}

export function MatchesList(): React.ReactNode {
  const t = useTranslations("matches-list");
  const tReg = useTranslations("registration-form");
  const { data: matches, isLoading } = trpc.profile.getMyMatches.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Coffee className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{t("empty.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("empty.message")}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("title")}</h3>
      <div className="space-y-3">
        {matches.map((match, index) => {
          const avatarUrl = getAvatarUrl(match.partner.avatarPath);
          const matchDate = new Date(match.matchedAt);
          const formattedDate = matchDate.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          return (
            <motion.div
              key={match.id}
              className="rounded-lg border border-border bg-card p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-primary">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={t("match.avatarAlt")}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Coffee className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{formattedDate}</span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm font-medium text-foreground">
                      {t("match.interests")}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(match.partner.interests as string[]).map((interest) => (
                        <span
                          key={interest}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs"
                        >
                          <span>{INTEREST_EMOJIS[interest] || "•"}</span>
                          <span>{tReg(`interests.${interest}`)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("match.gender")}: {match.partner.gender} • {t("match.ageRange")}:{" "}
                    {match.partner.ageRange}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
