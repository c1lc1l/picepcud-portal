import { ArrowUpRightIcon } from "lucide-react";
import { LinkHostIcon } from "@/components/icons/SocialIcons";
import { Button } from "@/components/ui/button";
import type { FeaturedPost } from "@/lib/featured";

/** Homepage spotlight for a chapter post (e.g. a Facebook announcement). */
export function FeaturedPostSection({ post }: { post: FeaturedPost }) {
  return (
    <section
      aria-labelledby="featured-heading"
      className="border-b border-border bg-white/50"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-14 md:py-24">
        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- bundled default or admin upload from Supabase storage
          <img
            src={post.image_url}
            alt={post.image_alt}
            className="aspect-square w-full rounded-xl object-cover shadow-[0_24px_48px_-24px_rgb(20_6_97/0.45)] ring-1 ring-foreground/10"
          />
        )}
        <div className={post.image_url ? "" : "md:col-span-2"}>
          <p className="font-wide text-[0.65rem] uppercase tracking-[0.14em] text-brand-violet">
            Featured
          </p>
          <h2
            id="featured-heading"
            className="mt-3 font-headline text-6xl leading-[0.95] uppercase text-brand-ink md:text-7xl"
          >
            {post.title}
          </h2>
          {post.eyebrow && (
            <p className="mt-4 font-display text-2xl font-bold text-brand-violet">
              {post.eyebrow}
            </p>
          )}
          <hr className="chrome-rule my-6 max-w-md" />
          <div className="max-w-xl whitespace-pre-line leading-relaxed text-foreground/85">
            {post.body}
          </div>
          {post.link_url && (
            <Button
              nativeButton={false}
              render={
                <a
                  href={post.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              className="mt-8 h-11 rounded-md px-5 text-base"
            >
              <LinkHostIcon url={post.link_url} className="size-4" />
              {post.link_label || "View post"}
              <ArrowUpRightIcon data-icon="inline-end" />
              <span className="sr-only">(opens in a new tab)</span>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
