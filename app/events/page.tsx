import type { Metadata } from "next";
import {
  PastEventList,
  UpcomingEventList,
} from "@/components/events/EventListings";
import { PageMasthead } from "@/components/site/PageMasthead";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getPastEvents, getUpcomingEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events | PICE PCUD",
  description:
    "Upcoming and past events of the PICE PCU–Dasmariñas Student Chapter.",
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);

  return (
    <>
      <PageMasthead title="Events" current="events">
        <p>
          Chapter activities for PCU–Dasmariñas civil engineering students.
          Registration for each event is handled on Luma.
        </p>
      </PageMasthead>

      <main className="flex-1">
        <section
          aria-labelledby="upcoming-heading"
          className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20"
        >
          <h2
            id="upcoming-heading"
            className="font-headline text-5xl leading-none uppercase text-brand-ink md:text-6xl"
          >
            Upcoming
          </h2>
          <hr className="chrome-rule mt-5 mb-10" />

          <UpcomingEventList
            events={upcoming.data}
            failed={Boolean(upcoming.error)}
          />
        </section>

        {!past.error && past.data.length > 0 && (
          <section
            aria-labelledby="past-heading"
            className="border-t border-border bg-white/50"
          >
            <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20">
              <h2
                id="past-heading"
                className="font-headline text-5xl leading-none uppercase text-brand-ink md:text-6xl"
              >
                Past events
              </h2>
              <hr className="chrome-rule mt-5 mb-4" />

              <PastEventList events={past.data} />
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
