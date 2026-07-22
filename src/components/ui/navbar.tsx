"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Flame,
  Zap,
  Settings,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

interface NavbarProps {
  user?: Profile | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "";

  const avatarUrl = user?.avatar_url;

  return (
    <nav className="sticky top-0 z-50 border-b border-charcoal-700/50 bg-charcoal-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-slate-200 transition-colors hover:text-teal-400"
        >
          <Stethoscope className="h-6 w-6 text-teal-500" />
          <span className="text-lg font-bold tracking-tight">
            English for Healthcare
          </span>
        </Link>

        {/* Right: Desktop */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              {/* Streak badge */}
              <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-3 py-1.5">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-semibold text-orange-400">
                  {user.streak}
                </span>
              </div>

              {/* XP badge */}
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">
                  {user.total_xp.toLocaleString()} XP
                </span>
              </div>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-charcoal-700/50 p-1.5 pr-2.5 transition-all",
                    "hover:border-teal-500/30 hover:bg-charcoal-800",
                    dropdownOpen && "border-teal-500/50 bg-charcoal-800"
                  )}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.first_name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-sm font-bold text-teal-400">
                      {initials}
                    </div>
                  )}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-400 transition-transform",
                      dropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl border border-charcoal-700/50 bg-charcoal-800 p-2 shadow-xl shadow-black/40"
                    >
                      <div className="border-b border-charcoal-700/50 px-3 pb-3 pt-1">
                        <p className="text-sm font-semibold text-slate-200">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-charcoal-700/50 hover:text-slate-100"
                        >
                          <User className="h-4 w-4 text-slate-400" />
                          Profile
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-charcoal-700/50 hover:text-slate-100"
                        >
                          <Settings className="h-4 w-4 text-slate-400" />
                          Settings
                        </Link>
                      </div>

                      <div className="border-t border-charcoal-700/50 pt-1">
                        <form action="/auth/signout" method="post">
                          <button
                            type="submit"
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-teal-400"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-teal-600 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-charcoal-800 hover:text-slate-200 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 top-16 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Slide-in panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-16 z-50 w-72 overflow-y-auto border-l border-charcoal-700/50 bg-charcoal-900 px-6 py-6 md:hidden"
            >
              {user ? (
                <div className="flex flex-col gap-6">
                  {/* User info */}
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={user.first_name}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20 text-lg font-bold text-teal-400">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-3">
                    <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-charcoal-700/50 bg-charcoal-800 px-3 py-2.5">
                      <Flame className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-bold text-orange-400">
                        {user.streak}
                      </span>
                    </div>
                    <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-charcoal-700/50 bg-charcoal-800 px-3 py-2.5">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-bold text-amber-400">
                        {user.total_xp.toLocaleString()} XP
                      </span>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="space-y-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-charcoal-800 hover:text-slate-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-charcoal-800 hover:text-slate-100"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-charcoal-800 hover:text-slate-100"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      Settings
                    </Link>
                  </div>

                  {/* Sign out */}
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full rounded-xl border border-charcoal-700/50 px-5 py-3 text-center text-sm font-medium text-slate-200 transition-colors hover:bg-charcoal-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="w-full rounded-xl bg-teal-500 px-5 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-teal-600"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
