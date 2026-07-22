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
import { cn, timeAgo, getCEFRBadgeColor, getValidationBadge, getProfessionIcon, formatMinutes } from "@/lib/utils";
import { countries } from "@/lib/constants";
import type { StudentWithProfile } from "@/types";

// ── Mock Data ─────────────────────────────────────────────────────────────────

const allMockStudents: StudentWithProfile[] = [
  {
    id: "1", first_name: "Maria", last_name: "Garcia", email: "maria@example.com",
    country: "Mexico", country_code: "MX", phone: "+521234567890",
    profession: "Enfermera", license_number: "ENF-12345", experience_years: 5,
    exam_interest: "ielts_academic", current_level: "A2", global_progress: 35,
    daily_goal: 30, daily_minutes_today: 15, role: "student",
    validation_status: "pending", validation_photo_url: null,
    validation_approved_at: null, validation_photo_delete_at: null,
    avatar_url: null, streak: 12,
    last_active_date: new Date().toISOString(), total_xp: 1250,
    exam_path: "ielts_academic", is_blocked: false,
    created_at: "2026-01-15T00:00:00Z", updated_at: new Date().toISOString(),
    speaking_score_avg: 5.5,
  },
  {
    id: "2", first_name: "Carlos", last_name: "Lopez", email: "carlos@example.com",
    country: "Colombia", country_code: "CO", phone: "+573001234567",
    profession: "Enfermero", license_number: "ENF-67890", experience_years: 3,
    exam_interest: "toefl_ibt", current_level: "B1", global_progress: 62,
    daily_goal: 45, daily_minutes_today: 40, role: "student",
    validation_status: "approved", validation_photo_url: null,
    validation_approved_at: "2026-02-10T00:00:00Z", validation_photo_delete_at: null,
    avatar_url: null, streak: 28,
    last_active_date: new Date().toISOString(), total_xp: 4800,
    exam_path: "toefl_ibt", is_blocked: false,
    created_at: "2026-01-20T00:00:00Z", updated_at: new Date().toISOString(),
    speaking_score_avg: 6.5,
  },
  {
    id: "3", first_name: "Juan", last_name: "Dela Cruz", email: "juan@example.com",
    country: "Philippines", country_code: "PH", phone: "+639123456789",
    profession: "Fisioterapeuta", license_number: "FIS-11111", experience_years: 2,
    exam_interest: "undecided", current_level: "A0", global_progress: 8,
    daily_goal: 20, daily_minutes_today: 0, role: "student",
    validation_status: "pending", validation_photo_url: null,
    validation_approved_at: null, validation_photo_delete_at: null,
    avatar_url: null, streak: 0,
    last_active_date: new Date(Date.now() - 8 * 86400000).toISOString(), total_xp: 120,
    exam_path: null, is_blocked: false,
    created_at: "2026-06-01T00:00:00Z", updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    speaking_score_avg: 4.0,
  },
  {
    id: "4", first_name: "Ana", last_name: "Martinez", email: "ana@example.com",
    country: "Spain", country_code: "ES", phone: "+34600123456",
    profession: "Doctora", license_number: "DOC-22222", experience_years: 8,
    exam_interest: "pte_academic", current_level: "B2", global_progress: 88,
    daily_goal: 60, daily_minutes_today: 55, role: "student",
    validation_status: "approved", validation_photo_url: null,
    validation_approved_at: "2026-01-25T00:00:00Z", validation_photo_delete_at: null,
    avatar_url: null, streak: 45,
    last_active_date: new Date().toISOString(), total_xp: 12500,
    exam_path: "pte_academic", is_blocked: false,
    created_at: "2025-12-01T00:00:00Z", updated_at: new Date().toISOString(),
    speaking_score_avg: 7.0,
  },
  {
    id: "6", first_name: "Sofia", last_name: "Ramirez", email: "sofia@example.com",
    country: "Chile", country_code: "CL", phone: "+56212345678",
    profession: "Enfermera", license_number: "ENF-44444", experience_years: 6,
    exam_interest: "ielts_academic", current_level: "B1", global_progress: 91,
    daily_goal: 45, daily_minutes_today: 50, role: "student",
    validation_status: "approved", validation_photo_url: null,
    validation_approved_at: "2026-03-01T00:00:00Z", validation_photo_delete_at: null,
    avatar_url: null, streak: 18,
    last_active_date: new Date().toISOString(), total_xp: 9800,
    exam_path: "ielts_academic", is_blocked: false,
    created_at: "2026-02-01T00:00:00Z", updated_at: new Date().toISOString(),
    speaking_score_avg: 7.5,
  },
];

// ── Mock Activity Log ────────────────────────────────────────────────────────

const mockActivityLog = [
  { id: "a1", lesson: "Medical Vocabulary - Symptoms", level: "A2", score: 85, time_spent: 22, completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "a2", lesson: "Grammar - Present Tenses", level: "A2", score: 78, time_spent: 18, completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: "a3", lesson: "Listening - Patient Intake", level: "A2", score: 92, time_spent: 25, completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a4", lesson: "Speaking Practice - Introductions", level: "A2", score: 70, time_spent: 15, completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a5", lesson: "Checkpoint A1 Review", level: "A1", score: 90, time_spent: 30, completed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a6", lesson: "Basic Greetings", level: "A0", score: 95, time_spent: 12, completed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "a7", lesson: "Medical Equipment Terms", level: "A1", score: 82, time_spent: 20, completed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
];

// ── Mock Speaking Scores ─────────────────────────────────────────────────────

const mockSpeakingScores = [
  { date: "Jul 1", score: 4.5 },
  { date: "Jul 5", score: 5.0 },
  { date: "Jul 8", score: 5.0 },
  { date: "Jul 12", score: 5.5 },
  { date: "Jul 15", score: 5.5 },
  { date: "Jul 18", score: 6.0 },
  { date: "Jul 20", score: 5.5 },
];

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
  const [loading, setLoading] = useState(true);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [validationStatus, setValidationStatus] = useState<string>("pending");

  useEffect(() => {
    const found = allMockStudents.find((s) => s.id === studentId);
    if (found) {
      setStudent(found);
      setIsBlocked(found.is_blocked);
      setValidationStatus(found.validation_status);
    }
    setLoading(false);
  }, [studentId]);

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
            onClick={() => setIsBlocked(!isBlocked)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
              isBlocked
                ? "bg-success/10 text-success hover:bg-success/20"
                : "bg-danger/10 text-danger hover:bg-danger/20"
            )}
          >
            <UserX className="w-4 h-4" />
            {isBlocked ? "Unblock" : "Block"}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-warning/10 text-warning text-sm font-medium hover:bg-warning/20 transition-colors">
            <Shield className="w-4 h-4" />
            Deactivate
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
                  {(student as any).speaking_score_avg?.toFixed(1) ?? "—"}
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
                  onClick={() => setValidationStatus("approved")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => setValidationStatus("rejected")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-colors"
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
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockSpeakingScores}
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
          {mockActivityLog.map((act, i) => (
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
              <div className="bg-charcoal-800 rounded-xl h-80 flex items-center justify-center">
                <p className="text-slate-500 text-sm">
                  Photo placeholder — connect to Supabase Storage
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button className="px-3 py-1.5 rounded-lg bg-charcoal-800 text-slate-300 text-xs hover:bg-charcoal-700 transition-colors">
                  Zoom In
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-charcoal-800 text-slate-300 text-xs hover:bg-charcoal-700 transition-colors">
                  Zoom Out
                </button>
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
