import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "@/components/site/MobileNav";
import { Button } from "@/components/ui/button";
import { isOfficerDirectoryLive } from "@/lib/officers/queries";
import { cn } from "@/lib/utils";

const navLinkClass =
  "rounded-md px-2.5 py-1.5 text-sm font-medium text-brand-ink hover:bg-white/40 aria-[current=page]:bg-white/50 aria-[current=page]:font-semibold";

/**
 * Public masthead. `overlay` sits transparently on the cover hero; `solid`
 * is for inner public pages. The logo only reads on mid-tone or light
 * grounds (its seal and year vanish on dark), so both variants stay light.
 */
export async function SiteHeader({
  variant = "solid",
  current,
}: {
  variant?: "overlay" | "solid";
  /** Marks the matching nav link as the current page. */
  current?: "events" | "officers" | "login";
}) {
  // The officer directory is only advertised once its roster is published.
  const showOfficers = await isOfficerDirectoryLive();

  return (
    <header
      className={cn(
        "relative z-10 w-full",
        variant === "solid" && "cover-sweep border-b border-brand-violet/30",
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md text-brand-ink"
        >
          <Image
            src="/brand/pice-pcud-logo.png"
            alt=""
            width={810}
            height={1154}
            className="h-11 w-auto"
            preload
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-2xl font-extrabold uppercase tracking-wide">
              PICE PCUD
            </span>
            <span className="mt-1 hidden font-wide text-[0.55rem] uppercase tracking-[0.14em] text-brand-ink/80 sm:block">
              PCU–D Student Chapter
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/events"
            aria-current={current === "events" ? "page" : undefined}
            className={cn(navLinkClass, "hidden sm:block")}
          >
            Events
          </Link>
          {showOfficers && (
            <Link
              href="/officers"
              aria-current={current === "officers" ? "page" : undefined}
              className={cn(navLinkClass, "hidden sm:block")}
            >
              Officers
            </Link>
          )}
          <Link
            href="/login"
            aria-current={current === "login" ? "page" : undefined}
            className={cn(navLinkClass, "hidden sm:block")}
          >
            Log in
          </Link>
          <Button
            nativeButton={false}
            render={<Link href="/register" />}
            size="lg"
            className="px-3.5"
          >
            Join
          </Button>
          <MobileNav
            items={[
              {
                href: "/events",
                label: "Events",
                current: current === "events",
              },
              ...(showOfficers
                ? [
                    {
                      href: "/officers",
                      label: "Officers",
                      current: current === "officers",
                    },
                  ]
                : []),
              { href: "/login", label: "Log in", current: current === "login" },
            ]}
          />
        </nav>
      </div>
    </header>
  );
}
