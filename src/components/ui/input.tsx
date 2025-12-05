"use client";

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "motion/react";
import { useState } from "react";

type InputProps = Omit<HTMLMotionProps<"input">, "onChange"> & {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function Input({ className, ...props }: InputProps): React.ReactNode {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.input
      className={cn(
        "flex h-12 w-full rounded-lg border-2 border-input bg-card px-4 py-2 text-base text-foreground transition-all duration-200",
        "placeholder:text-muted-foreground",
        "focus:border-primary focus:outline-none focus:ring-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      animate={{
        boxShadow: isFocused
          ? "0 0 0 3px rgba(139, 69, 19, 0.15)"
          : "0 0 0 0px rgba(139, 69, 19, 0)",
      }}
      transition={{ duration: 0.2 }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...props}
    />
  );
}
