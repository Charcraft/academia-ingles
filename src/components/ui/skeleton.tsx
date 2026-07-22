"use client";

import { cn } from "@/lib/utils";

type SkeletonVariant = "card" | "line" | "circle" | "text-block";

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

const baseClasses = "animate-pulse rounded-lg bg-charcoal-700/60";

const variantClasses: Record<SkeletonVariant, string> = {
  card: "h-40 w-full rounded-2xl",
  line: "h-4 w-full",
  circle: "h-10 w-10 rounded-full",
  "text-block": "space-y-3",
};

export default function Skeleton({
  variant = "line",
  className,
}: SkeletonProps) {
  if (variant === "text-block") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className={cn(baseClasses, "h-4 w-full")} />
        <div className={cn(baseClasses, "h-4 w-4/5")} />
        <div className={cn(baseClasses, "h-4 w-3/5")} />
        <div className={cn(baseClasses, "h-4 w-2/3")} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    />
  );
}
