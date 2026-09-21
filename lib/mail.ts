import { Resend } from "resend";
import PaymentApprovedEmail from "@/emails/PaymentApprovedEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// Falls back to Resend's sandbox sender, which only delivers to the Resend
// account owner. Set RESEND_FROM_EMAIL to an address on a verified domain.
const FROM =
  process.env.RESEND_FROM_EMAIL ?? "PICE PCUD <onboarding@resend.dev>";

export interface SendPaymentApprovalEmailParams {
  to: string;
  studentName: string;
  studentId: string;
  referenceNo: string;
  amount: number | string;
}

export async function sendPaymentApprovalEmail({
  to,
  studentName,
  studentId,
  referenceNo,
  amount,
}: SendPaymentApprovalEmailParams) {
  const formattedAmount =
    typeof amount === "number"
      ? new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(amount)
      : amount;

  const dateApproved = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeZone: "Asia/Manila",
  }).format(new Date());

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `PICE PCUD Payment Approved - ${referenceNo}`,
    react: PaymentApprovedEmail({
      studentName,
      studentId,
      referenceNo,
      amount: formattedAmount,
      dateApproved,
    }),
  });

  if (error) throw new Error(`Failed to send email: ${error.message}`);
  return data;
}
