"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { officerInitials } from "@/lib/officers/validation";

/**
 * Officer portrait, falling back to initials when there is no photo or it
 * fails to load. The visible name sits beside it, so the photo itself is
 * decorative (empty alt) and the fallback is labelled once.
 */
export function OfficerPortrait({
  name,
  photoUrl,
  className,
  initialsClassName = "text-6xl",
}: {
  name: string;
  photoUrl: string | null;
  className?: string;
  initialsClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded portrait from Supabase storage
      <img
        src={photoUrl}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("bg-muted object-cover", className)}
      />
    );
  }

  // A span (styled as flex) so the fallback is valid inside a <button>.
  return (
    <span
      role="img"
      aria-label={`Portrait unavailable for ${name}`}
      className={cn(
        "cover-sweep flex items-center justify-center ring-1 ring-brand-violet/25",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "font-display font-extrabold text-brand-ink",
          initialsClassName,
        )}
      >
        {officerInitials(name)}
      </span>
    </span>
  );
}
