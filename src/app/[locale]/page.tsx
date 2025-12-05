"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { HomeContent } from "@/components/home-content";
import { Users, Calendar, Sparkles } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function FloatingBean({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}): React.ReactNode {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.5 }}
    >
      <motion.span
        className="inline-block text-4xl opacity-20"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 4,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        ☕
      </motion.span>
    </motion.div>
  );
}

const FEATURE_ICONS = [Users, Calendar, Sparkles] as const;
const FEATURE_KEYS = ["interestMatching", "weeklyMatches", "realConnections"] as const;

function AuthCallbackHandler(): React.ReactNode {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");

  useEffect(() => {
    if (code) {
      const next = searchParams.get("next") ?? "/dashboard";
      router.replace(`/${locale}/auth/callback?code=${code}&next=${next}`);
    }
  }, [code, locale, router, searchParams]);

  return null;
}

export default function Home(): React.ReactNode {
  const t = useTranslations("Home");

  return (
    <div className="noise-overlay relative min-h-screen overflow-hidden bg-background">
      <Suspense fallback={null}>
        <AuthCallbackHandler />
      </Suspense>
      {/* Language Switcher and Login Button */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-4">
        <LanguageSwitcher />
        <Link href="/login">
          <Button variant="outline" size="sm">
            {t("login", { default: "Login" })}
          </Button>
        </Link>
      </div>

      {/* Floating decorations */}
      <FloatingBean className="absolute left-[10%] top-[15%]" delay={0} />
      <FloatingBean className="absolute right-[15%] top-[20%]" delay={0.5} />
      <FloatingBean className="absolute left-[20%] bottom-[25%]" delay={1} />
      <FloatingBean className="absolute right-[10%] bottom-[15%]" delay={1.5} />
      <FloatingBean className="absolute left-[5%] top-[50%]" delay={2} />

      {/* Main content */}
      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center gap-8 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:py-0">
        {/* Left side - Hero info */}
        <motion.div
          className="flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Logo */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Logo className="justify-center lg:justify-start" animated size="md" />
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="mb-4 text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {t("hero.tagline")}
          </motion.p>

          <motion.h2
            className="mb-6 text-4xl font-bold leading-tight text-foreground lg:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {t("hero.title", { default: "Connect over" })}{" "}
            <span className="gradient-text">
              {t("hero.titleHighlight", { default: "coffee" })}
            </span>
          </motion.h2>

          <motion.p
            className="mb-4 max-w-md text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {t("hero.description", {
              default:
                "Meet fellow students who share your interests. Every week, we match you with someone new for a coffee chat. Build real connections beyond the classroom.",
            })}
          </motion.p>

          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <a
              href="/plakat.pdf"
              download
              className="text-sm text-primary hover:underline"
            >
              {t("hero.poster", {
                default:
                  "Want to spread the word? Download and print our poster to hang in your school or share it with others!",
              })}
            </a>
          </motion.div>

          {/* Features */}
          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {FEATURE_KEYS.map((key, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <motion.div
                  key={key}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {t(`features.${key}.title`, {
                        default:
                          key === "interestMatching"
                            ? "Interest Matching"
                            : key === "weeklyMatches"
                              ? "Weekly Matches"
                              : "Real Connections",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`features.${key}.description`, {
                        default:
                          key === "interestMatching"
                            ? "Get matched with students who share your passions"
                            : key === "weeklyMatches"
                              ? "New coffee partner suggestions every week"
                              : "Turn online matches into real-life friendships",
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Right side - Registration form or Dashboard link */}
        <HomeContent />
      </main>
    </div>
  );
}
