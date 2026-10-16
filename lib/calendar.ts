/**
 * Calendar math on plain YYYY-MM-DD keys. Keys are calendar days, not
 * instants, so everything here runs in UTC to stay time-zone neutral.
 */

export type YearMonth = { year: number; month: number }; // month: 0–11

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateKey(key: string | null | undefined) {
  const match = key ? KEY_PATTERN.exec(key) : null;
  if (!match) return null;
  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  ];
  const date = new Date(Date.UTC(year, month, day));
  return date.getUTCMonth() === month ? { year, month, day } : null;
}

export function toDateKey(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month, day));
  return date.toISOString().slice(0, 10);
}

export function addDays(key: string, days: number) {
  const d = parseDateKey(key);
  return d ? toDateKey(d.year, d.month, d.day + days) : key;
}

export function shiftMonth({ year, month }: YearMonth, delta: number) {
  const date = new Date(Date.UTC(year, month + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

/** The same day in another month, clamped to that month's length. */
export function shiftKeyByMonths(key: string, delta: number) {
  const d = parseDateKey(key);
  if (!d) return key;
  const target = shiftMonth(d, delta);
  const lastDay = new Date(
    Date.UTC(target.year, target.month + 1, 0),
  ).getUTCDate();
  return toDateKey(target.year, target.month, Math.min(d.day, lastDay));
}

/** Six Sunday-first weeks covering the month, with spill-over days. */
export function monthGrid({ year, month }: YearMonth) {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return Array.from({ length: 42 }, (_, i) => {
    const key = toDateKey(year, month, i - firstWeekday + 1);
    return {
      key,
      day: Number(key.slice(8)),
      inMonth: Number(key.slice(5, 7)) - 1 === month,
    };
  });
}

const monthLabelFormat = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const longDateFormat = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFormat = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const keyToDate = (key: string) => new Date(`${key}T00:00:00Z`);

export const monthLabel = ({ year, month }: YearMonth) =>
  monthLabelFormat.format(new Date(Date.UTC(year, month, 1)));
export const longDateLabel = (key: string) =>
  longDateFormat.format(keyToDate(key));
export const shortDateLabel = (key: string) =>
  shortDateFormat.format(keyToDate(key));

// en-CA formats as YYYY-MM-DD.
const manilaKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
});

/** The Philippine calendar day an instant falls on. */
export function manilaDateKey(instant: string | Date = new Date()) {
  return manilaKeyFormat.format(new Date(instant));
}
