"use client";

import { motion } from "motion/react";
import Image from "next/image";

type LogoProps = {
  className?: string;
  animated?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: { image: "h-16 w-16", text: "text-3xl" },
  md: { image: "h-24 w-24", text: "text-5xl" },
  lg: { image: "h-32 w-32", text: "text-6xl" },
};

export function Logo({ className = "", animated = false, size = "md" }: LogoProps): React.ReactNode {
  const { image: imageSize, text: textSize } = sizeClasses[size];

  const imageElement = (
    <Image
      src="/logo.png"
      alt="MecCafé Logo"
      width={size === "sm" ? 64 : size === "md" ? 96 : 128}
      height={size === "sm" ? 64 : size === "md" ? 96 : 128}
      className={`${imageSize} rounded-2xl object-contain shadow-lg`}
    />
  );

  const textElement = (
    <h1 className={`gradient-text ${textSize} font-bold tracking-tight drop-shadow-lg`}>
      MecCafé
    </h1>
  );

  if (animated) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <motion.div
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          {imageElement}
        </motion.div>
        {textElement}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {imageElement}
      {textElement}
    </div>
  );
}
