"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Flame,
  Star,
  Play,
  Mic,
  Trophy,
  TrendingUp,
  CheckCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { cn, formatMinutes, getCEFRBadgeColor, timeAgo } from "@/lib/utils";
import { useStore } from "@/store";
import type { CEFRLevel } from "@/types";

// ---------------------------------------------------------------------------
// Mock data (structure ready for Supabase)
// ---------------------------------------------------------------------------

const CEFR_LEVELS: CEFRLevel[] = ["A0", "A1", "A2", "B1", "B2", "C1"];

const LEVEL_LESSON_COUNTS: Record<CEFRLevel, number> = {
  A0: 5,
  A1: 8,
  A2: 10,
  B1: 12,
  B2: 10,
  C1: 8,
};

// Mock completed counts per level — simulate a user currently at B1
const MOCK_COMPLETED: Record<CEFRLevel, number> = {
  A0: 5,
  A1: 8,
  A2: 10,
  B1: 4,
  B2: 0,
  C1: 0,
};

const MOCK_RECENT_ACTIVITY = [
  {
    id: "1",
    lessonTitle: "Patient Admission Vocabulary",
    score: 92,
    timeSpent: 25,
    completedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "2",
    lessonTitle: "Present Perfect in Clinical Notes",
    score: 85,
    timeSpent: 30,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "3",
    lessonTitle: "Vital Signs & Body Systems",
    score: 78,
    timeSpent: 22,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const MOCK_WEEKLY_MINUTES = 320;

const MOCK_LAST_INCOMPLETE_LESSON = {
  id: "lesson-b1-5",
  title: "ISBAR Communication Framework",
  level: "B1" as CEFRLevel,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CircularProgress({
  progress,
  size = 140,
  strokeWidth = 10,
}: {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Glow effect */}
      <svg width={size + 20} height={size + 20} className="absolute" aria-hidden="true">
        <defs>
          <filter id="tealGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-charcoal-700"
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          className="text-teal-400"
          style={{ filter: "url(#tealGlow)" }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-slate-100">{Math.round(progress)}%</span>
        <span className="text-xs text-slate-400">hoy</span>
      </div>
    </div>
  );
}

function CEFRNode({
  level,
  completed,
  total,
  isCurrent,
  isLocked,
  onClick,
}: {
  level: CEFRLevel;
  completed: number;
  total: number;
  isCurrent: boolean;
  isLocked: boolean;
  onClick?: () => void;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <motion.button
      onClick={onClick}
      disabled={isLocked && !isCurrent}
      whileHover={!isLocked || isCurrent ? { scale: 1.05 } : undefined}
      whileTap={!isLocked || isCurrent ? { scale: 0.95 } : undefined}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border px-5 py-4 transition-all duration-300 min-w-[110px]",
        isCurrent &&
          "border-teal-500/40 bg-teal-500/10 shadow-lg animate-glow",
        !isCurrent && !isLocked && "border-charcoal-600 bg-charcoal-800/60 hover:border-teal-500/30",
        isLocked && "border-charcoal-700/30 bg-charcoal-800/30 opacity-50 cursor-not-allowed"
      )}
    >
      {/* Badge */}
      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-bold",
          isCurrent && "bg-teal-500 text-white",
          !isCurrent && !isLocked && "bg-teal-500/15 text-teal-400",
          isLocked && "bg-charcoal-700 text-slate-500"
        )}
      >
        {level}
      </span>

      {/* Completion text */}
      <span
        className={cn(
          "text-xs font-medium",
          isCurrent && "text-teal-400",
          !isCurrent && !isLocked && "text-slate-300",
          isLocked && "text-slate-500"
        )}
      >
        {completed}/{total} lessons
      </span>

      {/* Mini progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-charcoal-700">
        <motion.div
          className="h-full rounded-full bg-teal-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>

      <span className="text-[11px] text-slate-500">{pct}%</span>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const dailyMinutes = useStore((s) => s.dailyMinutes);

  // Use profile data or fallback defaults
  const streak = profile?.streak ?? 7;
  const totalXp = profile?.total_xp ?? 1250;
  const currentLevel = (profile?.current_level ?? "B1") as CEFRLevel;
  const dailyGoal = profile?.daily_goal ?? 120;
  const minutesToday = profile?.daily_minutes_today ?? dailyMinutes > 0 ? dailyMinutes : 45;
  const globalProgress = profile?.global_progress ?? 51;
  const firstName = profile?.first_name ?? "Student";

  const dailyProgressPct = Math.min((minutesToday / dailyGoal) * 100, 100);

  const currentLevelIndex = CEFR_LEVELS.indexOf(currentLevel);

  // Total lessons completed across all levels
  const totalCompleted = Object.values(MOCK_COMPLETED).reduce((a, b) => a + b, 0);
  const totalLessonsAll = Object.values(LEVEL_LESSON_COUNTS).reduce((a, b) => a + b, 0);

  // Average score from recent activity
  const avgScore =
    MOCK_RECENT_ACTIVITY.reduce((sum, a) => sum + a.score, 0) / MOCK_RECENT_ACTIVITY.length;

  // Estimated time remaining (assumes 53 total lessons, 27 done, ~30 min per lesson)
  const remainingLessons = totalLessonsAll - totalCompleted;
  const estimatedWeeks = Math.ceil((remainingLessons * 30) / (dailyGoal * 5)); // 5 days/week

  async function handleContinueLearning() {
    // In production, fetch the last incomplete lesson from Supabase
    void router.push(`/lessons/${MOCK_LAST_INCOMPLETE_LESSON.id}`);
  }

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-slate-400">
            Let&apos;s keep building your medical English today.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-4 py-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <span className="text-sm font-semibold text-orange-400">{streak} days</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-4 py-2">
            <Star className="h-5 w-5 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">{totalXp} XP</span>
          </div>
          <span className={cn(getCEFRBadgeColor(currentLevel), "px-4 py-2")}>
            {currentLevel}
          </span>
        </div>
      </motion.div>

      {/* ── Quick Actions & Daily Motivation ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card-hover flex flex-col gap-4 p-6"
        >
          <h2 className="text-lg font-semibold text-slate-100">Quick Actions</h2>
          <button
            onClick={handleContinueLearning}
            className="btn-primary w-full"
          >
            <Play className="h-4 w-4" />
            Continue Learning
          </button>
          <button
            onClick={() => router.push("/speaking")}
            className="btn-secondary w-full"
          >
            <Mic className="h-4 w-4" />
            Practice Speaking
          </button>
        </motion.div>

        {/* Daily motivation / progress ring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card-hover flex flex-col items-center gap-4 p-6 lg:col-span-2"
        >
          <h2 className="text-center text-lg font-semibold text-slate-100">
            Tu meta ideal: {dailyGoal} min/dia
          </h2>

          <CircularProgress progress={dailyProgressPct} />

          <p className="text-center text-sm text-teal-400 max-w-md">
            Llevas {minutesToday}/{dailyGoal} min hoy. ¡Sigue as&iacute;, tu meta de 8
            meses depende de esto!
          </p>
        </motion.div>
      </div>

      {/* ── Global Progress ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-100">
            De Cero a C1: {globalProgress}% completado
          </h2>
          <span className="text-xs text-slate-400">
            ~{estimatedWeeks} weeks remaining
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-charcoal-700">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-teal-600 via-teal-500 to-teal-400"
            initial={{ width: 0 }}
            animate={{ width: `${globalProgress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Based on your current pace of ~{dailyGoal} min/day, you&apos;re on track.
        </p>
      </motion.div>

      {/* ── CEFR Roadmap ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-4"
      >
        <h2 className="text-lg font-semibold text-slate-100">CEFR Roadmap</h2>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {CEFR_LEVELS.map((level, _idx) => {
            const idxOfLevel = CEFR_LEVELS.indexOf(level);
            const isCurrent = idxOfLevel === currentLevelIndex;
            const isLocked = idxOfLevel > currentLevelIndex;
            const completed = isLocked ? 0 : MOCK_COMPLETED[level];
            const total = LEVEL_LESSON_COUNTS[level];

            return (
              <CEFRNode
                key={level}
                level={level}
                completed={completed}
                total={total}
                isCurrent={isCurrent}
                isLocked={isLocked}
                onClick={() => {
                  if (!isLocked) {
                    router.push("/lessons");
                  }
                }}
              />
            );
          })}
        </div>
      </motion.div>

      {/* ── Stats Grid + Recent Activity ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Your Stats</h2>

          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={BookOpen}
              label="Lessons Completed"
              value={totalCompleted}
              color="text-teal-400"
            />
            <StatCard
              icon={Trophy}
              label="Average Score"
              value={`${Math.round(avgScore)}%`}
              color="text-amber-400"
            />
            <StatCard
              icon={Flame}
              label="Study Streak"
              value={`${streak} days`}
              color="text-orange-400"
            />
            <StatCard
              icon={TrendingUp}
              label="Weekly Minutes"
              value={formatMinutes(MOCK_WEEKLY_MINUTES)}
              color="text-blue-400"
            />
          </div>
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Recent Activity
          </h2>

          <div className="space-y-3">
            {MOCK_RECENT_ACTIVITY.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-xl bg-charcoal-800/50 px-4 py-3 transition-colors hover:bg-charcoal-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
                    <CheckCircle className="h-4 w-4 text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {activity.lessonTitle}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{activity.timeSpent} min</span>
                      <span>&middot;</span>
                      <span>{timeAgo(activity.completedAt)}</span>
                    </div>
                  </div>
                </div>
                <span className="ml-4 text-sm font-semibold text-teal-400">
                  {activity.score}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card helper
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-charcoal-800/60 p-4">
      <Icon className={cn("mb-2 h-5 w-5", color)} />
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-100">{value}</p>
    </div>
  );
}
