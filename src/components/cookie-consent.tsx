"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie-consent";

type ConsentType = "all" | "necessary";

function subscribeToStorage(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getConsentSnapshot(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return "pending";
}

export function CookieConsent(): React.ReactNode {
  const t = useTranslations("CookieConsent");
  const consent = useSyncExternalStore(subscribeToStorage, getConsentSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);
  
  const showModal = consent === null && !dismissed;

  useEffect(() => {
    if (!showModal) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  const handleConsent = (type: ConsentType): void => {
    localStorage.setItem(STORAGE_KEY, type);
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {showModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed inset-4 z-50 m-auto h-fit max-w-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-consent-title"
          >
            <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-card shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-accent to-secondary" />

              <div className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl">☕</span>
                  </div>
                  <h2
                    id="cookie-consent-title"
                    className="text-xl font-bold text-foreground"
                  >
                    {t("title")}
                  </h2>
                </div>

                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  {t("description")}
                </p>

                <p className="mb-6 text-sm text-muted-foreground">
                  {t.rich("learnMore", {
                    privacyPolicy: (chunks) => (
                      <Link
                        href="/privacy-policy"
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {chunks}
                      </Link>
                    ),
                    terms: (chunks) => (
                      <Link
                        href="/terms-of-service"
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => handleConsent("necessary")}
                  >
                    {t("necessaryOnly")}
                  </Button>
                  <Button
                    variant="default"
                    size="default"
                    onClick={() => handleConsent("all")}
                  >
                    {t("acceptAll")}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
