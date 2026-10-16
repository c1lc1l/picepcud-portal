"use client";

import { useState } from "react";
import { ArrowUpRightIcon } from "lucide-react";
import { LinkHostIcon } from "@/components/icons/SocialIcons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { highlightPhotoUrl, type Highlight } from "@/lib/highlights/types";

/** A moment's card: opens a pop-up with the full caption and image, in the
 * same spirit as an officer's profile card. */
export function HighlightCard({ highlight }: { highlight: Highlight }) {
  const [open, setOpen] = useState(false);
  const imageUrl = highlightPhotoUrl(highlight.image_path);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${highlight.caption}. View full post`}
        // Only transform and opacity animate (GPU-friendly); the hover shadow
        // lives on ::after and fades in rather than repainting box-shadow.
        className="group relative block h-full w-full rounded-2xl text-left outline-none transition-transform duration-500 ease-smooth after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:opacity-0 after:shadow-[0_20px_40px_-16px_rgb(20_6_97/0.4)] after:transition-opacity after:duration-500 after:ease-smooth hover:after:opacity-100 focus-visible:ring-3 focus-visible:ring-ring motion-safe:hover:-translate-y-1.5"
      >
        <span className="flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-shadow duration-500 ease-smooth group-hover:ring-brand-periwinkle/60">
          <span className="relative block aspect-square overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-700 ease-smooth motion-safe:group-hover:scale-[1.06]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-deep/55 via-brand-deep/0 to-brand-deep/0 opacity-0 transition-opacity duration-500 ease-smooth group-hover:opacity-100"
            />
            {highlight.link_url && (
              <span className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-white/90 text-brand-indigo shadow-[0_2px_8px_rgb(20_6_97/0.25)] backdrop-blur-sm">
                <LinkHostIcon url={highlight.link_url} className="size-3.5" />
              </span>
            )}
          </span>
          <span className="flex flex-1 flex-col gap-2.5 p-4">
            <span className="line-clamp-3 text-sm leading-relaxed text-brand-ink/85">
              {highlight.caption}
            </span>
            <span
              aria-hidden
              className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-muted-foreground transition-colors duration-500 ease-smooth group-hover:text-brand-indigo"
            >
              View post
              <ArrowUpRightIcon className="size-3.5 transition-transform duration-500 ease-smooth motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
            </span>
          </span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Moment</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="max-h-[65vh] w-full bg-muted object-contain"
          />
          <div className="flex flex-col gap-4 p-6">
            <DialogDescription className="text-base leading-relaxed whitespace-pre-line text-brand-ink">
              {highlight.caption}
            </DialogDescription>
            {highlight.link_url && (
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                nativeButton={false}
                render={
                  <a
                    href={highlight.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <LinkHostIcon url={highlight.link_url} className="size-4" />
                View original post
                <span className="sr-only">(opens in a new tab)</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
