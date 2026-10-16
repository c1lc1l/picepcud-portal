import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogOutIcon } from "lucide-react";
import { signOut } from "@/app/actions/auth";

type Section = "dashboard" | "events" | "admin";

const linkClass =
  "rounded-md px-2.5 py-1.5 text-sm font-medium text-brand-ink hover:bg-white/40 aria-[current=page]:bg-white/50 aria-[current=page]:font-semibold";

/**
 * Slim cover-art band for signed-in pages: identity, portal nav, sign-out,
 * and an optional page intro underneath. Content below stays plain.
 */
export function PortalHeader({
  current,
  isAdmin,
  tabs,
  children,
}: {
  current: Section;
  isAdmin: boolean;
  /** Section tabs pinned to the bottom edge of the band. */
  tabs?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="cover-sweep border-b border-brand-violet/30">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-brand-ink"
        >
          <Image
            src="/brand/pice-pcud-logo.png"
            alt=""
            width={810}
            height={1154}
            className="h-9 w-auto"
            sizes="26px"
            preload
          />
          <span className="font-display text-xl font-extrabold uppercase tracking-wide">
            PICE PCUD
          </span>
        </Link>

        <nav aria-label="Portal" className="flex items-center gap-1">
          <Link
            href="/dashboard"
            aria-current={current === "dashboard" ? "page" : undefined}
            className={linkClass}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/events"
            aria-current={current === "events" ? "page" : undefined}
            className={linkClass}
          >
            Events
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              aria-current={current === "admin" ? "page" : undefined}
              className={linkClass}
            >
              Admin
            </Link>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className={`${linkClass} inline-flex items-center gap-1.5`}
            >
              <LogOutIcon className="size-4" />
              <span className="hidden sm:inline">Log out</span>
              <span className="sr-only sm:hidden">Log out</span>
            </button>
          </form>
        </nav>
      </div>

      {children && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-8 sm:px-6 sm:pt-6 sm:pb-10">
          {children}
        </div>
      )}
      {tabs && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-2 sm:px-6">{tabs}</div>
      )}
    </header>
  );
}
