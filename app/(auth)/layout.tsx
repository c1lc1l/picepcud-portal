import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

const LOGO = { src: "/brand/pice-pcud-logo.png", width: 810, height: 1154 };

/** Split auth layout: cover-art identity panel beside the form. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid flex-1 content-start lg:min-h-screen lg:content-normal lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="cover-sweep relative overflow-hidden">
        <div className="relative flex h-full flex-col px-4 py-5 sm:px-8 lg:px-12 lg:py-8">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-brand-ink hover:underline underline-offset-4"
          >
            <ArrowLeftIcon className="size-4" />
            Back to site
          </Link>

          {/* Compact identity on small screens. */}
          <div className="mt-5 flex items-center gap-4 lg:hidden">
            <Image
              src={LOGO.src}
              alt="PICE PCU–Dasmariñas Student Chapter emblem"
              width={LOGO.width}
              height={LOGO.height}
              preload
              sizes="56px"
              className="h-20 w-auto"
            />
            <div>
              <p className="font-display text-3xl leading-none font-extrabold uppercase text-brand-ink">
                PICE PCUD
              </p>
              <p className="mt-1.5 font-wide text-[0.55rem] leading-relaxed uppercase tracking-[0.12em] text-brand-ink">
                PCU–Dasmariñas Student Chapter
              </p>
            </div>
          </div>

          {/* Full identity on large screens. */}
          <div className="hidden flex-1 flex-col items-center justify-center py-12 text-center lg:flex">
            <Image
              src={LOGO.src}
              alt="PICE PCU–Dasmariñas Student Chapter emblem"
              width={LOGO.width}
              height={LOGO.height}
              preload
              sizes="(min-width: 1280px) 270px, 225px"
              className="h-80 w-auto drop-shadow-[0_12px_24px_rgb(20_6_97/0.25)] xl:h-96"
            />
            <p className="mt-10 font-headline text-6xl leading-[0.9] uppercase text-brand-ink xl:text-7xl">
              Philippine Institute
              <br />
              of Civil Engineers
            </p>
            <hr className="chrome-rule my-5 w-64" />
            <p className="font-wide text-[0.6rem] leading-relaxed uppercase tracking-[0.12em] text-brand-ink">
              Philippine Christian University – Dasmariñas
              <br />
              Student Chapter
            </p>
          </div>
        </div>
      </aside>

      <main className="flex items-start justify-center px-4 py-10 sm:px-8 lg:items-center lg:py-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
