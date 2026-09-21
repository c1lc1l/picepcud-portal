"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { sendPaymentApprovalEmail } from "@/lib/mail";
import { createClient } from "@/lib/supabase/server";

export type ReviewPaymentResult =
  | { error: string }
  | { success: true; warning?: string };

function revalidateAdmin() {
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
}

// Only pending payments can be reviewed; the status filter also makes a
// double-click or stale tab a no-op instead of re-sending the email.
async function reviewPayment(
  paymentId: string,
  changes: { status: "approved" | "rejected"; admin_notes?: string | null }
): Promise<
  | { error: string }
  | {
      payment: {
        id: string;
        user_id: string;
        reference_no: string;
        amount: number | string;
      };
      supabase: Awaited<ReturnType<typeof createClient>>;
    }
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", paymentId)
    .eq("status", "pending")
    .select("id, user_id, reference_no, amount")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Payment not found or already reviewed" };
  return { payment: data, supabase };
}

export async function approvePayment(
  paymentId: string
): Promise<ReviewPaymentResult> {
  const { isAdmin } = await getCurrentUser();
  if (!isAdmin) return { error: "Only admins can approve payments" };

  const result = await reviewPayment(paymentId, { status: "approved" });
  if (!("payment" in result)) return { error: result.error };
  const { payment, supabase } = result;

  revalidateAdmin();

  // The approval is already committed; an email failure is reported, not fatal.
  try {
    const [{ data: profile }, { data: rows }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, student_id")
        .eq("id", payment.user_id)
        .single(),
      // Email lives in auth.users; only the admin RPC can read it.
      supabase.rpc("admin_list_payments", { p_status: "approved" }),
    ]);
    const email = (rows as { id: string; email: string }[] | null)?.find(
      (r) => r.id === payment.id
    )?.email;
    if (!profile || !email) throw new Error("Member email not found");

    await sendPaymentApprovalEmail({
      to: email,
      studentName: profile.full_name,
      studentId: profile.student_id,
      referenceNo: payment.reference_no,
      amount: Number(payment.amount),
    });
  } catch (e) {
    return {
      success: true,
      warning: `Approved, but the confirmation email failed: ${
        e instanceof Error ? e.message : "unknown error"
      }`,
    };
  }

  return { success: true };
}

export async function rejectPayment(
  paymentId: string,
  reason: string
): Promise<ReviewPaymentResult> {
  const { isAdmin } = await getCurrentUser();
  if (!isAdmin) return { error: "Only admins can reject payments" };

  const result = await reviewPayment(paymentId, {
    status: "rejected",
    admin_notes: reason.trim().slice(0, 500) || null,
  });
  if (!("payment" in result)) return { error: result.error };

  revalidateAdmin();
  return { success: true };
}
