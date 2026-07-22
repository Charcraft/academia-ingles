"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  Shield,
  UserX,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Award,
  Eye,
  X,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import { cn, timeAgo, getCEFRBadgeColor, getValidationBadge, getProfessionIcon, formatMinutes } from "@/lib/utils";
import { countries } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { StudentWithProfile } from "@/types";

interface ActivityLogItem {
  id: string;
  lesson: string;
  level: string;
  score: number | null;
  time_spent: number;
  completed_at: string;
}

interface SpeakingScorePoint {
  date: string;
  score: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCountryFlag(code: string): string {
  return countries.find((c) => c.code === code)?.flag ?? "🌍";
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentWithProfile | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [speakingScores, setSpeakingScores] = useState<SpeakingScorePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [validationStatus, setValidationStatus] = useState<string>("pending");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();

      if (profile) {
        const p = profile as unknown as StudentWithProfile;
        setStudent(p);
        setIsBlocked(p.is_blocked);
        setValidationStatus(p.validation_status);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: progress } = await (supabase as any)
        .from("user_progress")
        .select("id, score, time_spent, completed_at, lessons(title, level)")
        .eq("user_id", studentId)
        .eq("completed", true)
        .order("completed_at", { ascending: false })
        .limit(10);

      setActivityLog(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((progress ?? []) as any[]).map((a) => ({
          id: a.id,
          lesson: a.lessons?.title ?? "Lesson",
          level: a.lessons?.level ?? "",
          score: a.score,
          time_spent: a.time_spent,
          completed_at: a.completed_at,
        }))
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: recordings } = await (supabase as any)
        .from("speaking_recordings")
        .select("band_score_estimate, created_at")
        .eq("user_id", studentId)
        .not("band_score_estimate", "is", null)
        .order("created_at", { ascending: true })
        .limit(10);

      setSpeakingScores(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((recordings ?? []) as any[])
          .filter((r) => r.band_score_estimate !== null)
          .map((r) => ({
            date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            score: r.band_score_estimate as number,
          }))
      );

      setLoading(false);
    }
    load();
  }, [studentId]);

  async function persistValidation(status: "approved" | "rejected") {
    setActioning(true);
    const supabase = createClient();
    const updates: Record<string, unknown> = { validation_status: status };
    if (status === "approved") updates.validation_approved_at = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("profiles")
      .update(updates)
      .eq("id", studentId);

    if (error) {
      toast.error("Update failed");
    } else {
      setValidationStatus(status);
      toast.success(status === "approved" ? "Validation approved" : "Validation rejected");
    }
    setActioning(false);
  }

  async function persistBlock() {
    setActioning(true);
    const supabase = createClient();
    const nextBlocked = !isBlocked;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ is_blocked: nextBlocked })
      .eq("id", studentId);

    if (error) {
      toast.error("Update failed");
    } else {
      setIsBlocked(nextBlocked);
      toast.success(nextBlocked ? "Student blocked" : "Student unblocked");
    }
    setActioning(false);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-400 text-lg">Student not found</p>
        <button
          onClick={() => router.push("/admin/students")}
          className="mt-4 text-teal-400 hover:text-teal-300 text-sm"
        >
          &larr; Back to Students
        </button>
      </div>
    );
  }

  const valBadge = getValidationBadge(validationStatus);

  return (
    <div className="space-y-6">
      {/* Back Button & Actions Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/admin/students")}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>
        <div className="flex items-center gap-2">
          <a
            href={`/admin/messages?student=${student.id}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500/10 text-teal-400 text-sm font-medium hover:bg-teal-500/20 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </a>
          <button
            onClick={persistBlock}
            disabled={actioning}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40",
              isBlocked
                ? "bg-success/10 text-success hover:bg-success/20"
                : "bg-danger/10 text-danger hover:bg-danger/20"
            )}
          >
            <UserX className="w-4 h-4" />
            {isBlocked ? "Unblock" : "Block"}
          </button>
        </div>
      </div>

      {/* Student Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-charcoal-950 border border-charcoal-700 rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-teal-500/20 flex items-center justify-center text-3xl font-bold text-teal-400 uppercase shrink-0">
            {student.first_name[0]}
            {student.last_name[0]}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h1 className="text-xl font-bold text-slate-100">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-sm text-slate-400">{student.email}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="text-sm text-slate-300 flex items-center gap-1.5">
                {getCountryFlag(student.country_code)} {student.country}
              </span>
              <span className="text-sm text-slate-300 flex items-center gap-1.5">
                {getProfessionIcon(student.profession)} {student.profession}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium",
                  getCEFRBadgeColor(student.current_level)
                )}
              >
                {student.current_level}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border",
                  valBadge.className
                )}
              >
                {valBadge.label}
              </span>
              {isBlocked && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                  Blocked
                </span>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-charcoal-900 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Progress</p>
                <p className="text-lg font-bold text-teal-400">
                  {student.global_progress}%
                </p>
              </div>
              <div className="bg-charcoal-900 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Streak</p>
                <p className="text-lg font-bold text-slate-200">
                  🔥 {student.streak}d
                </p>
              </div>
              <div className="bg-charcoal-900 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Total XP</p>
                <p className="text-lg font-bold text-slate-200">
                  {student.total_xp.toLocaleString()}
                </p>
              </div>
              <div className="bg-charcoal-900 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Speaking Avg</p>
                <p className="text-lg font-bold text-slate-200">
                  {speakingScores.length > 0
                    ? (
                        speakingScores.reduce((sum, s) => sum + s.score, 0) /
                        speakingScores.length
                      ).toFixed(1)
                    : "—"}
                </p>
              </div>
            </div>

            {/* Additional Profile Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm pt-2 border-t border-charcoal-800">
              <div>
                <span className="text-slate-500">Phone:</span>{" "}
                <span className="text-slate-300">{student.phone}</span>
              </div>
              <div>
                <span className="text-slate-500">License:</span>{" "}
                <span className="text-slate-300">
                  {student.license_number}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Experience:</span>{" "}
                <span className="text-slate-300">
                  {student.experience_years} yrs
                </span>
              </div>
              <div>
                <span className="text-slate-500">Daily Goal:</span>{" "}
                <span className="text-slate-300">{student.daily_goal} min</span>
              </div>
              <div>
                <span className="text-slate-500">Exam Interest:</span>{" "}
                <span className="text-slate-300">
                  {student.exam_interest
                    ?.replace("_", " ")
                    .toUpperCase() ?? "Undecided"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Last Active:</span>{" "}
                <span className="text-slate-300">
                  {student.last_active_date
                    ? timeAgo(student.last_active_date)
                    : "Never"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Joined:</span>{" "}
                <span className="text-slate-300">
                  {new Date(student.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Today:</span>{" "}
                <span className="text-slate-300">
                  {formatMinutes(student.daily_minutes_today)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Two-column layout: Validation + Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Validation Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-charcoal-950 border border-charcoal-700 rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Validation
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border",
                  valBadge.className
                )}
              >
                {valBadge.label}
              </span>
              {validationStatus === "approved" && student.validation_approved_at && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Approved{" "}
                  {new Date(
                    student.validation_approved_at
                  ).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Photo Preview */}
            <div
              onClick={() => setShowPhotoModal(true)}
              className="bg-charcoal-800 rounded-xl h-48 flex items-center justify-center border border-dashed border-charcoal-600 cursor-pointer hover:border-teal-500/30 transition-colors group"
            >
              {student.validation_photo_url ? (
                <div className="text-center">
                  <Eye className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                  <p className="text-sm text-teal-400">
                    Click to view photo
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Eye className="w-8 h-8 text-slate-600 mx-auto mb-2 group-hover:text-slate-400 transition-colors" />
                  <p className="text-sm text-slate-500">
                    No validation photo uploaded
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Photo auto-deletes 30 days after approval.
            </p>

            {/* Approve/Reject Buttons */}
            {validationStatus === "pending" && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => persistValidation("approved")}
                  disabled={actioning}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors disabled:opacity-40"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => persistValidation("rejected")}
                  disabled={actioning}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-colors disabled:opacity-40"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-charcoal-950 border border-charcoal-700 rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Level Progress
          </h3>

          <div className="space-y-3">
            {[
              { lvl: "A0", pct: 100 },
              { lvl: "A1", pct: 100 },
              { lvl: "A2", pct: student.global_progress >= 20 ? 75 : 35 },
              { lvl: "B1", pct: student.global_progress >= 40 ? 40 : 0 },
              { lvl: "B2", pct: student.global_progress >= 60 ? 15 : 0 },
              { lvl: "C1", pct: 0 },
            ].map((item) => {
              const isCurrent = item.lvl === student.current_level;
              return (
                <div key={item.lvl} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs font-mono w-8 text-right tabular-nums",
                      isCurrent ? "text-teal-400 font-bold" : "text-slate-500"
                    )}
                  >
                    {item.lvl}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-charcoal-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{
                        duration: 0.8,
                        delay: 0.2,
                        ease: "easeOut",
                      }}
                      className={cn(
                        "h-full rounded-full",
                        item.pct === 100
                          ? "bg-success"
                          : isCurrent
                          ? "bg-teal-500"
                          : "bg-charcoal-600"
                      )}
                    />
                  </div>
                  <span className="text-xs text-slate-600 w-10 tabular-nums">
                    {item.pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Speaking Scores Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-charcoal-950 border border-charcoal-700 rounded-2xl p-5"
      >
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Speaking Scores
        </h3>
        {speakingScores.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-slate-500">
            No speaking recordings yet.
          </div>
        ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={speakingScores}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={{ stroke: "#333" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 9]}
                ticks={[0, 2, 4, 6, 8]}
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={{ stroke: "#333" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "0.75rem",
                  color: "#f1f5f9",
                  fontSize: "0.875rem",
                }}
              />
              <Bar
                dataKey="score"
                fill="#14B8A6"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        )}
      </motion.div>

      {/* Activity Log */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-charcoal-950 border border-charcoal-700 rounded-2xl p-5"
      >
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Activity Log
        </h3>

        <div className="space-y-0 divide-y divide-charcoal-800">
          {activityLog.length === 0 && (
            <p className="text-sm text-slate-500 py-3">No completed lessons yet.</p>
          )}
          {activityLog.map((act, i) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.03 }}
              className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium">
                  {act.lesson}
                </p>
                <p className="text-xs text-slate-500">
                  Level {act.level} · {formatMinutes(act.time_spent)} ·{" "}
                  {timeAgo(act.completed_at)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    (act.score ?? 0) >= 80
                      ? "text-success"
                      : (act.score ?? 0) >= 60
                      ? "text-warning"
                      : "text-danger"
                  )}
                >
                  {act.score !== null ? `${act.score}%` : "—"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Validation Photo Modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowPhotoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-charcoal-950 border border-charcoal-700 rounded-2xl p-6 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100">
                  Validation Photo
                </h3>
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-charcoal-800 rounded-xl h-80 flex items-center justify-center overflow-hidden">
                {student.validation_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.validation_photo_url}
                    alt="Validation document"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="text-slate-500 text-sm">No photo uploaded</p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="ml-auto text-xs text-slate-500">
                  Photo auto-deletes 30 days after approval
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
