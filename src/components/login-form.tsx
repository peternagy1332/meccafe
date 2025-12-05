"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function LoginForm(): React.ReactNode {
  const t = useTranslations("login-form");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (): Promise<void> => {
    if (!email.includes("@")) return;

    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (otpError) {
      setError(otpError.message);
      setIsLoading(false);
    } else {
      setOtpSent(true);
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    if (otp.length !== 6) return;

    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (verifyError) {
      setError(verifyError.message);
      setIsLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  if (otpSent) {
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
            {t("otpSent.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("otpSent.message")} <strong>{email}</strong>
          </p>
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder={t("otp.placeholder")}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            className="text-center text-2xl tracking-widest"
            disabled={isLoading}
          />
          <Button
            onClick={handleVerifyOtp}
            disabled={otp.length !== 6 || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("otp.verifying")}
              </>
            ) : (
              <>
                {t("otp.verify")}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setOtpSent(false);
              setOtp("");
            }}
            disabled={isLoading}
          >
            {t("otp.backToEmail")}
          </Button>
        </div>
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
              handleSendOtp();
            }
          }}
        />
        <Button
          onClick={handleSendOtp}
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
              {t("email.sendOtp")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
