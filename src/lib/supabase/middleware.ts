// Shared auth for future NCLEX app
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options: _options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminLoginPath = pathname === "/admin/login";

  // Protected routes (admin/login is its own public entry point, handled below)
  const protectedPaths = ["/dashboard", "/lessons", "/placement", "/profile", "/admin"];
  const isProtectedPath =
    !isAdminLoginPath && protectedPaths.some((path) => pathname.startsWith(path));

  // Auth pages - redirect to dashboard if already logged in
  const authPaths = ["/login", "/signup"];
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Admin route protection (also covers /admin/login for already-logged-in users)
  if (user && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isStaff =
      !!profile && (profile.role === "admin" || profile.role === "case_manager");

    if (isAdminLoginPath) {
      // Already authenticated: skip the login form, go straight to the right place.
      const url = request.nextUrl.clone();
      url.pathname = isStaff ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }

    if (!isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
