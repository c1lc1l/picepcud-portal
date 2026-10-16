"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRightIcon, ImagePlusIcon, XIcon } from "lucide-react";
import { LinkHostIcon } from "@/components/icons/SocialIcons";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  highlightPhotoUrl,
  splitHashtags,
  splitInlineHashtags,
  type Highlight,
} from "@/lib/highlights/types";
import { cn } from "@/lib/utils";

/** Cards show a few tags and a "+N" count; the pop-up shows them all. */
const CARD_TAG_LIMIT = 3;

/** Caption text with any mid-sentence hashtags picked out in brand color. */
function CaptionText({ text }: { text: string }) {
  return splitInlineHashtags(text).map((part, i) =>
    i % 2 ? (
      <span key={i} className="font-medium text-brand-violet">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function HashtagChips({
  tags,
  limit,
  className = "",
}: {
  tags: string[];
  limit?: number;
  className?: string;
}) {
  const shown = limit ? tags.slice(0, limit) : tags;
  const hidden = tags.length - shown.length;
  const chip =
    "inline-flex items-center rounded-full bg-brand-silver/55 px-2 py-0.5 text-xs font-medium";

  return (
    <span className={`flex flex-wrap gap-1.5 ${className}`}>
      {shown.map((tag) => (
        <span key={tag} className={`${chip} text-brand-violet`}>
          {tag}
        </span>
      ))}
      {hidden > 0 && (
        <span className={`${chip} text-muted-foreground`}>
          +{hidden}
          <span className="sr-only"> more tags</span>
        </span>
      )}
    </span>
  );
}

/** The card's visual face, shared by the homepage card and the admin form's
 * live preview so the two can't drift apart. Hover effects key off a parent
 * `group`, so it sits still when nothing wraps it. */
export function HighlightCardFace({
  title,
  caption,
  imageUrl,
  linkUrl,
}: {
  title: string | null;
  caption: string;
  imageUrl: string | null;
  linkUrl: string | null;
}) {
  const { body, tags } = splitHashtags(caption);

  return (
    <span className="flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-shadow duration-500 ease-smooth group-hover:ring-brand-periwinkle/60">
      <span className="relative block aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          // Optimized to card size (uploads are up to 1600 px); the admin
          // form's local blob: preview is passed through unoptimized.
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(min-width: 640px) 256px, 224px"
            className="object-cover transition-transform duration-700 ease-smooth motion-safe:group-hover:scale-[1.06]"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <ImagePlusIcon className="size-8" />
          </span>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-brand-deep/55 via-brand-deep/0 to-brand-deep/0 opacity-0 transition-opacity duration-500 ease-smooth group-hover:opacity-100"
        />
        {linkUrl && (
          <span className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-white/90 text-brand-indigo shadow-[0_2px_8px_rgb(20_6_97/0.25)] backdrop-blur-sm">
            <LinkHostIcon url={linkUrl} className="size-3.5" />
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col gap-1.5 p-4">
        {/* Spans, not h3/p: buttons may only contain phrasing content. */}
        {title && (
          <span className="line-clamp-2 block font-display text-lg leading-tight font-bold text-brand-ink">
            {title}
          </span>
        )}
        {body && (
          <span
            className={
              title
                ? "line-clamp-2 block text-sm leading-relaxed text-muted-foreground"
                : "line-clamp-3 block text-sm leading-relaxed text-brand-ink/85"
            }
          >
            <CaptionText text={body} />
          </span>
        )}
        {tags.length > 0 && (
          <HashtagChips tags={tags} limit={CARD_TAG_LIMIT} className="pt-1" />
        )}
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-muted-foreground transition-colors duration-500 ease-smooth group-hover:text-brand-indigo">
          View post
          <ArrowUpRightIcon
            aria-hidden
            className="size-3.5 transition-transform duration-500 ease-smooth motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
          />
        </span>
      </span>
    </span>
  );
}

/** A "Check these out!" card: opens a pop-up with the full caption and
 * image, in the same spirit as an officer's profile card. */
export function HighlightCard({ highlight }: { highlight: Highlight }) {
  const [open, setOpen] = useState(false);
  const imageUrl = highlightPhotoUrl(highlight.image_path);
  const { body, tags } = splitHashtags(highlight.caption);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        // No aria-label: the card's visible text is its accessible name.
        // Only transform and opacity animate (GPU-friendly); the hover shadow
        // lives on ::after and fades in rather than repainting box-shadow.
        className="group relative block h-full w-full rounded-2xl text-left outline-none transition-transform duration-500 ease-smooth after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:opacity-0 after:shadow-[0_20px_40px_-16px_rgb(20_6_97/0.4)] after:transition-opacity after:duration-500 after:ease-smooth hover:after:opacity-100 focus-visible:ring-3 focus-visible:ring-ring motion-safe:hover:-translate-y-1.5"
      >
        <HighlightCardFace
          title={highlight.title}
          caption={highlight.caption}
          imageUrl={imageUrl}
          linkUrl={highlight.link_url}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="max-h-[65vh] w-full bg-muted object-contain"
          />
          <div className="flex flex-col gap-3 p-6">
            <DialogTitle
              className={
                highlight.title
                  ? "font-display text-2xl leading-tight font-bold text-brand-ink"
                  : "sr-only"
              }
            >
              {highlight.title || "Post"}
            </DialogTitle>
            {body ? (
              <DialogDescription className="text-base leading-relaxed whitespace-pre-line text-brand-ink">
                <CaptionText text={body} />
              </DialogDescription>
            ) : (
              <DialogDescription className="sr-only">
                {highlight.caption}
              </DialogDescription>
            )}
            {tags.length > 0 && <HashtagChips tags={tags} />}
            {highlight.link_url && (
              <a
                href={highlight.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "mt-1 w-fit",
                  }),
                )}
              >
                <LinkHostIcon url={highlight.link_url} className="size-4" />
                View original post
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>
          {/* Solid chip so the close control stays visible over dark images. */}
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3 rounded-full bg-white/90 text-brand-ink shadow-[0_2px_10px_rgb(12_1_48/0.35)] ring-1 ring-black/5 backdrop-blur-sm hover:bg-white"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
