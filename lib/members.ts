export const YEAR_FILTERS = ["1", "2", "3", "4", "5"] as const;

export function parseYear(value: string | undefined) {
  return YEAR_FILTERS.find((y) => y === value);
}

// Strip characters that have meaning inside a PostgREST or()/ilike filter.
export function sanitizeSearch(value: string | undefined) {
  return (value ?? "")
    .replace(/[%_,()\\*]/g, " ")
    .trim()
    .slice(0, 100);
}

export const YEAR_LEVEL_LABELS = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
  "5th year",
] as const;

export function yearLevelLabel(level: number | null | undefined) {
  return level ? (YEAR_LEVEL_LABELS[level - 1] ?? `Year ${level}`) : undefined;
}
