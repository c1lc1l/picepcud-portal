import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const GCASH_QR_BUCKET = "gcash-qr";

/** Receiving GCash account for chapter dues, as shown to members. */
export type GcashAccount = {
  accountName: string;
  role: string;
  number: string;
  hasQr: boolean;
  /** Changes whenever settings are saved; busts the QR image cache. */
  version: string;
};

type GcashSettingsRow = {
  account_name: string;
  account_role: string;
  account_number: string;
  qr_path: string | null;
  updated_at: string;
};

/** Raw settings row (admins and signed-in members can read it). */
export const getGcashSettings = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gcash_settings")
    .select("account_name, account_role, account_number, qr_path, updated_at")
    .maybeSingle();
  return { settings: (data as GcashSettingsRow | null) ?? null, error };
});

/** Member-facing account, or null when an admin hasn't set it up yet. */
export async function getGcashAccount(): Promise<GcashAccount | null> {
  const { settings } = await getGcashSettings();
  if (!settings || (!settings.account_number && !settings.qr_path)) {
    return null;
  }
  return {
    accountName: settings.account_name,
    role: settings.account_role,
    number: settings.account_number,
    hasQr: Boolean(settings.qr_path),
    version: settings.updated_at,
  };
}
