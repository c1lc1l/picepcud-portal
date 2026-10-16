"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export type ActionResult = { error: string } | undefined;

export async function signUp(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { email, password, fullName, studentId, yearLevel } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        student_id: studentId,
        year_level: yearLevel,
      },
    },
  });
  if (error) return { error: error.message };

  // No session means email confirmation is required; the login page
  // shows a "check your email" notice for ?registered=1.
  redirect(data.session ? "/dashboard" : "/login?registered=1");
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Public origin for auth email links; prefer the configured site URL. */
async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

export async function requestPasswordReset(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password` },
  );

  // Same response whether or not the account exists, so the form can't be
  // used to discover registered emails. Only rate limits are surfaced.
  if (error?.status === 429) {
    return {
      error: "Too many requests. Please wait a few minutes and try again.",
    };
  }
  if (error) console.error("requestPasswordReset:", error.message);
}

export async function updatePassword(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your reset link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  redirect("/dashboard");
}
