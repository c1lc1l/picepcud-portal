"use client";

import { useRef } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HighlightCard } from "@/components/site/HighlightCard";
import type { Highlight } from "@/lib/highlights/types";

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
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 pt-1 pb-3 scrollbar-none mask-[linear-gradient(90deg,transparent,black_24px,black_calc(100%-24px),transparent)] sm:mask-none"
      >
        {highlights.map((h) => (
          <li key={h.id} className="w-56 shrink-0 snap-start sm:w-64">
            <HighlightCard highlight={h} />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => scrollByCard(-1)}
          aria-label="Scroll moments left"
        >
          <ArrowLeftIcon />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => scrollByCard(1)}
          aria-label="Scroll moments right"
        >
          <ArrowRightIcon />
        </Button>
      </div>
    </div>
  );
}
