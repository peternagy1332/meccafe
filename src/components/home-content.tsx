"use client";

import { motion } from "motion/react";
import { RegistrationForm } from "@/components/registration-form";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Coffee, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";

export function HomeContent(): React.ReactNode {
  const t = useTranslations("HomeContent");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      >
        <motion.div
          className="rounded-3xl border border-border bg-card p-8 shadow-2xl shadow-primary/5"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col items-center gap-6 text-center">
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <Coffee className="h-10 w-10 text-primary-foreground" />
            </motion.div>
            <div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">
                {t("welcomeBack.title", { default: "Welcome Back!" })}
              </h3>
              <p className="mb-6 text-muted-foreground">
                {t("welcomeBack.message", { default: "You're already logged in. Go to your dashboard to view your matches and update your preferences." })}
              </p>
              <Link href="/dashboard">
                <Button className="w-full">
                  {t("welcomeBack.goToDashboard", { default: "Go to Dashboard" })}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className="rounded-3xl border border-border bg-card p-8 shadow-2xl shadow-primary/5"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <RegistrationForm />
      </motion.div>
    </motion.div>
  );
}
