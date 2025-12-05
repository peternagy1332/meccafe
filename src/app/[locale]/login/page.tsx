"use client";

import { motion } from "motion/react";
import { LoginForm } from "@/components/login-form";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import Link from "next/link";

export default function LoginPage(): React.ReactNode {
  const t = useTranslations("LoginPage");

  return (
    <div className="noise-overlay relative min-h-screen overflow-hidden bg-background">
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Logo className="justify-center" animated size="md" />
          </motion.div>

          <motion.div
            className="rounded-3xl border border-border bg-card p-8 shadow-2xl shadow-primary/5"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <LoginForm />
          </motion.div>

          <motion.div
            className="mt-6 text-center text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {t("noAccount", { default: "Don't have an account?" })}{" "}
            <Link href="/" className="text-primary hover:underline">
              {t("register", { default: "Register here" })}
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
