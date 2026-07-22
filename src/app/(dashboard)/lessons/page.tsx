import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LessonsIndexPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let level = "a0";
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("profiles")
      .select("current_level")
      .eq("id", user.id)
      .single();
    level = (data?.current_level ?? "A0").toLowerCase();
  }

  redirect(`/lessons/${level}`);
}
