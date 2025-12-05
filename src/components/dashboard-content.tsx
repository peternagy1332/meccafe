"use client";

import { motion } from "motion/react";
import { PreferencesEditor } from "@/components/preferences-editor";
import { MatchesList } from "@/components/matches-list";
import { trpc } from "@/lib/trpc";
import { Coffee } from "lucide-react";

type ProfileData = {
  id: string;
  my_interests: string[];
  my_gender: string;
  my_age_range: string;
  pref_interests: string[];
  pref_gender: string | null;
  pref_age_range: string | null;
  avatar_path: string | null;
};

type DashboardContentProps = {
  profile: ProfileData;
  avatarUrl: string | null;
};

export function DashboardContent({
  profile,
  avatarUrl,
}: DashboardContentProps): React.ReactNode {
  const utils = trpc.useUtils();

  const handlePreferencesSaved = (): void => {
    utils.profile.getMyProfile.invalidate();
    utils.profile.getMyMatches.invalidate();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold">Profile</h2>
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-primary shadow-lg">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <Coffee className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Gender: {profile.my_gender}</p>
              <p className="text-sm text-muted-foreground">Age: {profile.my_age_range}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <PreferencesEditor
            profile={profile}
            avatarUrl={avatarUrl}
            onSaved={handlePreferencesSaved}
          />
        </div>
      </motion.div>

      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <MatchesList />
        </div>
      </motion.div>
    </div>
  );
}
