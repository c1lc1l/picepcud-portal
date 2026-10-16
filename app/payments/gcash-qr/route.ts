import { getCurrentUser } from "@/lib/auth/get-current-user";
import { GCASH_QR_BUCKET, getGcashSettings } from "@/lib/payments/gcash";
import { createClient } from "@/lib/supabase/server";

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** Serves the chapter's GCash QR (private bucket) to signed-in members.
 * `?download=1` sends it as a named attachment for saving to the phone. */
export async function GET(request: Request) {
  const { user } = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { settings } = await getGcashSettings();
  if (!settings?.qr_path) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(GCASH_QR_BUCKET)
    .download(settings.qr_path);
  if (error || !data) return new Response("Not found", { status: 404 });

  const type = data.type || "image/png";
  const headers: Record<string, string> = {
    "Content-Type": type,
    // The URL carries a ?v=<updated_at> version, so caching is safe.
    "Cache-Control": "private, max-age=86400",
  };
  if (new URL(request.url).searchParams.has("download")) {
    headers["Content-Disposition"] =
      `attachment; filename="PICE-PCUD-GCash-QR.${EXTENSIONS[type] ?? "png"}"`;
  }

  return new Response(data, { headers });
}
