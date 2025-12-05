"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton(): React.ReactNode {
  const t = useTranslations("LogoutButton");
  const router = useRouter();

  const handleLogout = async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <Button onClick={handleLogout} variant="outline" size="sm">
      <LogOut className="h-4 w-4" />
      {t("logout", { default: "Logout" })}
    </Button>
  );
}
