"use client";

import { useRef } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { highlightPhotoUrl, type Highlight } from "@/lib/highlights/types";

/** Scroll-snap strip of past-event/social-post cards. No heading — the
 * caller provides the section heading and divider. */
export function HighlightsCarousel({ highlights }: { highlights: Highlight[] }) {
  const scrollerRef = useRef<HTMLUListElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    const amount = (card?.clientWidth ?? 256) + 24; // card width + gap-6
    el.scrollBy({ left: amount * direction, behavior: "smooth" });
  }

  return (
    <div>
      <ul
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 scrollbar-none"
      >
        {highlights.map((h) => {
          const card = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={highlightPhotoUrl(h.image_path)}
                alt=""
                loading="lazy"
                className="aspect-square w-full rounded-xl object-cover"
              />
              <p className="mt-3 line-clamp-2 text-sm leading-snug text-brand-ink/85">
                {h.caption}
              </p>
            </>
          );
          return (
            <li key={h.id} className="w-56 shrink-0 snap-start sm:w-64">
              {h.link_url ? (
                <a
                  href={h.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {card}
                </a>
              ) : (
                <div>{card}</div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => scrollByCard(-1)}
          aria-label="Scroll highlights left"
        >
          <ArrowLeftIcon />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => scrollByCard(1)}
          aria-label="Scroll highlights right"
        >
          <ArrowRightIcon />
        </Button>
      </div>
    </div>
  );
}
