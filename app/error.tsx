"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Fallback for unexpected runtime errors (e.g. Supabase unreachable) so
 * visitors get a branded page with a retry instead of the bare default.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <section className="cover-sweep">
        <div className="mx-auto w-full max-w-7xl px-4 pt-16 pb-12 sm:px-6 md:pt-24 md:pb-16">
          <h1 className="font-headline text-[clamp(3.5rem,9vw,6.5rem)] leading-[0.9] uppercase text-brand-ink">
            Something went wrong
          </h1>
          <hr className="chrome-rule my-5 max-w-md" />
          <p className="max-w-xl text-base leading-relaxed text-brand-ink/85 sm:text-lg">
            We couldn&apos;t load this page. Please try again in a moment.
          </p>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6">
        {error.digest && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => retry()}
            className="h-11 rounded-md px-5 text-base"
          >
            <RotateCwIcon data-icon="inline-start" />
            Try again
          </Button>
          <Link
            href="/"
            className={cn(
              buttonVariants({
                variant: "outline",
                className: "h-11 rounded-md px-5 text-base",
              }),
            )}
          >
            Back to the homepage
          </Link>
        </div>
      </main>
    </>
  );
}
