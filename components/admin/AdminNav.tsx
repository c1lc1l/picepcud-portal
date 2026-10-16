"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/highlights", label: "Check these out!" },
  { href: "/admin/officers", label: "Officers" },
  { href: "/admin/settings", label: "Settings" },
];

/** Admin section tabs; sits on the bottom edge of the portal band. */
export function AdminNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  // Which edges have tabs scrolled out of view (phones only, in practice).
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const current = nav.querySelector<HTMLElement>('[aria-current="page"]');
    if (current) {
      nav.scrollLeft =
        current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
    }
    const update = () =>
      setEdges({
        start: nav.scrollLeft > 4,
        end: nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4,
      });
    const frame = requestAnimationFrame(update);
    nav.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      nav.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  const fade = `linear-gradient(to right, ${
    edges.start ? "transparent 0, black 2rem" : "black 0"
  }, ${edges.end ? "black calc(100% - 2rem), transparent 100%" : "black 100%"})`;

  return (
    <nav
      ref={navRef}
      aria-label="Admin sections"
      className="relative -mb-px overflow-x-auto scrollbar-none"
      style={{ maskImage: fade, WebkitMaskImage: fade }}
    >
      <ul className="flex gap-1">
        {SECTIONS.map(({ href, label }) => {
          const active =
            href === "/admin"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-t-md border border-b-0 px-4 py-2 text-sm font-medium whitespace-nowrap",
                  active
                    ? "border-brand-violet/30 bg-background text-brand-ink"
                    : "border-transparent text-brand-ink/80 hover:bg-white/40 hover:text-brand-ink",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
