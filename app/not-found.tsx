import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageMasthead } from "@/components/site/PageMasthead";
import { SiteFooter } from "@/components/site/SiteFooter";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Page not found | PICE PCUD" };

/** Branded 404 for unknown URLs, with the site chrome so visitors can move on. */
export default function NotFound() {
  return (
    <>
      <PageMasthead title="Page not found">
        <p>The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      </PageMasthead>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-wrap gap-3 px-4 py-16 sm:px-6 md:py-20">
        <Link
          href="/"
          className={cn(
            buttonVariants({ className: "h-11 rounded-md px-5 text-base" }),
          )}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back to the homepage
        </Link>
        <Link
          href="/events"
          className={cn(
            buttonVariants({
              variant: "outline",
              className: "h-11 rounded-md px-5 text-base",
            }),
          )}
        >
          See events
        </Link>
      </main>

      <SiteFooter />
    </>
  );
}
