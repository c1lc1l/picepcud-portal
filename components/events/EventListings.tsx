import { CalendarIcon, MapPinIcon } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { manilaDateParts, type PublicEvent } from "@/lib/events";

/** Upcoming event cards, or an empty/error state. */
export function UpcomingEventList({
  events,
  failed,
}: {
  events: PublicEvent[] | null;
  failed?: boolean;
}) {
  if (failed) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Events couldn&apos;t be loaded. Please try again later.
      </p>
    );
  }
  if (!events?.length) {
    return (
      <div
        role="status"
        className="flex items-start gap-4 rounded-md border border-dashed border-brand-periwinkle/50 bg-white/60 p-6"
      >
        <CalendarIcon className="mt-0.5 size-5 shrink-0 text-brand-violet" />
        <div>
          <p className="font-medium text-brand-ink">
            No upcoming events right now.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            New events are posted here as soon as they&apos;re scheduled.
          </p>
        </div>
      </div>
    );
  }
  return (
    <ul className="grid gap-12 md:grid-cols-2">
      {events.map((ev) => (
        <li key={ev.id}>
          <EventCard event={ev} />
        </li>
      ))}
    </ul>
  );
}

/** Compact rows for events that already happened. */
export function PastEventList({ events }: { events: PublicEvent[] }) {
  return (
    <ul className="divide-y divide-border">
      {events.map((ev) => {
        const d = manilaDateParts(ev.event_date);
        return (
          <li
            key={ev.id}
            className="grid grid-cols-[5.5rem_1fr] items-center gap-4 py-5 sm:grid-cols-[7rem_10rem_1fr] sm:gap-6"
          >
            <p className="font-wide text-[0.7rem] leading-relaxed uppercase tracking-[0.12em] text-muted-foreground">
              {d.month} {d.day}
              <br />
              {d.year}
            </p>
            {ev.banner_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-uploaded banner from Supabase storage
              <img
                src={ev.banner_url}
                alt=""
                className="hidden aspect-video w-full rounded-sm object-cover opacity-90 grayscale-35 sm:block"
              />
            ) : (
              <div
                aria-hidden
                className="hidden aspect-video w-full rounded-sm bg-muted sm:block"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-display text-2xl leading-tight font-bold text-brand-ink">
                {ev.title}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPinIcon className="size-4 shrink-0" />
                {ev.location}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
