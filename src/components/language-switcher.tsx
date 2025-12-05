"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher(): React.ReactNode {
  const t = useTranslations("language-switcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale): void => {
    router.replace(pathname, { locale: newLocale });
  };

  const otherLocale = locale === "hu" ? "en" : "hu";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => switchLocale(otherLocale)}
      className="gap-2"
    >
      <Globe className="h-4 w-4" />
      {t(otherLocale)}
    </Button>
  );
}
