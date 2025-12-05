"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export function LoginForm(): React.ReactNode {
  const t = useTranslations("login-form");
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMagicLink = async (): Promise<void> => {
    if (!email.includes("@")) return;

    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: linkError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        shouldCreateUser: false,
      },
    });

    if (linkError) {
      setError(linkError.message);
      setIsLoading(false);
    } else {
      setLinkSent(true);
      setIsLoading(false);
    }
  };

  if (linkSent) {
    return (
      <motion.div
        className="flex flex-col gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <motion.div
            className="mb-4 flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </motion.div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            {t("linkSent.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("linkSent.message")} <strong>{email}</strong>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("linkSent.instruction")}
          </p>
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            setLinkSent(false);
            setEmail("");
          }}
          disabled={isLoading}
        >
          {t("linkSent.backToEmail")}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          {t("title")}
        </h2>
        <p className="text-muted-foreground">{t("subtitle")}</p>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Input
          type="email"
          placeholder={t("email.placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && email.includes("@")) {
              handleSendMagicLink();
            }
          }}
        />
        <Button
          onClick={handleSendMagicLink}
          disabled={!email.includes("@") || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("email.sending")}
            </>
          ) : (
            <>
              {t("email.sendLink")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
