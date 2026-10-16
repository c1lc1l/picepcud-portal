import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { OfficerProfileCard } from "@/components/officers/OfficerProfileCard";
import { Button } from "@/components/ui/button";
import { FeaturedPostSection } from "@/components/site/FeaturedPostSection";
import { HighlightsCarousel } from "@/components/site/HighlightsCarousel";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { homeContent } from "@/lib/content/home";
import { getUpcomingEvents } from "@/lib/events";
import { getFeaturedPost } from "@/lib/featured";
import { getPublicHighlights } from "@/lib/highlights/queries";
import { getPublicRoster } from "@/lib/officers/queries";
import { sortOfficers } from "@/lib/officers/validation";

const LOGO = { src: "/brand/pice-pcud-logo.png", width: 810, height: 1154 };

export default async function Home() {
  const [
    { data: events, error },
    roster,
    { post: featured },
    { data: highlights },
  ] = await Promise.all([
    getUpcomingEvents(2),
    getPublicRoster(),
    getFeaturedPost(),
    getPublicHighlights(),
  ]);
  // Homepage shows the executive board; /officers lists everyone.
  const executive = sortOfficers(roster.officers).filter(
    (o) => o.officer_group === "executive",
  );

  return (
    <>
      {/* Hero — the chapter cover art, rebuilt as a live surface. */}
      <section className="cover-sweep relative overflow-hidden">
        <SiteHeader variant="overlay" />

        <Image
          src={LOGO.src}
          alt=""
          width={LOGO.width}
          height={LOGO.height}
          aria-hidden
          loading="eager"
          className="emblem-ghost pointer-events-none absolute top-[56%] right-[-20%] hidden h-[150%] w-auto -translate-y-1/2 opacity-35 lg:block"
        />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pt-6 pb-16 sm:px-6 md:grid-cols-[auto_1fr] md:gap-12 md:pt-10 md:pb-24">
          <Image
            src={LOGO.src}
            alt="PICE PCU–Dasmariñas Student Chapter emblem"
            width={LOGO.width}
            height={LOGO.height}
            preload
            className="h-40 w-auto drop-shadow-[0_12px_24px_rgb(20_6_97/0.25)] sm:h-56 md:h-80"
          />

          <div className="min-w-0">
            <h1 className="font-headline text-[clamp(3.5rem,8.4vw,7.25rem)] leading-[0.9] uppercase tracking-[0.01em] text-brand-ink">
              Philippine Institute of Civil Engineers
            </h1>
            <p className="mt-4 font-wide text-[clamp(0.6rem,1.05vw,0.8rem)] leading-relaxed uppercase tracking-widest text-brand-ink">
              Philippine Christian University – Dasmariñas – Student Chapter
            </p>
            <hr className="chrome-rule my-6 max-w-xl" />
            <p className="font-headline text-[clamp(2.25rem,3.8vw,3.25rem)] leading-none uppercase text-brand-violet">
              {homeContent.tagline}
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-ink/85 sm:text-lg">
              {homeContent.about}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                nativeButton={false}
                render={<Link href="/register" />}
                className="h-11 rounded-md px-5 text-base"
              >
                Join the chapter
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/login" />}
                variant="outline"
                className="h-11 rounded-md border-brand-ink/25 bg-white/60 px-5 text-base backdrop-blur-sm hover:bg-white/85"
              >
                Member login
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {featured?.is_visible && featured.title && (
          <FeaturedPostSection post={featured} />
        )}

        {/* Upcoming events */}
        <section
          aria-labelledby="upcoming-heading"
          className="bg-brand-violet"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2
                id="upcoming-heading"
                className="font-headline text-6xl leading-none uppercase text-white md:text-7xl"
              >
                Upcoming events
              </h2>
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-white underline-offset-4 hover:underline"
              >
                All events <ArrowRightIcon className="size-4" />
              </Link>
            </div>
            <hr className="chrome-rule mt-5 mb-10 border-white/20" />

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                Events couldn&apos;t be loaded. Please try again later.
              </p>
            ) : !events?.length ? (
              <p role="status" className="py-8 text-white/70">
                No upcoming events are scheduled yet. Check back soon.
              </p>
            ) : (
              <ul className="grid gap-10 md:grid-cols-2 md:gap-12">
                {events.map((ev) => (
                  <li key={ev.id}>
                    <EventCard event={ev} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Moments — past events and social posts, admin-curated. */}
        {highlights && highlights.length > 0 && (
          <section
            aria-labelledby="highlights-heading"
            className="border-t border-border bg-white/50"
          >
            <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
              <h2
                id="highlights-heading"
                className="font-headline text-6xl leading-none uppercase text-brand-ink md:text-7xl"
              >
                Moments
              </h2>
              <hr className="chrome-rule mt-5 mb-10" />
              <HighlightsCarousel highlights={highlights} />
            </div>
          </section>
        )}

        {/* Chapter officers — shown only while the roster is live. */}
        {executive.length > 0 && (
          <section
            aria-labelledby="officers-heading"
            className="border-t border-border bg-white/50"
          >
            <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2
                    id="officers-heading"
                    className="font-headline text-6xl leading-none uppercase text-brand-ink md:text-7xl"
                  >
                    Chapter officers
                  </h2>
                  {roster.settings?.term_label && (
                    <p className="mt-3 font-wide text-[0.65rem] uppercase tracking-[0.14em] text-brand-violet">
                      Executive board · {roster.settings.term_label}
                    </p>
                  )}
                </div>
                <Link
                  href="/officers"
                  className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-brand-indigo underline-offset-4 hover:underline"
                >
                  Meet all {roster.officers.length} officers{" "}
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>
              <hr className="chrome-rule mt-5 mb-10" />
              <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {executive.map((o) => (
                  <li key={o.id}>
                    <OfficerProfileCard officer={o} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Membership */}
        <section
          aria-labelledby="membership-heading"
          className="relative overflow-hidden bg-brand-indigo text-brand-silver"
        >
          <Image
            src={LOGO.src}
            alt=""
            width={LOGO.width}
            height={LOGO.height}
            aria-hidden
            className="emblem-ghost pointer-events-none absolute top-1/2 right-[-4%] hidden h-[150%] w-auto -translate-y-1/2 opacity-15 md:block"
          />
          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:py-24">
            <div>
              <h2
                id="membership-heading"
                className="font-headline text-6xl leading-none uppercase text-white md:text-7xl"
              >
                {homeContent.membership.heading}
              </h2>
              <p className="mt-5 max-w-sm leading-relaxed">
                {homeContent.membership.intro}
              </p>
              <Button
                nativeButton={false}
                render={<Link href="/register" />}
                className="mt-8 h-11 rounded-md bg-brand-pearl px-5 text-base text-brand-indigo hover:bg-white"
              >
                Create your account
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
            <ol className="md:max-w-xl">
              {homeContent.membership.steps.map((step, i) => (
                <li key={step.title}>
                  {i > 0 && <hr className="chrome-rule-dark" />}
                  <div className="flex gap-5 py-6">
                    <span
                      aria-hidden
                      className="w-8 shrink-0 font-display text-4xl leading-none font-extrabold text-brand-periwinkle"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-wide text-xs uppercase tracking-[0.12em] text-white">
                        {step.title}
                      </h3>
                      <p className="mt-2 leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
