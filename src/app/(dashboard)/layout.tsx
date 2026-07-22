import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./_components/DashboardShell";
import type { Profile } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch profile from profiles table using the user's ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profileRow: any = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profileRow = data;
  } catch {
    // Profile row might not exist yet (e.g. registration not complete)
    profileRow = null;
  }

  // Map database row to Profile type (handling null safety)
  const profile: Profile | null = profileRow
    ? {
        id: profileRow.id,
        email: profileRow.email,
        first_name: profileRow.first_name ?? "",
        last_name: profileRow.last_name ?? "",
        country: profileRow.country ?? "",
        country_code: profileRow.country_code ?? "",
        phone: profileRow.phone ?? "",
        profession: profileRow.profession ?? "",
        license_number: profileRow.license_number ?? "",
        experience_years: profileRow.experience_years ?? 0,
        exam_interest: (profileRow.exam_interest as Profile["exam_interest"]) ?? "undecided",
        current_level: (profileRow.current_level as Profile["current_level"]) ?? "A0",
        global_progress: profileRow.global_progress ?? 0,
        daily_goal: profileRow.daily_goal ?? 120,
        daily_minutes_today: profileRow.daily_minutes_today ?? 0,
        role: (profileRow.role as Profile["role"]) ?? "student",
        validation_status:
          (profileRow.validation_status as Profile["validation_status"]) ?? "pending",
        validation_photo_url: profileRow.validation_photo_url ?? null,
        validation_approved_at: profileRow.validation_approved_at ?? null,
        validation_photo_delete_at: profileRow.validation_photo_delete_at ?? null,
        avatar_url: profileRow.avatar_url ?? null,
        streak: profileRow.streak ?? 0,
        last_active_date: profileRow.last_active_date ?? null,
        total_xp: profileRow.total_xp ?? 0,
        exam_path: (profileRow.exam_path as Profile["exam_path"]) ?? null,
        is_blocked: profileRow.is_blocked ?? false,
        created_at: profileRow.created_at,
        updated_at: profileRow.updated_at,
      }
    : null;

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
