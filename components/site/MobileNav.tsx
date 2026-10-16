"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MobileNavItem = { href: string; label: string; current: boolean };

/** Phone-width menu for the public header: a toggle that drops a panel of
 * links below the header. Hidden from `sm` up, where links sit inline. */
export function MobileNav({ items }: { items: MobileNavItem[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="sm:hidden">
      <Button
        variant="ghost"
        size="icon-lg"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className="text-brand-ink hover:bg-white/40"
      >
        {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
      </Button>

      {open && (
        <>
          {/* Tap anywhere outside the panel to close it. */}
          <div
            aria-hidden
            className="fixed inset-0"
            onClick={() => setOpen(false)}
          />
          <nav
            id={panelId}
            aria-label="Main"
            className="absolute inset-x-0 top-full border-y border-brand-violet/20 bg-brand-pearl/95 px-4 py-2 shadow-[0_16px_32px_-16px_rgb(20_6_97/0.35)] backdrop-blur-md"
          >
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 text-base font-medium text-brand-ink hover:bg-brand-silver/50 aria-[current=page]:bg-brand-silver/70 aria-[current=page]:font-semibold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
