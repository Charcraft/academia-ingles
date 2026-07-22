import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Levels that still get bilingual (Spanish) scaffolding in lessons —
// scaled down as the student advances toward full-English immersion at B1+.
const NATIVE_SUPPORT_LEVELS = ["A0", "A1"];

export function needsNativeLanguageSupport(level: string): boolean {
  return NATIVE_SUPPORT_LEVELS.includes(level);
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

export function getCEFRColor(level: string): string {
  const colors: Record<string, string> = {
    A0: "bg-slate-600",
    A1: "bg-blue-600",
    A2: "bg-cyan-600",
    B1: "bg-teal-600",
    B2: "bg-emerald-600",
    C1: "bg-teal-400",
  };
  return colors[level] || "bg-slate-600";
}

export function getCEFRBadgeColor(level: string): string {
  const colors: Record<string, string> = {
    A0: "badge bg-slate-500/10 text-slate-400",
    A1: "badge bg-blue-500/10 text-blue-400",
    A2: "badge bg-cyan-500/10 text-cyan-400",
    B1: "badge bg-teal-500/10 text-teal-400",
    B2: "badge bg-emerald-500/10 text-emerald-400",
    C1: "badge bg-teal-300/10 text-teal-300",
  };
  return colors[level] || "badge bg-slate-500/10 text-slate-400";
}

export function getValidationBadge(status: string) {
  switch (status) {
    case "approved":
      return { label: "Aprobado", className: "badge-success" };
    case "rejected":
      return { label: "Rechazado", className: "badge-danger" };
    default:
      return { label: "Pendiente", className: "badge-warning" };
  }
}

export function getExamPathLabel(exam: string): string {
  const labels: Record<string, string> = {
    ielts_academic: "IELTS Academic",
    toefl_ibt: "TOEFL iBT",
    pte_academic: "PTE Academic",
    undecided: "Aún no lo sé",
  };
  return labels[exam] || exam;
}

export function getProfessionIcon(profession: string): string {
  const icons: Record<string, string> = {
    Enfermera: "🩺",
    Enfermero: "🩺",
    Doctor: "👨‍⚕️",
    Doctora: "👩‍⚕️",
    Fisioterapeuta: "🦿",
    Paramédico: "🚑",
    Odontólogo: "🦷",
    Psicólogo: "🧠",
    Nutriólogo: "🥗",
  };
  return icons[profession] || "🏥";
}
