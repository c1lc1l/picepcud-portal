import type { Metadata } from "next";
import {
  PastEventList,
  UpcomingEventList,
} from "@/components/events/EventListings";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPastEvents, getUpcomingEvents } from "@/lib/events";

export const metadata: Metadata = { title: "Events | PICE PCUD" };

/** Signed-in view of /events, kept inside the portal chrome. */
export default async function PortalEventsPage() {
  const [{ isAdmin }, upcoming, past] = await Promise.all([
    getCurrentUser(),
    getUpcomingEvents(),
    getPastEvents(),
  ]);

  return (
    <>
      <PortalHeader current="events" isAdmin={isAdmin}>
        <h1 className="font-headline text-6xl leading-none uppercase text-brand-ink sm:text-7xl">
          Events
        </h1>
        <p className="mt-3 max-w-xl text-sm text-brand-ink/80">
          Chapter activities for PCU–Dasmariñas civil engineering students.
          Registration for each event is handled on Luma.
        </p>
      </PortalHeader>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-10 sm:px-6">
        <section aria-labelledby="upcoming-heading">
          <h2
            id="upcoming-heading"
            className="font-headline text-5xl leading-none uppercase text-brand-ink"
          >
            Upcoming
          </h2>
          <hr className="chrome-rule mt-4 mb-8" />
          <UpcomingEventList
            events={upcoming.data}
            failed={Boolean(upcoming.error)}
          />
        </section>

        {!past.error && past.data.length > 0 && (
          <section aria-labelledby="past-heading">
            <h2
              id="past-heading"
              className="font-headline text-5xl leading-none uppercase text-brand-ink"
            >
              Past events
            </h2>
            <hr className="chrome-rule mt-4 mb-2" />
            <PastEventList events={past.data} />
          </section>
        )}
      </main>
    </>
  );
}
