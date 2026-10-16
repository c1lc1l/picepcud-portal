import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Vertical border ornament drawn from the emblem: the curling waves on its
 * flanks plus the building's pillar lines. The wave tile repeats, so it
 * stretches to any height. Pillars sit on the right; mirror with
 * `-scale-x-100` for the opposite edge.
 */
export function WaveOrnament({ className }: { className?: string }) {
  // useId output can contain characters that break url(#…) references.
  const id = `wave-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      className={cn("h-full w-18", className)}
    >
      <defs>
        <pattern id={id} width="48" height="96" patternUnits="userSpaceOnUse">
          <g strokeWidth="2.5">
            <path d="M24 0C46 24 2 72 24 96" />
            <path d="M30 17C42 20 46 8 38 4C32 2 28 8 32 11C35 13 38 10 36 8" />
            <path d="M18 79C6 76 2 88 10 92C16 94 20 88 16 85C13 83 10 86 12 88" />
          </g>
        </pattern>
      </defs>
      <rect width="48" height="100%" fill={`url(#${id})`} stroke="none" />
      <line x1="58" y1="0" x2="58" y2="100%" strokeWidth="3" />
      <line x1="65" y1="0" x2="65" y2="100%" strokeWidth="1.25" />
    </svg>
  );
}
