"use client";

import { useState } from "react";
import { ArrowRightIcon, MailIcon } from "lucide-react";
import { LinkHostIcon } from "@/components/icons/SocialIcons";
import { OfficerPortrait } from "@/components/officers/OfficerPortrait";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  OFFICER_GROUPS,
  officerPhotoUrl,
  type Officer,
} from "@/lib/officers/types";

/** Officer card that opens a profile pop-up with motto, contact and links. */
export function OfficerProfileCard({ officer }: { officer: Officer }) {
  const [open, setOpen] = useState(false);
  const photoUrl = officerPhotoUrl(officer.photo_path);
  const group = OFFICER_GROUPS.find((g) => g.key === officer.officer_group);
  const firstName = officer.display_name.split(" ")[0];
  // Only https links are rendered, even though the server validates them.
  const links = officer.links.filter((l) => l.url.startsWith("https://"));
  const hasProfile =
    Boolean(officer.motto || officer.contact_email) || links.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        // No aria-label: the visible name, title and "View profile" form the
        // accessible name, so voice-control users can say what they see.
        // Only transform and opacity animate (GPU-friendly); the hover shadow
        // lives on ::after and fades in rather than repainting box-shadow.
        className="group relative block h-full w-full rounded-xl text-left outline-none transition-transform duration-500 ease-smooth after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:opacity-0 after:shadow-[0_20px_40px_-16px_rgb(20_6_97/0.4)] after:transition-opacity after:duration-500 after:ease-smooth hover:after:opacity-100 focus-visible:ring-3 focus-visible:ring-ring motion-safe:hover:-translate-y-1.5"
      >
        <span className="flex h-full flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow duration-500 ease-smooth group-hover:ring-brand-periwinkle/60">
          <span className="block overflow-hidden">
            <OfficerPortrait
              name={officer.display_name}
              photoUrl={photoUrl}
              // Square on phones keeps a two-column board from running long.
              className="aspect-square w-full object-top transition-transform duration-700 ease-smooth motion-safe:group-hover:scale-[1.05] sm:aspect-4/5"
            />
          </span>
          <span className="flex flex-1 flex-col gap-1.5 p-4">
            {/* Spans, not h3/p: buttons may only contain phrasing content. */}
            <span className="block font-display text-xl leading-tight font-bold text-brand-ink sm:text-2xl">
              {officer.display_name}
            </span>
            {/* Tighter tracking in the two-up phone grid so long words like
                "Chairperson" fit; they wrap rather than clip below 360px. */}
            <span className="block font-wide text-[0.7rem] leading-relaxed uppercase tracking-[0.04em] wrap-break-word text-brand-violet sm:tracking-[0.12em]">
              {officer.title}
            </span>
            <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-muted-foreground transition-colors duration-500 ease-smooth group-hover:text-brand-indigo">
              View profile
              <ArrowRightIcon
                aria-hidden
                className="size-3.5 transition-transform duration-500 ease-smooth motion-safe:group-hover:translate-x-1"
              />
            </span>
          </span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <div className="grid sm:grid-cols-[15rem_minmax(0,1fr)]">
            <OfficerPortrait
              name={officer.display_name}
              photoUrl={photoUrl}
              className="aspect-[4/5] w-full max-sm:max-h-72 max-sm:aspect-auto max-sm:h-72"
            />
            <div className="flex flex-col gap-5 p-6">
              <div>
                {group && (
                  <p className="font-wide text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                    {group.label}
                  </p>
                )}
                <DialogTitle className="mt-2 font-display text-3xl leading-tight font-bold text-brand-ink">
                  {officer.display_name}
                </DialogTitle>
                <DialogDescription className="mt-1 font-wide text-[0.7rem] uppercase tracking-[0.12em] text-brand-violet">
                  {officer.title}
                </DialogDescription>
              </div>

              <hr className="chrome-rule" />

              {officer.motto && (
                <blockquote className="border-l-2 border-brand-periwinkle pl-4 text-lg leading-snug text-brand-ink">
                  “{officer.motto}”
                </blockquote>
              )}

              {(officer.contact_email || links.length > 0) && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Get in touch
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {officer.contact_email && (
                      <li>
                        <a
                          href={`mailto:${officer.contact_email}`}
                          className="inline-flex items-center gap-2 rounded-md text-sm font-medium break-all text-brand-indigo underline-offset-4 hover:underline"
                        >
                          <MailIcon className="size-4 shrink-0" aria-hidden />
                          {officer.contact_email}
                        </a>
                      </li>
                    )}
                    {links.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-brand-indigo underline-offset-4 hover:underline"
                        >
                          <LinkHostIcon
                            url={link.url}
                            className="size-4 shrink-0"
                          />
                          {link.label}
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!hasProfile && (
                <p className="text-sm text-muted-foreground">
                  More about {firstName} coming soon.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
