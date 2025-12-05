"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useTranslations } from "next-intl";
import { Camera, RefreshCw, Save, Loader2 } from "lucide-react";
import Image from "next/image";
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

type ProfileData = {
  my_interests: Interest[];
  my_gender: Gender;
  my_age_range: AgeRange;
  pref_interests: Interest[];
  pref_gender: Gender | null;
  pref_age_range: AgeRange | null;
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
  const t = useTranslations("PreferencesEditor");
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
          <h3 className="text-lg font-semibold">{t("title", { default: "Preferences" })}</h3>
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            {t("edit", { default: "Edit" })}
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            {t("viewMode.message", { default: "Click Edit to modify your preferences and profile information." })}
          </p>
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
        <h3 className="text-lg font-semibold">
          {t("editing.title", { default: "Editing Preferences" })}
        </h3>
        <Button
          onClick={() => {
            setIsEditing(false);
            stopCamera();
          }}
          variant="ghost"
          size="sm"
        >
          {t("editing.cancel", { default: "Cancel" })}
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="mb-3 text-sm font-medium">
            {t("sections.preferences", { default: "What you're looking for" })}
          </h4>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                {t("labels.prefInterests", { default: "Preferred interests" })}
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
                    <span>
                      {t(`interests.${interest}`, {
                        default: INTEREST_KEYS.find((k) => k === interest) || interest,
                      })}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                {t("labels.prefAgeRange", { default: "Preferred age range" })}
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
                {t("labels.prefGender", { default: "Preferred gender" })}
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
                ))}
                <Button
                  variant="chip"
                  size="sm"
                  selected={formData.prefGender === null}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, prefGender: null }))
                  }
                >
                  {t("genders.anyone", { default: "Anyone" })}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-medium">
            {t("sections.myInfo", { default: "About you" })}
          </h4>
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
                    <span>
                      {t(`interests.${interest}`, {
                        default: INTEREST_KEYS.find((k) => k === interest) || interest,
                      })}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                {t("labels.myGender", { default: "Your gender" })}
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
                {t("labels.avatar", { default: "Profile photo" })}
              </label>
              <canvas ref={canvasRef} className="hidden" />
              {formData.avatarPreview ? (
                <div className="relative inline-block h-24 w-24">
                  <Image
                    src={formData.avatarPreview}
                    alt={t("avatar.alt", { default: "Profile avatar" })}
                    fill
                    className="rounded-full border-2 border-primary object-cover"
                    unoptimized
                  />
                  <motion.button
                    className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg cursor-pointer"
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
                    {t("avatar.takePhoto", { default: "Take Photo" })}
                  </Button>
                </div>
              ) : (
                <Button onClick={startCamera} variant="outline" size="sm">
                  <Camera className="h-4 w-4" />
                  {t("avatar.changePhoto", { default: "Change Photo" })}
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
            {t("editing.saving", { default: "Saving..." })}
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {t("editing.save", { default: "Save Changes" })}
          </>
        )}
      </Button>
    </motion.div>
  );
}
