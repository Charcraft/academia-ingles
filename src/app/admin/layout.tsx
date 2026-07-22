"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  LogOut,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileData } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (
        !profileData ||
        (profileData.role !== "admin" && profileData.role !== "case_manager")
      ) {
        router.replace("/");
        return;
      }

      setProfile(profileData as unknown as Profile);
      setAuthorized(true);
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-charcoal-900 flex flex-col">
      {/* Top Navbar */}
      <header className="h-14 bg-charcoal-950 border-b border-charcoal-700 flex items-center px-6 shrink-0 z-50">
        <div className="flex items-center gap-3 mr-8">
          <Shield className="w-5 h-5 text-teal-500" />
          <span className="font-semibold text-slate-100 text-base tracking-tight">
            Admin Panel
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-500/10 text-teal-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-charcoal-800"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {profile && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-slate-300 font-medium">
                  {profile.first_name} {profile.last_name}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {profile.role.replace("_", " ")}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-bold uppercase">
                {profile.first_name?.[0]}
                {profile.last_name?.[0]}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
