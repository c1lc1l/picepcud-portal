import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Officer, RosterSettings } from "./types";
import { isRosterLive } from "./validation";

const OFFICER_FIELDS =
  "id, display_name, title, officer_group, display_order, photo_path, motto, contact_email, links";
const ROSTER_FIELDS =
  "term_label, term_start, term_end, is_published, published_at";

export const getRosterSettings = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("officer_roster")
    .select(ROSTER_FIELDS)
    .maybeSingle();
  return (data as RosterSettings | null) ?? null;
});

/** Whether the public directory (and its nav link) should be shown. */
export async function isOfficerDirectoryLive() {
  return isRosterLive(await getRosterSettings());
}

/**
 * Officers for the public page. RLS only returns rows while the roster is
 * live (or to admins), so this re-checks liveness before showing anything.
 */
export async function getPublicRoster() {
  const settings = await getRosterSettings();
  if (!isRosterLive(settings)) return { settings, officers: [] as Officer[] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("officers")
    .select(OFFICER_FIELDS)
    .order("display_order")
    .order("id");
  return { settings, officers: (data ?? []) as Officer[], error };
}

/** Every officer, for the admin editor. */
export async function getAllOfficers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("officers")
    .select(OFFICER_FIELDS)
    .order("officer_group")
    .order("display_order")
    .order("id");
  return { officers: (data ?? []) as Officer[], error };
}
