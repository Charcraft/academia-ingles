"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  User,
  Settings,
  Flame,
  Star,
  Menu,
  X,
  Stethoscope,
  Home,
  LogOut,
} from "lucide-react";
import { cn, getCEFRBadgeColor } from "@/lib/utils";
import { useStore } from "@/store";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lessons", label: "My Lessons", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/profile", label: "Settings", icon: Settings },
];

const overlayVariants = {
  open: { opacity: 1 },
  closed: { opacity: 0 },
};

interface DashboardShellProps {
  profile: Profile | null;
  children: React.ReactNode;
}

export default function DashboardShell({ profile, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const setProfile = useStore((s) => s.setProfile);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfile(profile);
    }
  }, [profile, setProfile]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }, [router]);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const dailyGoal = profile?.daily_goal ?? 120;
  const dailyMinutes = profile?.daily_minutes_today ?? 45;
  const dailyProgress = Math.min((dailyMinutes / dailyGoal) * 100, 100);

  return (
    <div className="flex h-screen overflow-hidden bg-[#121212]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-72 flex-col border-r border-charcoal-700/50 bg-charcoal-950 lg:relative lg:z-0",
          mobileOpen ? "block" : "hidden lg:flex"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-3 border-b border-charcoal-700/50 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15">
            <Stethoscope className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 leading-tight">
              English for
            </h1>
            <p className="text-lg font-bold text-teal-400 leading-tight">
              Healthcare
            </p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-teal-500/10 text-teal-400"
                    : "text-slate-400 hover:bg-charcoal-800 hover:text-slate-200"
                )}
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user card */}
        <div className="border-t border-charcoal-700/50 px-4 py-4 space-y-2">
          {profile && (
            <div className="flex items-center gap-3 rounded-xl bg-charcoal-800/60 px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/20 text-sm font-semibold text-teal-400">
                {profile.first_name?.[0]?.toUpperCase() ?? "?"}
                {profile.last_name?.[0]?.toUpperCase() ?? ""}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">
                  {profile.first_name} {profile.last_name}
                </p>
                <span className={getCEFRBadgeColor(profile.current_level)}>
                  {profile.current_level}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Link
              href="/"
              onClick={closeMobile}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-charcoal-800 hover:text-slate-200"
              title="Salir al inicio (sin cerrar sesión)"
            >
              <Home className="h-4 w-4" />
              Salir
            </Link>
            <button
              onClick={handleLogout}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-danger/10 hover:text-danger"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              Salir de sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="flex items-center justify-between border-b border-charcoal-700/50 bg-charcoal-950/80 backdrop-blur-sm px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-charcoal-800 hover:text-slate-200 lg:hidden"
              aria-label="Toggle sidebar"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Streak badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-400">
                {profile?.streak ?? 0}
              </span>
            </div>

            {/* XP badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">
                {profile?.total_xp ?? 0} XP
              </span>
            </div>

            {/* Daily progress bar */}
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-charcoal-700">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {dailyMinutes}/{dailyGoal} min today
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-6xl"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
