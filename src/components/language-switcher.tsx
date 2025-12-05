"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

const localeFlags: Record<Locale, string> = {
  hu: "🇭🇺",
  en: "🇬🇧",
};

export function LanguageSwitcher(): React.ReactNode {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale() as Locale;
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
      <span className="text-lg">{localeFlags[locale as Locale]}</span>
      {t(locale, { default: locale === "hu" ? "Magyar" : "English" })}
    </Button>
  );
}
