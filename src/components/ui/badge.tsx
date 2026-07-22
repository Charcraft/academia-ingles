"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "teal" | "success" | "warning" | "danger" | "slate";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  teal: "bg-teal-500/10 text-teal-400",
  success: "bg-success/10 text-success-DEFAULT",
  warning: "bg-warning/10 text-warning-DEFAULT",
  danger: "bg-danger/10 text-danger-DEFAULT",
  slate: "bg-slate-500/10 text-slate-400",
};

export default function Badge({
  variant = "slate",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
