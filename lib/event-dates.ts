/** Event date formatting, always in Philippine time. Client-safe. */

export const eventDateFormat = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

const manilaParts = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  day: "numeric",
  month: "short",
  year: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

/** Event date split into display parts, always in Philippine time. */
export function manilaDateParts(iso: string) {
  const parts = Object.fromEntries(
    manilaParts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  );
  return {
    day: parts.day,
    month: parts.month,
    year: parts.year,
    weekday: parts.weekday,
    time: `${parts.hour}:${parts.minute} ${parts.dayPeriod ?? ""}`.trim(),
  };
}
