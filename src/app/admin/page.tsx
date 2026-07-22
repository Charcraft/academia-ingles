"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Activity,
  Wifi,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react";
import { cn, timeAgo, getProfessionIcon } from "@/lib/utils";
import { countries } from "@/lib/constants";
import type { StudentWithProfile } from "@/types";

// ── Mock Data ─────────────────────────────────────────────────────────────────

const mockStudents: StudentWithProfile[] = [
  {
    id: "1",
    first_name: "Maria",
    last_name: "Garcia",
    email: "maria@example.com",
    country: "Mexico",
    country_code: "MX",
    phone: "+521234567890",
    profession: "Enfermera",
    license_number: "ENF-12345",
    experience_years: 5,
    exam_interest: "ielts_academic",
    current_level: "A2",
    global_progress: 35,
    daily_goal: 30,
    daily_minutes_today: 15,
    role: "student",
    validation_status: "pending",
    validation_photo_url: null,
    validation_approved_at: null,
    validation_photo_delete_at: null,
    avatar_url: null,
    streak: 12,
    last_active_date: new Date().toISOString(),
    total_xp: 1250,
    exam_path: "ielts_academic",
    is_blocked: false,
    created_at: "2026-01-15T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    first_name: "Carlos",
    last_name: "Lopez",
    email: "carlos@example.com",
    country: "Colombia",
    country_code: "CO",
    phone: "+573001234567",
    profession: "Enfermero",
    license_number: "ENF-67890",
    experience_years: 3,
    exam_interest: "toefl_ibt",
    current_level: "B1",
    global_progress: 62,
    daily_goal: 45,
    daily_minutes_today: 40,
    role: "student",
    validation_status: "approved",
    validation_photo_url: null,
    validation_approved_at: "2026-02-10T00:00:00Z",
    validation_photo_delete_at: null,
    avatar_url: null,
    streak: 28,
    last_active_date: new Date().toISOString(),
    total_xp: 4800,
    exam_path: "toefl_ibt",
    is_blocked: false,
    created_at: "2026-01-20T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    first_name: "Juan",
    last_name: "Dela Cruz",
    email: "juan@example.com",
    country: "Philippines",
    country_code: "PH",
    phone: "+639123456789",
    profession: "Fisioterapeuta",
    license_number: "FIS-11111",
    experience_years: 2,
    exam_interest: "undecided",
    current_level: "A0",
    global_progress: 8,
    daily_goal: 20,
    daily_minutes_today: 0,
    role: "student",
    validation_status: "pending",
    validation_photo_url: null,
    validation_approved_at: null,
    validation_photo_delete_at: null,
    avatar_url: null,
    streak: 0,
    last_active_date: new Date(
      Date.now() - 8 * 86400000
    ).toISOString(),
    total_xp: 120,
    exam_path: null,
    is_blocked: false,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: "4",
    first_name: "Ana",
    last_name: "Martinez",
    email: "ana@example.com",
    country: "Spain",
    country_code: "ES",
    phone: "+34600123456",
    profession: "Doctora",
    license_number: "DOC-22222",
    experience_years: 8,
    exam_interest: "pte_academic",
    current_level: "B2",
    global_progress: 88,
    daily_goal: 60,
    daily_minutes_today: 55,
    role: "student",
    validation_status: "approved",
    validation_photo_url: null,
    validation_approved_at: "2026-01-25T00:00:00Z",
    validation_photo_delete_at: null,
    avatar_url: null,
    streak: 45,
    last_active_date: new Date().toISOString(),
    total_xp: 12500,
    exam_path: "pte_academic",
    is_blocked: false,
    created_at: "2025-12-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    speaking_score_avg: 7.0,
  },
  {
    id: "5",
    first_name: "Luis",
    last_name: "Torres",
    email: "luis@example.com",
    country: "Peru",
    country_code: "PE",
    phone: "+51987654321",
    profession: "Param\u00e9dico",
    license_number: "PAR-33333",
    experience_years: 4,
    exam_interest: "ielts_academic",
    current_level: "A1",
    global_progress: 45,
    daily_goal: 30,
    daily_minutes_today: 20,
    role: "student",
    validation_status: "rejected",
    validation_photo_url: null,
    validation_approved_at: null,
    validation_photo_delete_at: null,
    avatar_url: null,
    streak: 5,
    last_active_date: new Date(
      Date.now() - 1 * 86400000
    ).toISOString(),
    total_xp: 890,
    exam_path: "ielts_academic",
    is_blocked: true,
    created_at: "2026-03-15T00:00:00Z",
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "6",
    first_name: "Sofia",
    last_name: "Ramirez",
    email: "sofia@example.com",
    country: "Chile",
    country_code: "CL",
    phone: "+56212345678",
    profession: "Enfermera",
    license_number: "ENF-44444",
    experience_years: 6,
    exam_interest: "ielts_academic",
    current_level: "B1",
    global_progress: 91,
    daily_goal: 45,
    daily_minutes_today: 50,
    role: "student",
    validation_status: "approved",
    validation_photo_url: null,
    validation_approved_at: "2026-03-01T00:00:00Z",
    validation_photo_delete_at: null,
    avatar_url: null,
    streak: 18,
    last_active_date: new Date().toISOString(),
    total_xp: 9800,
    exam_path: "ielts_academic",
    is_blocked: false,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    speaking_score_avg: 7.5,
  },
  {
    id: "7",
    first_name: "Pedro",
    last_name: "Silva",
    email: "pedro@example.com",
    country: "Brazil",
    country_code: "BR",
    phone: "+5511998765432",
    profession: "Odont\u00f3logo",
    license_number: "ODO-55555",
    experience_years: 10,
    exam_interest: "toefl_ibt",
    current_level: "C1",
    global_progress: 72,
    daily_goal: 60,
    daily_minutes_today: 45,
    role: "student",
    validation_status: "approved",
    validation_photo_url: null,
    validation_approved_at: "2026-04-10T00:00:00Z",
    validation_photo_delete_at: null,
    avatar_url: null,
    streak: 33,
    last_active_date: new Date().toISOString(),
    total_xp: 15200,
    exam_path: "toefl_ibt",
    is_blocked: false,
    created_at: "2025-11-15T00:00:00Z",
    updated_at: new Date().toISOString(),
    speaking_score_avg: 8.0,
  },
  {
    id: "8",
    first_name: "Elena",
    last_name: "Diaz",
    email: "elena@example.com",
    country: "Argentina",
    country_code: "AR",
    phone: "+541123456789",
    profession: "Psic\u00f3loga",
    license_number: "PSI-66666",
    experience_years: 7,
    exam_interest: "pte_academic",
    current_level: "A2",
    global_progress: 19,
    daily_goal: 30,
    daily_minutes_today: 0,
    role: "student",
    validation_status: "pending",
    validation_photo_url: null,
    validation_approved_at: null,
    validation_photo_delete_at: null,
    avatar_url: null,
    streak: 0,
    last_active_date: new Date(
      Date.now() - 10 * 86400000
    ).toISOString(),
    total_xp: 200,
    exam_path: null,
    is_blocked: false,
    created_at: "2026-05-20T00:00:00Z",
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

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
      // Mock: students with streak < 5 and previously had more
      return all.filter((s) => s.streak >= 1 && s.streak <= 5);
    case "exam_ready":
      return all.filter(
        (s) => s.global_progress > 85 && (s as any).speaking_score_avg > 6.5
      );
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

// ── Activity Feed ────────────────────────────────────────────────────────────

const mockActivity = [
  { id: "a1", user: "Maria Garcia", action: "completed", lesson: "Medical Vocabulary - Symptoms", level: "A2", time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), score: 85 },
  { id: "a2", user: "Carlos Lopez", action: "completed", lesson: "Grammar - Past Tenses", level: "B1", time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), score: 92 },
  { id: "a3", user: "Ana Martinez", action: "submitted", lesson: "Speaking Recording", level: "B2", time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), score: null },
  { id: "a4", user: "Pedro Silva", action: "completed", lesson: "Checkpoint 4", level: "C1", time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), score: 78 },
  { id: "a5", user: "Sofia Ramirez", action: "completed", lesson: "Listening - Hospital Scenarios", level: "B1", time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), score: 90 },
  { id: "a6", user: "Maria Garcia", action: "completed", lesson: "Reading Comprehension", level: "A2", time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), score: 88 },
  { id: "a7", user: "Luis Torres", action: "completed", lesson: "Basic Greetings", level: "A1", time: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), score: 65 },
  { id: "a8", user: "Carlos Lopez", action: "completed", lesson: "Medical Ethics Discussion", level: "B1", time: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), score: 95 },
];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [students, _setStudents] = useState<StudentWithProfile[]>(mockStudents);
  const [activeAlertTab, setActiveAlertTab] = useState<AlertTab>("inactive");
  const [stats, setStats] = useState({
    total: 0,
    activeToday: 0,
    onlineNow: 0,
    avgProgress: 0,
  });

  useEffect(() => {
    // Calculate stats from mock data
    const today = new Date().toISOString().slice(0, 10);
    setStats({
      total: students.length,
      activeToday: students.filter((s) => {
        if (!s.last_active_date) return false;
        return s.last_active_date.slice(0, 10) === today;
      }).length,
      onlineNow: 3, // Mock: 3 users currently online
      avgProgress: Math.round(
        students.reduce((sum, s) => sum + s.global_progress, 0) / students.length
      ),
    });
  }, [students]);

  const alertStudents = useMemo(
    () => getAlertStudents(students, activeAlertTab),
    [students, activeAlertTab]
  );

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Total Students"
          value={stats.total}
          trend={12}
          colorClass="bg-teal-500/10 text-teal-400"
        />
        <StatsCard
          icon={Activity}
          label="Active Today"
          value={stats.activeToday}
          trend={5}
          colorClass="bg-blue-500/10 text-blue-400"
        />
        <StatsCard
          icon={Wifi}
          label="Online Now"
          value={stats.onlineNow}
          colorClass="bg-success/10 text-success"
        />
        <StatsCard
          icon={Zap}
          label="Avg. Progress"
          value={stats.avgProgress}
          suffix="%"
          trend={3}
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
          {mockActivity.map((act, i) => (
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
                  <span className="text-slate-400">{act.action}</span>{" "}
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
          ))}
        </div>
      </section>
    </div>
  );
}
