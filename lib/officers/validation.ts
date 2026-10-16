import type { Officer, RosterSettings } from "./types";

/**
 * Deterministic initials: first letter/number of the first and last name
 * tokens, or up to two characters of a single-token name.
 */
export function officerInitials(name: string): string {
  const tokens = name
    .trim()
    .split(/\s+/)
    .map((t) => t.match(/[\p{L}\p{N}]/gu)?.join("") ?? "")
    .filter(Boolean);
  if (!tokens.length) return "•";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
}

/** Why the roster can't be published yet, or null if it can. */
export function rosterPublishBlocker(settings: RosterSettings): string | null {
  if (!settings.term_label.trim()) return "Add a term name.";
  if (!settings.term_start || !settings.term_end) {
    return "Set the term's start and end dates.";
  }
  if (Date.parse(settings.term_start) >= Date.parse(settings.term_end)) {
    return "The term must end after it starts.";
  }
  return null;
}

/** Published and inside its term window (mirrors officer_roster_is_live). */
export function isRosterLive(
  settings: RosterSettings | null,
  now = new Date(),
): boolean {
  if (!settings?.is_published || rosterPublishBlocker(settings)) return false;
  const t = now.getTime();
  return (
    t >= Date.parse(settings.term_start!) && t <= Date.parse(settings.term_end!)
  );
}

/** Display order, then id as a stable tie-breaker. */
export function sortOfficers<T extends Officer>(officers: readonly T[]) {
  return [...officers].sort(
    (a, b) => a.display_order - b.display_order || a.id.localeCompare(b.id),
  );
}
