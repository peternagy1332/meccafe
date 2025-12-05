import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { DashboardContent } from "@/components/dashboard-content";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";

function getAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarPath}`;
}

export default async function DashboardPage(): Promise<React.ReactNode> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (!profile) {
    redirect("/");
  }

  const avatarUrl = getAvatarUrl(profile.avatar_path);

  return (
    <div className="noise-overlay relative min-h-screen overflow-hidden bg-background">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-4">
        <LanguageSwitcher />
        <LogoutButton />
      </div>

      <main className="relative mx-auto min-h-screen max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg overflow-hidden">
            <img
              src="/logo.png"
              alt="MecCafe Logo"
              className="h-full w-full object-contain p-1"
            />
          </div>
          <h1 className="gradient-text text-4xl font-bold tracking-tight">
            MecCafe
          </h1>
        </div>

        <DashboardContent profile={profile} avatarUrl={avatarUrl} />
      </main>
    </div>
  );
}
