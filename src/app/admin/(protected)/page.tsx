"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
  Zap,
  Loader2,
} from "lucide-react";
import { cn, timeAgo, getProfessionIcon } from "@/lib/utils";
import { countries } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { StudentWithProfile } from "@/types";

interface ActivityItem {
  id: string;
  user: string;
  lesson: string;
  level: string;
  time: string;
  score: number | null;
}

// ── Utility: get country flag ────────────────────────────────────────────────

function getCountryFlag(code: string): string {
  const country = countries.find((c) => c.code === code);
  return country?.flag ?? "🌍";
}

// ── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({
  value,
  suffix = "",
  duration = 1.5,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

// ── Trend Badge ──────────────────────────────────────────────────────────────

function TrendBadge({ value }: { value: number }) {
  const isUp = value > 0;
  const isNeutral = value === 0;
  const Icon = isUp ? TrendingUp : isNeutral ? Minus : TrendingDown;
  const color = isUp
    ? "text-success bg-success/10"
    : isNeutral
    ? "text-slate-400 bg-slate-500/10"
    : "text-danger bg-danger/10";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md",
        color
      )}
    >
      <Icon className="w-3 h-3" />
      {isUp && "+"}
      {value}%
    </span>
  );
}

// ── Stats Card ───────────────────────────────────────────────────────────────

function StatsCard({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
  colorClass,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: number;
  suffix?: string;
  trend?: number;
  colorClass: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-charcoal-950 border border-charcoal-700 rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400 font-medium">{label}</span>
        <div className={cn("p-2 rounded-xl", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-slate-100">
          <AnimatedCounter value={value} suffix={suffix} />
        </span>
        {trend !== undefined && <TrendBadge value={trend} />}
      </div>
    </motion.div>
  );
}

// ── Alert Tabs ───────────────────────────────────────────────────────────────

const alertConfig = {
  inactive: { label: "No entra hace 7 días", emoji: "🔴" },
  streak_drop: { label: "Bajó racha", emoji: "🟡" },
  exam_ready: { label: "Listo para examen", emoji: "🟢" },
  high_potential: { label: "Alto potencial", emoji: "🟣" },
} as const;

type AlertTab = keyof typeof alertConfig;

function getAlertStudents(all: StudentWithProfile[], type: AlertTab): StudentWithProfile[] {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86400000;
  const thirtyDaysAgo = now - 30 * 86400000;

  switch (type) {
    case "inactive":
      return all.filter((s) => {
        if (!s.last_active_date) return true;
        return new Date(s.last_active_date).getTime() < sevenDaysAgo;
      });
    case "streak_drop":
      return all.filter((s) => s.streak >= 1 && s.streak <= 5);
    case "exam_ready":
      return all.filter((s) => s.global_progress > 85);
    case "high_potential":
      return all.filter(
        (s) =>
          s.global_progress > 50 &&
          new Date(s.created_at).getTime() > thirtyDaysAgo
      );
    default:
      return [];
  }
}


// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAlertTab, setActiveAlertTab] = useState<AlertTab>("inactive");
  const [stats, setStats] = useState({
    total: 0,
    activeToday: 0,
    avgProgress: 0,
  });

  const loadDashboard = useCallback(async () => {
    const supabase = createClient();

    const { data: studentsData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student");

    const { data: progressData } = await supabase
      .from("user_progress")
      .select("id, score, completed_at, profiles(first_name, last_name), lessons(title, level)")
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(8);

    setStudents((studentsData ?? []) as unknown as StudentWithProfile[]);

    setActivity(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((progressData ?? []) as any[]).map((p) => ({
        id: p.id,
        user: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : "Unknown student",
        lesson: p.lessons?.title ?? "Lesson",
        level: p.lessons?.level ?? "",
        time: p.completed_at,
        score: p.score,
      }))
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setStats({
      total: students.length,
      activeToday: students.filter((s) => {
        if (!s.last_active_date) return false;
        return s.last_active_date.slice(0, 10) === today;
      }).length,
      avgProgress:
        students.length === 0
          ? 0
          : Math.round(
              students.reduce((sum, s) => sum + s.global_progress, 0) / students.length
            ),
    });
  }, [students]);

  const alertStudents = useMemo(
    () => getAlertStudents(students, activeAlertTab),
    [students, activeAlertTab]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Overview of student activity and performance
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          icon={Users}
          label="Total Students"
          value={stats.total}
          colorClass="bg-teal-500/10 text-teal-400"
        />
        <StatsCard
          icon={Activity}
          label="Active Today"
          value={stats.activeToday}
          colorClass="bg-blue-500/10 text-blue-400"
        />
        <StatsCard
          icon={Zap}
          label="Avg. Progress"
          value={stats.avgProgress}
          suffix="%"
          colorClass="bg-purple-500/10 text-purple-400"
        />
      </div>

      {/* Alert Sections */}
      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Alerts</h2>

        {/* Alert Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(alertConfig) as AlertTab[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveAlertTab(key)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                activeAlertTab === key
                  ? "bg-charcoal-800 border-teal-500/50 text-slate-100"
                  : "bg-charcoal-950 border-charcoal-700 text-slate-400 hover:text-slate-200"
              )}
            >
              {alertConfig[key].emoji} {alertConfig[key].label}
              <span className="ml-2 text-xs text-slate-500">
                ({getAlertStudents(students, key).length})
              </span>
            </button>
          ))}
        </div>

        {/* Alert Student Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAlertTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="overflow-x-auto pb-2"
          >
            {alertStudents.length === 0 ? (
              <div className="bg-charcoal-950 border border-charcoal-700 rounded-2xl p-8 text-center">
                <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
                <p className="text-slate-300 font-medium">All clear!</p>
                <p className="text-slate-500 text-sm mt-1">
                  No students match this alert criteria.
                </p>
              </div>
            ) : (
              <div className="flex gap-4 min-w-max">
                {alertStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    layout
                    className="bg-charcoal-950 border border-charcoal-700 rounded-2xl p-4 w-72 shrink-0 hover:border-teal-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-lg">
                        {getCountryFlag(student.country_code)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {getProfessionIcon(student.profession)}{" "}
                          {student.profession} · {student.current_level}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {student.last_active_date
                          ? timeAgo(student.last_active_date)
                          : "Never"}
                      </span>
                      <span>🔥 {student.streak}d streak</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <a
                        href={`/admin/students/${student.id}`}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-charcoal-800 text-slate-300 text-xs font-medium hover:bg-charcoal-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </a>
                      <a
                        href={`/admin/messages?student=${student.id}`}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 text-xs font-medium hover:bg-teal-500/20 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Recent Activity Feed */}
      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Recent Activity
        </h2>
        <div className="bg-charcoal-950 border border-charcoal-700 rounded-2xl divide-y divide-charcoal-800">
          {activity.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              No completed lessons yet.
            </div>
          ) : (
            activity.map((act, i) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-center gap-4 px-5 py-3 hover:bg-charcoal-800/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">
                    <span className="font-medium">{act.user}</span>{" "}
                    <span className="text-slate-400">completed</span>{" "}
                    <span className="text-teal-400">{act.lesson}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Level {act.level} · {timeAgo(act.time)}
                  </p>
                </div>
                {act.score !== null && (
                  <div className="text-right">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        act.score >= 80
                          ? "text-success"
                          : act.score >= 60
                          ? "text-warning"
                          : "text-danger"
                      )}
                    >
                      {act.score}%
                    </span>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
