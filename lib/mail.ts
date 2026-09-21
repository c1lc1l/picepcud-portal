import { Resend } from "resend";
import PaymentApprovedEmail from "@/emails/PaymentApprovedEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// Sandbox sender; swap for a verified domain address in production.
const FROM = "PICE PCUD <onboarding@resend.dev>";

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
