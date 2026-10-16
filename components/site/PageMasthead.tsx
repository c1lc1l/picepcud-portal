import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";

/** Short cover-art band for inner public pages: header, title, intro. */
export function PageMasthead({
  title,
  current,
  children,
}: {
  title: string;
  current?: ComponentProps<typeof SiteHeader>["current"];
  children?: ReactNode;
}) {
  return (
    <section className="cover-sweep relative overflow-hidden">
      <SiteHeader variant="overlay" current={current} />
      <Image
        src="/brand/pice-pcud-logo.png"
        alt=""
        width={810}
        height={1154}
        aria-hidden
        sizes="480px"
        className="emblem-ghost pointer-events-none absolute top-[62%] right-[-6%] hidden h-[210%] w-auto -translate-y-1/2 opacity-30 md:block"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 pt-6 pb-12 sm:px-6 md:pt-10 md:pb-16">
        <h1 className="font-headline text-[clamp(4rem,10vw,7.5rem)] leading-[0.9] uppercase text-brand-ink">
          {title}
        </h1>
        <hr className="chrome-rule my-5 max-w-md" />
        {children && (
          <div className="max-w-xl text-base leading-relaxed text-brand-ink/85 sm:text-lg">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
