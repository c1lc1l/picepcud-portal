"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type SubmitPaymentResult = { error: string } | { success: true };

const paymentSchema = z.object({
  referenceNo: z
    .string()
    .trim()
    .regex(/^\d{13}$/, "GCash reference number must be 13 digits"),
  amount: z.number().positive("Amount must be greater than 0").max(100000),
  proofUrl: z.string().min(1),
});

// proofUrl is the storage path inside the private gcash-receipts bucket.
export async function submitPayment(input: {
  referenceNo: string;
  amount: number;
  proofUrl: string;
}): Promise<SubmitPaymentResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };

  const { referenceNo, amount, proofUrl } = parsed.data;
  if (!proofUrl.startsWith(`${user.id}/`)) {
    return { error: "Invalid receipt path" };
  }

  const { error } = await supabase.from("payments").insert({
    user_id: user.id,
    reference_no: referenceNo,
    amount,
    proof_url: proofUrl,
    status: "pending",
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
