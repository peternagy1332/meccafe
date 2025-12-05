"use client";

import { motion } from "motion/react";
import { LoginForm } from "@/components/login-form";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import Link from "next/link";

export default function LoginPage(): React.ReactNode {
  const t = useTranslations("login-page");

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
            className="mb-8 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg overflow-hidden"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <img
                src="/logo.png"
                alt="MecCafe Logo"
                className="h-full w-full object-contain p-1"
              />
            </motion.div>
            <h1 className="gradient-text text-4xl font-bold tracking-tight">
              MecCafe
            </h1>
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
            {t("noAccount")}{" "}
            <Link href="/" className="text-primary hover:underline">
              {t("register")}
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
