"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  MessageSquare,
  UserX,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  ChevronRight,
  X,
} from "lucide-react";
import { cn, timeAgo, getCEFRBadgeColor, getProfessionIcon } from "@/lib/utils";
import { countries, professions } from "@/lib/constants";
import type { StudentWithProfile } from "@/types";

// ── Mock Data ─────────────────────────────────────────────────────────────────

const mockStudents: StudentWithProfile[] = [
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
    last_progress: { id: "p1", user_id: "1", lesson_id: "l5", completed: true, score: 85, time_spent: 22, vocab_score: 80, grammar_score: 90, listening_score: 85, speaking_score: 5.5, completed_at: new Date().toISOString(), created_at: new Date().toISOString() },
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
    last_progress: { id: "p2", user_id: "2", lesson_id: "l12", completed: true, score: 92, time_spent: 18, vocab_score: 95, grammar_score: 88, listening_score: 92, speaking_score: 6.5, completed_at: new Date().toISOString(), created_at: new Date().toISOString() },
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
    id: "5", first_name: "Luis", last_name: "Torres", email: "luis@example.com",
    country: "Peru", country_code: "PE", phone: "+51987654321",
    profession: "Paramédico", license_number: "PAR-33333", experience_years: 4,
    exam_interest: "ielts_academic", current_level: "A1", global_progress: 45,
    daily_goal: 30, daily_minutes_today: 20, role: "student",
    validation_status: "rejected", validation_photo_url: null,
    validation_approved_at: null, validation_photo_delete_at: null,
    avatar_url: null, streak: 5,
    last_active_date: new Date(Date.now() - 1 * 86400000).toISOString(), total_xp: 890,
    exam_path: "ielts_academic", is_blocked: true,
    created_at: "2026-03-15T00:00:00Z", updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    speaking_score_avg: 3.5,
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
  {
    id: "7", first_name: "Pedro", last_name: "Silva", email: "pedro@example.com",
    country: "Brazil", country_code: "BR", phone: "+5511998765432",
    profession: "Odontólogo", license_number: "ODO-55555", experience_years: 10,
    exam_interest: "toefl_ibt", current_level: "C1", global_progress: 72,
    daily_goal: 60, daily_minutes_today: 45, role: "student",
    validation_status: "approved", validation_photo_url: null,
    validation_approved_at: "2026-04-10T00:00:00Z", validation_photo_delete_at: null,
    avatar_url: null, streak: 33,
    last_active_date: new Date().toISOString(), total_xp: 15200,
    exam_path: "toefl_ibt", is_blocked: false,
    created_at: "2025-11-15T00:00:00Z", updated_at: new Date().toISOString(),
    speaking_score_avg: 8.0,
  },
  {
    id: "8", first_name: "Elena", last_name: "Diaz", email: "elena@example.com",
    country: "Argentina", country_code: "AR", phone: "+541123456789",
    profession: "Psicóloga", license_number: "PSI-66666", experience_years: 7,
    exam_interest: "pte_academic", current_level: "A2", global_progress: 19,
    daily_goal: 30, daily_minutes_today: 0, role: "student",
    validation_status: "pending", validation_photo_url: null,
    validation_approved_at: null, validation_photo_delete_at: null,
    avatar_url: null, streak: 0,
    last_active_date: new Date(Date.now() - 10 * 86400000).toISOString(), total_xp: 200,
    exam_path: null, is_blocked: false,
    created_at: "2026-05-20T00:00:00Z", updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    speaking_score_avg: 4.5,
  },
];

// ── Level order helper ──────────────────────────────────────────────────────

const levelOrder = ["A0", "A1", "A2", "B1", "B2", "C1"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCountryFlag(code: string): string {
  return countries.find((c) => c.code === code)?.flag ?? "🌍";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return { label: "Aprobado", className: "bg-success/10 text-success border-success/20" };
    case "rejected":
      return { label: "Rechazado", className: "bg-danger/10 text-danger border-danger/20" };
    default:
      return { label: "Pendiente", className: "bg-warning/10 text-warning border-warning/20" };
  }
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminStudentsPage() {
  const [students] = useState<StudentWithProfile[]>(mockStudents);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [validationFilter, setValidationFilter] = useState<string>("all");
  const [professionFilter, setProfessionFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof StudentWithProfile | "name">("last_active_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showValidationPhoto, setShowValidationPhoto] = useState<string | null>(null);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = [...students];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    if (levelFilter !== "all") {
      result = result.filter((s) => s.current_level === levelFilter);
    }

    if (validationFilter !== "all") {
      result = result.filter((s) => s.validation_status === validationFilter);
    }

    if (professionFilter !== "all") {
      result = result.filter((s) => s.profession === professionFilter);
    }

    result.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortField === "name") {
        aVal = `${a.first_name} ${a.last_name}`;
        bVal = `${b.first_name} ${b.last_name}`;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }
      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal ?? 0) - (bVal ?? 0)
        : (bVal ?? 0) - (aVal ?? 0);
    });

    return result;
  }, [students, search, levelFilter, validationFilter, professionFilter, sortField, sortDir]);

  function handleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-teal-400" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-teal-400" />
    );
  };

  const hasActiveFilters =
    search || levelFilter !== "all" || validationFilter !== "all" || professionFilter !== "all";

  function clearFilters() {
    setSearch("");
    setLevelFilter("all");
    setValidationFilter("all");
    setProfessionFilter("all");
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Students</h1>
          <p className="text-slate-400 text-sm mt-1">
            {filtered.length} of {students.length} students
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-charcoal-950 border border-charcoal-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
          />
        </div>

        {/* Level Filter */}
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2.5 bg-charcoal-950 border border-charcoal-700 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500/50 cursor-pointer"
        >
          <option value="all">All Levels</option>
          {levelOrder.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl}
            </option>
          ))}
        </select>

        {/* Validation Filter */}
        <select
          value={validationFilter}
          onChange={(e) => setValidationFilter(e.target.value)}
          className="px-3 py-2.5 bg-charcoal-950 border border-charcoal-700 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500/50 cursor-pointer"
        >
          <option value="all">All Validation</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Profession Filter */}
        <select
          value={professionFilter}
          onChange={(e) => setProfessionFilter(e.target.value)}
          className="px-3 py-2.5 bg-charcoal-950 border border-charcoal-700 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-teal-500/50 cursor-pointer"
        >
          <option value="all">All Professions</option>
          {professions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-charcoal-950 border border-charcoal-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-charcoal-700 text-left">
                <th
                  className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Name <SortIcon field="name" />
                  </span>
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  Country
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden xl:table-cell">
                  Profession
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("validation_status")}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Validation <SortIcon field="validation_status" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("current_level")}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Level <SortIcon field="current_level" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("global_progress")}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Progress <SortIcon field="global_progress" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer select-none hidden sm:table-cell"
                  onClick={() => handleSort("streak")}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Streak <SortIcon field="streak" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer select-none hidden lg:table-cell"
                  onClick={() => handleSort("last_active_date")}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Last Active <SortIcon field="last_active_date" />
                  </span>
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden xl:table-cell">
                  Speaking
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("is_blocked")}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Status <SortIcon field="is_blocked" />
                  </span>
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((student) => {
                  const isExpanded = expandedId === student.id;
                  const valBadge = getStatusBadge(student.validation_status);
                  return (
                    <motion.tr
                      key={student.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "border-b border-charcoal-800 hover:bg-charcoal-800/50 transition-colors cursor-pointer",
                        isExpanded && "bg-charcoal-800/30"
                      )}
                    >
                      <td
                        className="px-4 py-3"
                        colSpan={12}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest("button") || target.closest("a")) return;
                          setExpandedId(isExpanded ? null : student.id);
                        }}
                      >
                        <div className="flex items-center gap-12">
                          <div className="flex items-center gap-2 min-w-0 w-40">
                            <ChevronRight
                              className={cn(
                                "w-4 h-4 text-slate-500 shrink-0 transition-transform",
                                isExpanded && "rotate-90"
                              )}
                            />
                            <span className="text-sm font-medium text-slate-200 truncate">
                              {student.first_name} {student.last_name}
                            </span>
                          </div>
                          <span className="text-sm text-slate-400 truncate hidden md:block w-44">
                            {student.email}
                          </span>
                          <span className="text-sm text-slate-300 hidden lg:block w-20">
                            {getCountryFlag(student.country_code)} {student.country}
                          </span>
                          <span className="text-sm text-slate-400 hidden xl:block w-28">
                            {getProfessionIcon(student.profession)} {student.profession}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border w-24 justify-center",
                              valBadge.className
                            )}
                          >
                            {valBadge.label}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium w-12 justify-center",
                              getCEFRBadgeColor(student.current_level)
                            )}
                          >
                            {student.current_level}
                          </span>
                          <span className="text-sm font-medium text-slate-300 tabular-nums w-12">
                            {student.global_progress}%
                          </span>
                          <span className="text-sm text-slate-400 tabular-nums hidden sm:block w-12">
                            🔥 {student.streak}
                          </span>
                          <span className="text-xs text-slate-500 hidden lg:block w-20">
                            {student.last_active_date
                              ? timeAgo(student.last_active_date)
                              : "—"}
                          </span>
                          <span className="text-sm text-slate-400 tabular-nums hidden xl:block w-16">
                            {(student as any).speaking_score_avg?.toFixed(1) ?? "—"}
                          </span>
                          <span>
                            {student.is_blocked ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                                Blocked
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-success/10 text-success border border-success/20">
                                Active
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <a
                              href={`/admin/students/${student.id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-colors"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <a
                              href={`/admin/messages?student=${student.id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-colors"
                              title="Chat"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                            {student.validation_status === "pending" && (
                              <>
                                <button
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-success hover:bg-success/10 transition-colors"
                                  title="Approve Validation"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors"
                                  title="Reject Validation"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors"
                              title={student.is_blocked ? "Unblock" : "Block"}
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </span>
                        </div>

                        {/* Expanded Detail Card */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-charcoal-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Profile Info */}
                                <div className="space-y-2">
                                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Profile
                                  </h4>
                                  <div className="text-sm space-y-1.5">
                                    <p className="text-slate-300">
                                      <span className="text-slate-500">Phone:</span>{" "}
                                      {student.phone}
                                    </p>
                                    <p className="text-slate-300">
                                      <span className="text-slate-500">License:</span>{" "}
                                      {student.license_number}
                                    </p>
                                    <p className="text-slate-300">
                                      <span className="text-slate-500">Experience:</span>{" "}
                                      {student.experience_years} years
                                    </p>
                                    <p className="text-slate-300">
                                      <span className="text-slate-500">Daily Goal:</span>{" "}
                                      {student.daily_goal} min
                                    </p>
                                    <p className="text-slate-300">
                                      <span className="text-slate-500">XP:</span>{" "}
                                      {student.total_xp.toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                {/* Validation */}
                                <div className="space-y-2">
                                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Validation
                                  </h4>
                                  <div className="space-y-2">
                                    <span
                                      className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border",
                                        valBadge.className
                                      )}
                                    >
                                      {valBadge.label}
                                    </span>
                                    {student.validation_photo_url ? (
                                      <button
                                        onClick={() =>
                                          setShowValidationPhoto(student.id)
                                        }
                                        className="block text-xs text-teal-400 hover:text-teal-300 transition-colors"
                                      >
                                        View validation photo
                                      </button>
                                    ) : (
                                      <p className="text-xs text-slate-500">
                                        No photo uploaded
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Progress Chart */}
                                <div className="space-y-2">
                                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Progress by Level
                                  </h4>
                                  <ProgressBars
                                    progress={student.global_progress}
                                  />
                                </div>

                                {/* Recent Messages Preview */}
                                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Recent Messages
                                  </h4>
                                  <p className="text-xs text-slate-500 italic">
                                    No recent messages with this student.
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-slate-400">No students match your filters.</p>
          </div>
        )}
      </div>

      {/* Validation Photo Modal */}
      <AnimatePresence>
        {showValidationPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowValidationPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-charcoal-950 border border-charcoal-700 rounded-2xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100">
                  Validation Photo
                </h3>
                <button
                  onClick={() => setShowValidationPhoto(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-charcoal-800 rounded-xl h-64 flex items-center justify-center">
                <p className="text-slate-500 text-sm">Photo placeholder</p>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Photo auto-deletes 30 days after approval.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Simple Progress Bars ─────────────────────────────────────────────────────

function ProgressBars({ progress }: { progress: number }) {
  const levels = [
    { label: "A0", pct: Math.min(100, Math.max(0, progress > 0 ? 100 : progress * 2)) },
    { label: "A1", pct: Math.min(100, Math.max(0, progress > 10 ? 100 : (progress - 8) * 10)) },
    { label: "A2", pct: Math.min(100, Math.max(0, progress > 25 ? 100 : (progress - 15) * 7)) },
    { label: "B1", pct: Math.min(100, Math.max(0, progress > 50 ? 100 : (progress - 35) * 5)) },
    { label: "B2", pct: Math.min(100, Math.max(0, progress > 75 ? (progress - 60) * 4 : 0)) },
    { label: "C1", pct: Math.min(100, Math.max(0, progress > 90 ? (progress - 85) * 8 : 0)) },
  ];

  return (
    <div className="space-y-1.5">
      {levels.map((lvl) => (
        <div key={lvl.label} className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-6 text-right tabular-nums">
            {lvl.label}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-charcoal-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${lvl.pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-teal-500"
            />
          </div>
          <span className="text-xs text-slate-600 w-8 tabular-nums">
            {lvl.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}
