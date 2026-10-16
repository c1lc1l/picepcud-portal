import { ArrowUpRightIcon, MapPinIcon } from "lucide-react";
import { isSafeLumaUrl, manilaDateParts, type PublicEvent } from "@/lib/events";

/** Upcoming event: optional banner, date block, details and Luma handoff. */
export function EventCard({ event }: { event: PublicEvent }) {
  const d = manilaDateParts(event.event_date);

  return (
    <article className="flex h-full flex-col">
      {event.banner_url && (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded banner from Supabase storage
        <img
          src={event.banner_url}
          alt=""
          className="mb-6 aspect-video w-full rounded-md object-cover"
        />
      )}
      <div className="flex gap-6">
        <div className="w-20 shrink-0 border-r border-border pr-5 text-brand-indigo">
          <p className="font-wide text-[0.65rem] uppercase tracking-[0.12em]">
            {d.month}
          </p>
          <p className="font-display text-6xl leading-none font-extrabold">
            {d.day}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{d.weekday}</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="font-display text-3xl leading-tight font-bold text-brand-ink">
            {event.title}
          </h3>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="size-4 shrink-0" />
            <span>
              {event.location} · {d.time}
            </span>
          </p>
          <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {event.description}
          </p>
          {isSafeLumaUrl(event.luma_url) && (
            <a
              href={event.luma_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-fit items-center gap-1 rounded-md text-sm font-semibold text-brand-indigo underline-offset-4 hover:underline"
            >
              Register on Luma
              <ArrowUpRightIcon className="size-4" />
              <span className="sr-only">
                for {event.title} (opens in a new tab)
              </span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
