import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Highlight } from "./types";

const HIGHLIGHT_FIELDS =
  "id, caption, link_url, image_path, display_order, is_active";

/** Active highlights for the public carousel, in display order. */
export async function getPublicHighlights() {
  const supabase = await createClient();
  return supabase
    .from("highlights")
    .select(HIGHLIGHT_FIELDS)
    .eq("is_active", true)
    .order("display_order")
    .order("id")
    .overrideTypes<Highlight[], { merge: false }>();
}

/** Every highlight, for the admin editor. */
export async function getAllHighlights() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("highlights")
    .select(HIGHLIGHT_FIELDS)
    .order("display_order")
    .order("id");
  return { highlights: (data ?? []) as Highlight[], error };
}
