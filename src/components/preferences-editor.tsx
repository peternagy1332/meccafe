"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useTranslations } from "next-intl";
import { Camera, RefreshCw, Save, Loader2 } from "lucide-react";

const INTEREST_KEYS = [
  "programming",
  "music",
  "sports",
  "art",
  "gaming",
  "reading",
  "cooking",
  "travel",
  "photography",
  "films",
  "science",
  "languages",
] as const;

const INTEREST_EMOJIS: Record<string, string> = {
  programming: "💻",
  music: "🎵",
  sports: "⚽",
  art: "🎨",
  gaming: "🎮",
  reading: "📚",
  cooking: "👨‍🍳",
  travel: "✈️",
  photography: "📷",
  films: "🎬",
  science: "🔬",
  languages: "🌍",
};

const AGE_RANGES = [
  { value: "range14to16", label: "14-16" },
  { value: "range17to18", label: "17-18" },
  { value: "range19to21", label: "19-21" },
  { value: "range22plus", label: "22+" },
] as const;

const GENDER_KEYS = ["male", "female", "other"] as const;

const GENDER_EMOJIS: Record<string, string> = {
  male: "👨",
  female: "👩",
  other: "🧑",
};

type Interest = (typeof INTEREST_KEYS)[number];
type AgeRange = (typeof AGE_RANGES)[number]["value"];
type Gender = (typeof GENDER_KEYS)[number];

type ProfileData = {
  my_interests: string[];
  my_gender: string;
  my_age_range: string;
  pref_interests: string[];
  pref_gender: string | null;
  pref_age_range: string | null;
  avatar_path: string | null;
};

type PreferencesEditorProps = {
  profile: ProfileData;
  avatarUrl: string | null;
  onSaved?: () => void;
};

export function PreferencesEditor({
  profile,
  avatarUrl,
  onSaved,
}: PreferencesEditorProps): React.ReactNode {
  const t = useTranslations("preferences-editor");
  const tReg = useTranslations("registration-form");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [formData, setFormData] = useState({
    prefInterests: (profile.pref_interests || []) as Interest[],
    prefAgeRange: (profile.pref_age_range || null) as AgeRange | null,
    prefGender: (profile.pref_gender || null) as Gender | null,
    myInterests: (profile.my_interests || []) as Interest[],
    myGender: (profile.my_gender || null) as Gender | null,
    myAgeRange: (profile.my_age_range || null) as AgeRange | null,
    avatar: null as File | null,
    avatarPreview: avatarUrl,
  });

  const updateMutation = trpc.profile.updatePreferences.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      setIsLoading(false);
      if (onSaved) {
        onSaved();
      }
    },
    onError: (error) => {
      console.error("Error:", error);
      setIsLoading(false);
    },
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
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

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

  const handleSave = async (): Promise<void> => {
    setIsLoading(true);

    const updateData: {
      myInterests?: Interest[];
      myGender?: Gender;
      myAgeRange?: AgeRange;
      prefInterests?: Interest[];
      prefGender?: Gender | null;
      prefAgeRange?: AgeRange | null;
      avatarBase64?: string;
      avatarContentType?: string;
    } = {
      myInterests: formData.myInterests,
      myGender: formData.myGender!,
      myAgeRange: formData.myAgeRange!,
      prefInterests: formData.prefInterests,
      prefGender: formData.prefGender,
      prefAgeRange: formData.prefAgeRange,
    };

    if (formData.avatar) {
      const reader = new FileReader();
      reader.onload = (): void => {
        const base64 = (reader.result as string).split(",")[1];
        updateMutation.mutate({
          ...updateData,
          avatarBase64: base64,
          avatarContentType: formData.avatar!.type,
        });
      };
      reader.readAsDataURL(formData.avatar);
    } else {
      updateMutation.mutate(updateData);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            {t("edit")}
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t("viewMode.message")}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("editing.title")}</h3>
        <Button
          onClick={() => {
            setIsEditing(false);
            stopCamera();
          }}
          variant="ghost"
          size="sm"
        >
          {t("editing.cancel")}
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="mb-3 text-sm font-medium">{t("sections.preferences")}</h4>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                {t("labels.prefInterests")}
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_KEYS.map((interest) => (
                  <Button
                    key={interest}
                    variant="chip"
                    size="chip"
                    selected={formData.prefInterests.includes(interest)}
                    onClick={() => toggleInterest(interest, "pref")}
                  >
                    <span>{INTEREST_EMOJIS[interest]}</span>
                    <span>{tReg(`interests.${interest}`)}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                {t("labels.prefAgeRange")}
              </label>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGES.map((age) => (
                  <Button
                    key={age.value}
                    variant="chip"
                    size="sm"
                    selected={formData.prefAgeRange === age.value}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, prefAgeRange: age.value }))
                    }
                  >
                    {age.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                {t("labels.prefGender")}
              </label>
              <div className="flex flex-wrap gap-2">
                {GENDER_KEYS.map((gender) => (
                  <Button
                    key={gender}
                    variant="chip"
                    size="sm"
                    selected={formData.prefGender === gender}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, prefGender: gender }))
                    }
                  >
                    <span className="text-lg">{GENDER_EMOJIS[gender]}</span>
                    <span>{tReg(`genders.${gender}`)}</span>
                  </Button>
                ))}
                <Button
                  variant="chip"
                  size="sm"
                  selected={formData.prefGender === null}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, prefGender: null }))
                  }
                >
                  {tReg("genders.anyone")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-medium">{t("sections.myInfo")}</h4>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                {t("labels.myInterests")}
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_KEYS.map((interest) => (
                  <Button
                    key={interest}
                    variant="chip"
                    size="chip"
                    selected={formData.myInterests.includes(interest)}
                    onClick={() => toggleInterest(interest, "my")}
                  >
                    <span>{INTEREST_EMOJIS[interest]}</span>
                    <span>{tReg(`interests.${interest}`)}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                {t("labels.myGender")}
              </label>
              <div className="flex flex-wrap gap-2">
                {GENDER_KEYS.map((gender) => (
                  <Button
                    key={gender}
                    variant="chip"
                    size="sm"
                    selected={formData.myGender === gender}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, myGender: gender }))
                    }
                  >
                    <span className="text-lg">{GENDER_EMOJIS[gender]}</span>
                    <span>{tReg(`genders.${gender}`)}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                {t("labels.myAgeRange")}
              </label>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGES.map((age) => (
                  <Button
                    key={age.value}
                    variant="chip"
                    size="sm"
                    selected={formData.myAgeRange === age.value}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, myAgeRange: age.value }))
                    }
                  >
                    {age.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                {t("labels.avatar")}
              </label>
              <canvas ref={canvasRef} className="hidden" />
              {formData.avatarPreview ? (
                <div className="relative inline-block">
                  <img
                    src={formData.avatarPreview}
                    alt={t("avatar.alt")}
                    className="h-24 w-24 rounded-full border-2 border-primary object-cover"
                  />
                  <motion.button
                    className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, avatar: null, avatarPreview: null }));
                      startCamera();
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.button>
                </div>
              ) : isCameraActive ? (
                <div className="flex flex-col items-start gap-2">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-primary">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full scale-x-[-1] object-cover"
                    />
                  </div>
                  <Button onClick={capturePhoto} size="sm">
                    <Camera className="h-4 w-4" />
                    {t("avatar.takePhoto")}
                  </Button>
                </div>
              ) : (
                <Button onClick={startCamera} variant="outline" size="sm">
                  <Camera className="h-4 w-4" />
                  {t("avatar.changePhoto")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={
          isLoading ||
          formData.prefInterests.length === 0 ||
          formData.myInterests.length === 0 ||
          !formData.myGender ||
          !formData.myAgeRange
        }
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("editing.saving")}
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {t("editing.save")}
          </>
        )}
      </Button>
    </motion.div>
  );
}
