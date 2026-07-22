"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  User,
  Globe,
  Phone,
  Briefcase,
  AlertTriangle,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  HourglassIcon,
} from "lucide-react";
import { cn, getValidationBadge } from "@/lib/utils";
import { useStore } from "@/store";
import { countries, professions, examOptions } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { ExamType } from "@/types";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);

  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [profession, setProfession] = useState(profile?.profession ?? "");
  const [examPath, setExamPath] = useState<ExamType>(
    (profile?.exam_path as ExamType) ?? "undecided"
  );
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal ?? 120);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updates = {
        first_name: firstName,
        last_name: lastName,
        country,
        phone,
        profession,
        exam_path: examPath,
        daily_goal: dailyGoal,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("profiles")
        .upsert({ id: user.id, email: user.email, ...updates }, { onConflict: "id" });

      if (error) throw error;

      // Update local store
      if (profile) {
        setProfile({ ...profile, ...updates, exam_path: examPath });
      }

      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }, [firstName, lastName, country, phone, profession, examPath, dailyGoal, profile, setProfile]);

  const validationInfo = getValidationBadge(profile?.validation_status ?? "pending");

  const dailyGoalPct = ((dailyGoal - 30) / (180 - 30)) * 100;

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">Profile & Settings</h1>
        <p className="mt-1 text-slate-400">Manage your account and learning preferences.</p>
      </motion.div>

      {/* ── Profile info card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/15 text-2xl font-bold text-teal-400">
            {firstName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              {firstName} {lastName}
            </h2>
            <p className="text-sm text-slate-400">{profile?.email}</p>
            <span
              className={cn(
                "mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                profile?.current_level
                  ? "bg-teal-500/10 text-teal-400"
                  : "bg-slate-500/10 text-slate-400"
              )}
            >
              {profile?.current_level ?? "N/A"}
            </span>
          </div>
        </div>

        {/* Edit form */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="input-field pl-10"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="input-field pl-10"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Country
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <select
                className="input-field pl-10 appearance-none"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="input-field pl-10"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Profession
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <select
                className="input-field pl-10 appearance-none"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
              >
                <option value="">Select profession</option>
                {professions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exam path (conditional for B1+ users) */}
          {profile?.current_level && ["B1", "B2", "C1"].includes(profile.current_level) && (
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Exam Path
              </label>
              <select
                className="input-field"
                value={examPath}
                onChange={(e) => setExamPath(e.target.value as ExamType)}
              >
                <option value="undecided">Seleccionar...</option>
                {examOptions
                  .filter((e) => e.value !== "undecided")
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Tu meta de examen define qu&eacute; tipo de ejercicios y ensayos ver&aacute;s.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* ── Validation status ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Validation Status
        </h2>

        <div className="flex items-center gap-4 rounded-xl bg-charcoal-800/60 p-5">
          {profile?.validation_status === "approved" ? (
            <CheckCircle className="h-8 w-8 text-success flex-shrink-0" />
          ) : profile?.validation_status === "rejected" ? (
            <XCircle className="h-8 w-8 text-danger flex-shrink-0" />
          ) : (
            <HourglassIcon className="h-8 w-8 text-warning flex-shrink-0" />
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className={validationInfo.className}>
                {validationInfo.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {profile?.validation_status === "approved"
                ? "Your professional credentials have been verified. You have full access to all features."
                : profile?.validation_status === "rejected"
                  ? "Your validation was not approved. Please re-submit your credentials or contact support for more details."
                  : "Your professional validation is pending review. Some features may be limited until approved."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Daily goal ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-slate-100 mb-2">
          Daily Learning Goal
        </h2>
        <p className="text-sm text-teal-400 mb-6">
          Tu meta ideal: {dailyGoal} min/d&iacute;a
        </p>

        {/* Slider */}
        <div className="relative mb-2">
          <input
            type="range"
            min={30}
            max={180}
            step={5}
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #14B8A6 ${dailyGoalPct}%, #333333 ${dailyGoalPct}%)`,
              accentColor: "#14B8A6",
            }}
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-slate-500">
          <span>30 min</span>
          <span>60 min</span>
          <span>120 min</span>
          <span>180 min</span>
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Consistency is key. We recommend at least 60 minutes per day for
          steady progress toward C1 in approximately 8 months.
        </p>
      </motion.div>

      {/* ── Danger zone ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card border border-red-500/20 p-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Once you delete your account, there is no going back. All your
          progress, data, and records will be permanently removed.
        </p>
        <button
          className="btn-secondary border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          onClick={() => toast.error("Account deletion is not yet implemented.")}
        >
          Delete Account
        </button>
      </motion.div>
    </div>
  );
}
