import "server-only";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";

const RECEIPTS_BUCKET = "gcash-receipts";
const SIGNED_URL_TTL_SECONDS = 60;

export async function getSignedReceiptUrl(path: string): Promise<string> {
  const { isAdmin } = await getCurrentUser();
  if (!isAdmin) throw new Error("Only admins can preview receipts");

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create signed URL");
  }
  return data.signedUrl;
}
