import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function Footer(): Promise<React.ReactNode> {
  const t = await getTranslations("Footer");

  return (
    <footer className="border-t border-border bg-card py-6">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
            {t.rich("content", {
              default: "Privacy Policy • Terms of Service",
              privacyPolicyLink: (chunks) => (
                <Link
                  href="/privacy-policy"
                  className="hover:text-foreground transition-colors"
                >
                  {chunks}
                </Link>
              ),
              termsOfServiceLink: (chunks) => (
                <Link
                  href="/terms-of-service"
                  className="hover:text-foreground transition-colors"
                >
                  {chunks}
                </Link>
              ),
            })}
          </div>
          <div className="text-sm text-muted-foreground">
            {t.rich("attribution", {
              default: "Made in 🇪🇺 by Peter with ❤️ and ☕️",
              peterLink: (chunks) => (
                <a
                  href="https://www.linkedin.com/in/peternagy1332/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline transition-colors"
                >
                  {chunks}
                </a>
              ),
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
