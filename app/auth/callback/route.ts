import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolve `next` against this site and reject anything that lands on another
 * origin (e.g. `//evil.com` or `/\evil.com`), so the link can't redirect
 * off-site.
 */
function safeNext(value: string | null, base: URL) {
  if (!value) return "/dashboard";
  try {
    const url = new URL(value, base);
    return url.origin === base.origin
      ? `${url.pathname}${url.search}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

/**
 * Landing route for Supabase email links. Handles both the PKCE `code`
 * link (default templates) and the `token_hash` link (custom templates),
 * then forwards to `next` with a session established.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), request.nextUrl);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    ok = !error;
  }

  if (ok) return NextResponse.redirect(new URL(next, request.url));

  const fallback =
    next === "/reset-password" ? "/forgot-password?expired=1" : "/login";
  return NextResponse.redirect(new URL(fallback, request.url));
}
