"use client";

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

  return (
    <nav aria-label="Admin sections" className="-mb-px overflow-x-auto">
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
