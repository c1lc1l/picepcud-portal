import { createClient } from "@/lib/supabase/server";

export type PublicEvent = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  banner_url: string | null;
  luma_url: string;
};

const PUBLIC_EVENT_FIELDS =
  "id, title, description, event_date, location, banner_url, luma_url";

// Re-exported so server code keeps a single import; client components
// import from "@/lib/event-dates" to avoid pulling in the server client.
export { eventDateFormat, manilaDateParts } from "@/lib/event-dates";

const LUMA_HOSTS = new Set(["lu.ma", "luma.com", "www.luma.com"]);

/** Only https Luma URLs on an approved host, with no credentials or port. */
export function isSafeLumaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      LUMA_HOSTS.has(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port
    );
  } catch {
    return false;
  }
}

/** Active events at or after the request-time instant, soonest first. */
export async function getUpcomingEvents(limit?: number) {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select(PUBLIC_EVENT_FIELDS)
    .eq("is_active", true)
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true });
  if (limit) query = query.limit(limit);
  return query.overrideTypes<PublicEvent[], { merge: false }>();
}

/** Active events before the request-time instant, most recent first. */
export async function getPastEvents(limit = 12) {
  const supabase = await createClient();
  return supabase
    .from("events")
    .select(PUBLIC_EVENT_FIELDS)
    .eq("is_active", true)
    .lt("event_date", new Date().toISOString())
    .order("event_date", { ascending: false })
    .limit(limit)
    .overrideTypes<PublicEvent[], { merge: false }>();
}

/** Tag rows whose event instant is before the request time. */
export function withPastFlag<T extends { event_date: string }>(rows: T[]) {
  const now = Date.now();
  return rows.map((row) => ({
    ...row,
    is_past: new Date(row.event_date).getTime() < now,
  }));
}
