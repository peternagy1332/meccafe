"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Coffee,
  Mail,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  INTEREST_KEYS,
  INTEREST_EMOJIS,
  AGE_RANGES,
  GENDER_KEYS,
  GENDER_EMOJIS,
  type Interest,
  type AgeRange,
  type Gender,
} from "@/lib/zod";

type FormData = {
  prefInterests: Interest[];
  prefAgeRange: AgeRange | null;
  prefGender: Gender | null;
  myInterests: Interest[];
  myGender: Gender | null;
  myAgeRange: AgeRange | null;
  avatar: File | null;
  avatarPreview: string | null;
  email: string;
  acceptedTerms: boolean;
};

const STEP_KEYS = [
  "prefInterests",
  "prefAge",
  "prefGender",
  "myInterests",
  "myGender",
  "myAge",
  "avatar",
  "email",
] as const;

export function RegistrationForm(): React.ReactNode {
  const t = useTranslations("RegistrationForm");

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [formData, setFormData] = useState<FormData>({
    prefInterests: [],
    prefAgeRange: null,
    prefGender: null,
    myInterests: [],
    myGender: null,
    myAgeRange: null,
    avatar: null,
    avatarPreview: null,
    email: "",
    acceptedTerms: false,
  });

  const stopCamera = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (error) {
      console.error("Camera access denied:", error);
    }
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  const capturePhoto = (): void => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    
    ctx.save();
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);
    ctx.restore();

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        setFormData((prev) => ({
          ...prev,
          avatar: file,
          avatarPreview: URL.createObjectURL(blob),
        }));
        stopCamera();
      }
    }, "image/jpeg", 0.9);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);


  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return formData.prefInterests.length > 0;
      case 2:
        return formData.prefAgeRange !== null;
      case 3:
        return true;
      case 4:
        return formData.myInterests.length > 0;
      case 5:
        return formData.myGender !== null;
      case 6:
        return formData.myAgeRange !== null;
      case 7:
        return formData.avatar !== null;
      case 8:
        return formData.email.includes("@") && formData.acceptedTerms;
      default:
        return false;
    }
  };

  const nextStep = (): void => {
    if (step < 8 && canProceed()) {
      if (step === 7) stopCamera();
      setDirection(1);
      setStep(step + 1);
    }
  };

  const prevStep = (): void => {
    if (step > 1) {
      if (step === 7) stopCamera();
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const toggleInterest = (
    interest: Interest,
    type: "pref" | "my"
  ): void => {
    const key = type === "pref" ? "prefInterests" : "myInterests";
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].includes(interest)
        ? prev[key].filter((i) => i !== interest)
        : [...prev[key], interest],
    }));
  };

  const registerMutation = trpc.profile.register.useMutation({
    onSuccess: () => setIsComplete(true),
    onError: (error) => console.error("Error:", error),
    onSettled: () => setIsLoading(false),
  });

  const handleSubmit = async (): Promise<void> => {
    if (!canProceed() || !formData.avatar) return;

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (): void => {
      const base64 = (reader.result as string).split(",")[1];

      registerMutation.mutate({
        email: formData.email,
        myInterests: formData.myInterests,
        myGender: formData.myGender!,
        myAgeRange: formData.myAgeRange!,
        prefInterests: formData.prefInterests,
        prefGender: formData.prefGender,
        prefAgeRange: formData.prefAgeRange,
        avatarBase64: base64,
        avatarContentType: formData.avatar!.type,
      });
    };
    reader.readAsDataURL(formData.avatar);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  if (isComplete) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Check className="h-10 w-10 text-primary-foreground" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="mb-2 text-2xl font-bold text-foreground">
            {t("success.title", { default: "Check your email!" })}
          </h3>
          <p className="text-muted-foreground">
            {t("success.sentTo", { default: "We sent a magic link to" })}{" "}
            <strong>{formData.email}</strong>
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("success.instruction", { default: "Click the link to complete your registration and get matched!" })}
          </p>
        </motion.div>
        <motion.div
          className="mt-8 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="text-2xl"
              animate={{ y: [0, -10, 0] }}
              transition={{
                delay: 0.8 + i * 0.1,
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              ☕
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  const currentStepKey = STEP_KEYS[step - 1];

  return (
    <div className="flex flex-col">
      {/* Progress */}
      <div className="mb-8 flex justify-center gap-2">
        {STEP_KEYS.map((_, index) => (
          <motion.div
            key={index}
            className={`h-2 w-2 rounded-full ${
              index + 1 === step
                ? "bg-primary"
                : index + 1 < step
                  ? "bg-primary/50"
                  : "bg-muted"
            }`}
            animate={{
              scale: index + 1 === step ? 1.3 : 1,
            }}
            transition={{ type: "spring", stiffness: 300 }}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="relative min-h-0">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative"
          >
            <div className="text-center">
              <motion.h2
                className="mb-2 text-xl font-bold text-foreground"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {t(`steps.${currentStepKey}.title`)}
              </motion.h2>
              <motion.p
                className="mb-6 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {t(`steps.${currentStepKey}.subtitle`)}
              </motion.p>
            </div>

            {/* Step 1 & 4: Interests */}
            {(step === 1 || step === 4) && (
              <motion.div
                className="flex flex-wrap justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {INTEREST_KEYS.map((interest, i) => (
                  <motion.div
                    key={interest}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <Button
                      variant="chip"
                      size="chip"
                      selected={
                        step === 1
                          ? formData.prefInterests.includes(interest)
                          : formData.myInterests.includes(interest)
                      }
                      onClick={() =>
                        toggleInterest(
                          interest,
                          step === 1 ? "pref" : "my"
                        )
                      }
                    >
                      <span>{INTEREST_EMOJIS[interest]}</span>
                      <span>
                        {t(`interests.${interest}`, {
                          default: INTEREST_KEYS.find((k) => k === interest) || interest,
                        })}
                      </span>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Step 2 & 6: Age Range */}
            {(step === 2 || step === 6) && (
              <motion.div
                className="flex flex-wrap justify-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {AGE_RANGES.map((age, i) => (
                  <motion.div
                    key={age.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    <Button
                      variant="chip"
                      size="lg"
                      selected={
                        step === 2
                          ? formData.prefAgeRange === age.value
                          : formData.myAgeRange === age.value
                      }
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          [step === 2 ? "prefAgeRange" : "myAgeRange"]:
                            age.value,
                        }))
                      }
                      className="min-w-[80px]"
                    >
                      {age.label}
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Step 3 & 5: Gender */}
            {(step === 3 || step === 5) && (
              <motion.div
                className="flex flex-wrap justify-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {GENDER_KEYS.map((gender, i) => (
                  <motion.div
                    key={gender}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    <Button
                      variant="chip"
                      size="lg"
                      selected={
                        step === 3
                          ? formData.prefGender === gender
                          : formData.myGender === gender
                      }
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          [step === 3 ? "prefGender" : "myGender"]: gender,
                        }))
                      }
                      className="min-w-[100px]"
                    >
                      <span className="text-xl">{GENDER_EMOJIS[gender]}</span>
                      <span>
                        {t(`genders.${gender}`, {
                          default:
                            gender === "male"
                              ? "Male"
                              : gender === "female"
                                ? "Female"
                                : "Other",
                        })}
                      </span>
                    </Button>
                  </motion.div>
                ))}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      variant="chip"
                      size="lg"
                      selected={formData.prefGender === null}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, prefGender: null }))
                      }
                      className="min-w-[100px]"
                    >
                      <Sparkles className="h-5 w-5" />
                      <span>{t("genders.anyone", { default: "Anyone" })}</span>
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 7: Avatar */}
            {step === 7 && (
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <canvas ref={canvasRef} className="hidden" />
                {formData.avatarPreview ? (
                  <motion.div
                    className="relative"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.avatarPreview!}
                      alt={t("preview", { default: "Preview" })}
                      className="h-40 w-40 rounded-full border-4 border-primary object-cover shadow-lg"
                    />
                    <motion.button
                      className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg cursor-pointer"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, avatar: null, avatarPreview: null }));
                        startCamera();
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <RefreshCw className="h-5 w-5" />
                    </motion.button>
                  </motion.div>
                ) : isCameraActive ? (
                  <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-primary shadow-lg">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full scale-x-[-1] object-cover"
                      />
                    </div>
                    <motion.button
                      className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg cursor-pointer"
                      onClick={capturePhoto}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Camera className="h-5 w-5" />
                      {t("camera.takePhoto", { default: "Take Photo" })}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.button
                    className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-full border-4 border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary cursor-pointer"
                    onClick={startCamera}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Camera className="h-8 w-8" />
                    <span className="text-sm font-medium">
                      {t("camera.startCamera", { default: "Start Camera" })}
                    </span>
                  </motion.button>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("camera.photoHelp", { default: "Your photo helps others recognize you" })}
                </p>
              </motion.div>
            )}

            {/* Step 8: Email */}
            {step === 8 && (
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <div className="w-full max-w-xs">
                  <Input
                    type="email"
                    placeholder={t("email.placeholder", { default: "your@email.com" })}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="text-center"
                  />
                </div>

                <div className="flex items-start gap-2 max-w-xs text-left">
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={formData.acceptedTerms}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          acceptedTerms: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                    />
                  </div>
                  <label htmlFor="terms" className="text-xs text-muted-foreground">
                    {t.rich("terms.agree", {
                      tos: (chunks) => (
                        <Link
                          href="/terms-of-service"
                          className="text-primary hover:underline"
                          target="_blank"
                        >
                          {chunks}
                        </Link>
                      ),
                      pp: (chunks) => (
                        <Link
                          href="/privacy-policy"
                          className="text-primary hover:underline"
                          target="_blank"
                        >
                          {chunks}
                        </Link>
                      ),
                    })}
                  </label>
                </div>

                <p className="max-w-xs text-center text-xs text-muted-foreground">
                  {t("email.help", { default: "We'll send you a magic link to verify your email and complete registration" })}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={prevStep}
          disabled={step === 1}
          className={step === 1 ? "invisible" : ""}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("navigation.back", { default: "Back" })}
        </Button>

        {step < 8 ? (
          <Button onClick={nextStep} disabled={!canProceed()}>
            {t("navigation.next", { default: "Next" })}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || isLoading}
            className="animate-pulse-glow"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Coffee className="h-4 w-4" />
                </motion.div>
                {t("navigation.sending", { default: "Sending..." })}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t("navigation.getMatched", { default: "Get Matched" })}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
