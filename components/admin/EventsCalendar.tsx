"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  MapPinIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  longDateLabel,
  manilaDateKey,
  monthGrid,
  monthLabel,
  parseDateKey,
  shiftMonth,
  WEEKDAYS,
  type YearMonth,
} from "@/lib/calendar";
import { manilaDateParts } from "@/lib/event-dates";
import { cn } from "@/lib/utils";
import type { EventRow } from "./EventsTable";

const MAX_CHIPS = 2;

function eventTone(ev: EventRow) {
  if (!ev.is_active) {
    return "border border-dashed border-brand-periwinkle/70 text-muted-foreground";
  }
  return ev.is_past
    ? "bg-brand-silver/70 text-brand-ink/80"
    : "bg-brand-indigo text-white";
}

/** Month grid of events; picking a day lists its events underneath. */
export function EventsCalendar({
  events,
  today,
}: {
  events: EventRow[];
  /** Today's YYYY-MM-DD in Philippine time, from the server. */
  today: string;
}) {
  const [view, setView] = useState<YearMonth>(() => {
    const d = parseDateKey(today)!;
    return { year: d.year, month: d.month };
  });
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const ev of [...events].sort((a, b) =>
      a.event_date.localeCompare(b.event_date),
    )) {
      const key = manilaDateKey(ev.event_date);
      map.set(key, [...(map.get(key) ?? []), ev]);
    }
    return map;
  }, [events]);

  const cells = monthGrid(view);
  const monthPrefix = cells.find((c) => c.inMonth)!.key.slice(0, 7);
  const agenda = selected
    ? (byDay.get(selected) ?? [])
    : [...byDay.entries()]
        .filter(([key]) => key.startsWith(monthPrefix))
        .flatMap(([, list]) => list);

  function goToMonth(delta: number) {
    setView((v) => shiftMonth(v, delta));
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2
            className="text-base font-semibold text-brand-ink"
            aria-live="polite"
          >
            {monthLabel(view)}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const d = parseDateKey(today)!;
                setView({ year: d.year, month: d.month });
                setSelected(null);
              }}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() => goToMonth(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next month"
              onClick={() => goToMonth(1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-border ring-1 ring-border">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              aria-hidden
              className="bg-muted/60 py-1.5 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {cells.map((cell) => {
            const dayEvents = byDay.get(cell.key) ?? [];
            const isSelected = cell.key === selected;
            const isToday = cell.key === today;
            return (
              <button
                key={cell.key}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${longDateLabel(cell.key)}: ${
                  dayEvents.length
                    ? `${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}`
                    : "no events"
                }`}
                onClick={() => setSelected(isSelected ? null : cell.key)}
                className={cn(
                  "flex min-h-14 flex-col items-stretch gap-1 bg-card p-1 text-left transition-colors outline-none hover:bg-brand-pearl focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring sm:min-h-24 sm:p-1.5",
                  !cell.inMonth && "bg-brand-pearl",
                  isSelected && "bg-brand-pearl ring-2 ring-brand-periwinkle ring-inset",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                    cell.inMonth
                      ? "text-brand-ink"
                      : "text-muted-foreground/60",
                    isToday && "bg-brand-indigo font-semibold text-white",
                  )}
                >
                  {cell.day}
                </span>

                {/* Phones: one dot per event. */}
                {dayEvents.length > 0 && (
                  <span className="flex flex-wrap gap-0.5 px-0.5 sm:hidden">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className={cn("size-1.5 rounded-full", eventTone(ev))}
                      />
                    ))}
                  </span>
                )}

                {/* Wider screens: title chips. */}
                <span className="hidden flex-col gap-0.5 sm:flex">
                  {dayEvents.slice(0, MAX_CHIPS).map((ev) => (
                    <span
                      key={ev.id}
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 text-[0.7rem] leading-tight font-medium",
                        eventTone(ev),
                      )}
                    >
                      {ev.title}
                    </span>
                  ))}
                  {dayEvents.length > MAX_CHIPS && (
                    <span className="px-1 text-[0.7rem] text-muted-foreground">
                      +{dayEvents.length - MAX_CHIPS} more
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-brand-indigo" /> Upcoming
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-brand-silver" /> Past
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border border-dashed border-brand-periwinkle" />{" "}
            Inactive
          </li>
        </ul>
      </div>

      <section
        aria-label="Events for the selected period"
        className="rounded-xl bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-medium text-brand-ink">
            {selected ? longDateLabel(selected) : `All of ${monthLabel(view)}`}
          </h3>
          {selected && (
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              Show whole month
            </Button>
          )}
        </div>
        {!agenda.length ? (
          <p className="text-sm text-muted-foreground">
            {selected ? "No events on this day." : "No events this month."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {agenda.map((ev) => {
              const d = manilaDateParts(ev.event_date);
              return (
                <li
                  key={ev.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="w-14 shrink-0 text-center text-brand-indigo">
                    <p className="font-wide text-[0.7rem] uppercase tracking-widest">
                      {d.month}
                    </p>
                    <p className="font-display text-2xl leading-none font-extrabold">
                      {d.day}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-brand-ink">
                      {ev.title}
                      {!ev.is_active && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPinIcon className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {ev.location} · {d.time}
                      </span>
                    </p>
                  </div>
                  <a
                    href={ev.luma_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    <ExternalLinkIcon />
                    Luma
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
