"use client";

import { useMemo, useState } from "react";
import { CalendarDaysIcon, ListIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { tableFrameClass } from "./AdminPageHeader";
import { EventsCalendar } from "./EventsCalendar";
import { EventsTable, type EventRow } from "./EventsTable";

const WHEN = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
] as const;

const STATUS = [
  { value: "all", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

type When = (typeof WHEN)[number]["value"];
type Status = (typeof STATUS)[number]["value"];

const segmentClass = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
    active
      ? "bg-card text-brand-ink shadow-sm ring-1 ring-foreground/10"
      : "text-muted-foreground hover:text-brand-ink",
  );

/** Filter bar plus a list/calendar switch over the admin events. */
export function EventsBrowser({
  events,
  today,
}: {
  events: EventRow[];
  today: string;
}) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [query, setQuery] = useState("");
  const [when, setWhen] = useState<When>("all");
  const [status, setStatus] = useState<Status>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = events.filter(
      (ev) =>
        (!q ||
          ev.title.toLowerCase().includes(q) ||
          ev.location.toLowerCase().includes(q)) &&
        (when === "all" || (when === "past") === ev.is_past) &&
        (status === "all" || (status === "active") === ev.is_active),
    );
    // Upcoming reads best soonest-first; everything else newest-first.
    return when === "upcoming" ? rows.reverse() : rows;
  }, [events, query, when, status]);

  const isFiltered =
    Boolean(query.trim()) || when !== "all" || status !== "all";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or location"
            aria-label="Search title or location"
            className="h-9 bg-card pl-8"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by date"
          className="flex gap-1 rounded-lg bg-muted p-1"
        >
          {WHEN.map((w) => (
            <button
              key={w.value}
              type="button"
              aria-pressed={when === w.value}
              onClick={() => setWhen(w.value)}
              className={segmentClass(when === w.value)}
            >
              {w.label}
            </button>
          ))}
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          aria-label="Filter by status"
          className="h-9 rounded-lg border border-input bg-card px-2.5 text-base outline-none md:text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {isFiltered && (
          <Button
            variant="ghost"
            className="h-9"
            onClick={() => {
              setQuery("");
              setWhen("all");
              setStatus("all");
            }}
          >
            Clear
          </Button>
        )}

        <div
          role="group"
          aria-label="View"
          className="flex gap-1 rounded-lg bg-muted p-1 sm:ml-auto"
        >
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={segmentClass(view === "list")}
          >
            <ListIcon className="size-4" />
            List
          </button>
          <button
            type="button"
            aria-pressed={view === "calendar"}
            onClick={() => setView("calendar")}
            className={segmentClass(view === "calendar")}
          >
            <CalendarDaysIcon className="size-4" />
            Calendar
          </button>
        </div>
      </div>

      <p className="-mt-2 text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} of {events.length}{" "}
        {events.length === 1 ? "event" : "events"}
        {isFiltered ? " match these filters." : "."}
      </p>

      {view === "calendar" ? (
        <EventsCalendar events={filtered} today={today} />
      ) : (
        <div className={tableFrameClass}>
          <EventsTable
            events={filtered}
            emptyMessage={
              isFiltered ? "No events match these filters." : undefined
            }
          />
        </div>
      )}
    </>
  );
}
