import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/safe-next";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validates the token with Supabase and refreshes it if expired.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  if (!user && isProtected) {
    // Remember where they were going, so login can send them back there.
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  // Signed-in users get the portal versions of public pages. GET only, so
  // server action POSTs are never redirected mid-flight.
  const portalPath =
    user && request.method === "GET" ? PORTAL_ROUTES[pathname] : undefined;
  if (portalPath) {
    const target =
      pathname === "/login"
        ? safeNextPath(request.nextUrl.searchParams.get("next"), portalPath)
        : portalPath;
    const url = new URL(target, request.url);
    const redirect = NextResponse.redirect(url);
    // Keep any refreshed session cookies set above.
    response.cookies
      .getAll()
      .forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

const PORTAL_ROUTES: Record<string, string> = {
  "/": "/dashboard",
  "/events": "/dashboard/events",
  "/login": "/dashboard",
  "/register": "/dashboard",
};
