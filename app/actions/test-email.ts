"use server";

import { createClient } from "@/lib/supabase/server";
import { sendPaymentApprovalEmail } from "@/lib/mail";

export type TestEmailResult = { ok: true; id?: string } | { error: string };

// Admin-only. Resend's sandbox sender only delivers to the Resend account
// owner's address, so set TEST_EMAIL_TO to that inbox (defaults to the
// signed-in admin's email).
export async function sendTestEmail(): Promise<TestEmailResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const to = process.env.TEST_EMAIL_TO ?? user.email;
  if (!to) return { error: "No recipient address" };

  try {
    const data = await sendPaymentApprovalEmail({
      to,
      studentName: "Juan Dela Cruz",
      studentId: "2021-00123",
      referenceNo: "TEST-000001",
      amount: 500,
    });
    return { ok: true, id: data?.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
