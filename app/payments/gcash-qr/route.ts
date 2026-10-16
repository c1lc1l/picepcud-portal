import { getCurrentUser } from "@/lib/auth/get-current-user";
import { GCASH_QR_BUCKET, getGcashSettings } from "@/lib/payments/gcash";
import { createClient } from "@/lib/supabase/server";

/** Serves the chapter's GCash QR (private bucket) to signed-in members. */
export async function GET() {
  const { user } = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { settings } = await getGcashSettings();
  if (!settings?.qr_path) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(GCASH_QR_BUCKET)
    .download(settings.qr_path);
  if (error || !data) return new Response("Not found", { status: 404 });

  return new Response(data, {
    headers: {
      "Content-Type": data.type || "image/png",
      // The URL carries a ?v=<updated_at> version, so caching is safe.
      "Cache-Control": "private, max-age=86400",
    },
  });
}
