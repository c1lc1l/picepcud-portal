---
inclusion: auto
name: server-actions-email
description: Standards for Next.js Server Actions, role-based authorization guards, and Resend transactional email dispatches.
---

# Server Actions & Email Notification Standards

## Structured Action Response Pattern

All Server Actions under `app/actions/*` must return structured objects rather than throwing unhandled exceptions. Successful non-fatal warnings belong in typed `data`; failures return an `error`:

```ts
export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
```

Actions whose only successful path calls Next.js `redirect()` are documented control-flow exceptions because `redirect()` never returns.

## Admin Authorization Guard

Every administrative server action must verify the active user session and admin role using #[[file:lib/auth/get-current-user.ts]] prior to executing any mutation:

```ts
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function approvePayment(
  paymentId: string
): Promise<ActionResponse<{ warning?: string }>> {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== "admin") {
    return { success: false, error: "Unauthorized: Admin privileges required." };
  }
  // Execute database mutation...
}
```

## Non-Blocking Resend Email Dispatch

- Approval receipts are dispatched via `sendPaymentApprovalEmail()` in #[[file:lib/mail.ts]] using #[[file:emails/PaymentApprovedEmail.tsx]].
- **Sandbox Limitation:** While running under `onboarding@resend.dev`, emails only deliver to the verified developer account (`process.env.TEST_EMAIL_TO`).
- **Failure Isolation:** Wrap email triggers in an isolated `try/catch`. An email dispatch failure must **never** roll back an approved payment record. Return a sanitized warning rather than raw provider details:

```ts
// 1. Mutate database record
const { error: dbError } = await supabase
  .from("payments")
  .update({ status: "approved", updated_at: new Date().toISOString() })
  .eq("id", paymentId);

if (dbError) return { success: false, error: dbError.message };

// 2. Dispatch email receipt (isolated)
try {
  await sendPaymentApprovalEmail({
    to: memberEmail,
    studentName: profile.full_name,
    studentId: profile.student_id,
    referenceNo: payment.reference_no,
    amount: payment.amount,
  });
} catch (mailError) {
  console.error("Resend API delivery failed (non-fatal):", mailError);
  return {
    success: true,
    data: { warning: "Payment approved, but confirmation delivery failed." },
  };
}

return { success: true };
```
