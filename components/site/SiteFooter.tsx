import Link from "next/link";
import { CHAPTER_SOCIALS } from "@/components/icons/SocialIcons";
import { isOfficerDirectoryLive } from "@/lib/officers/queries";

export async function SiteFooter() {
  const showOfficers = await isOfficerDirectoryLive();

  return (
    <footer className="mt-auto bg-brand-deep text-brand-silver">
      <hr className="chrome-rule-dark" />
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:grid-cols-[1fr_auto] sm:px-6">
        <div className="max-w-md">
          <p className="font-display text-3xl font-extrabold uppercase leading-none tracking-wide text-white">
            PICE PCUD
          </p>
          <p className="mt-3 font-wide text-[0.7rem] uppercase leading-relaxed tracking-[0.14em]">
            Philippine Institute of Civil Engineers
            <br />
            Philippine Christian University – Dasmariñas
            <br />
            Student Chapter
          </p>
        </div>
        <div className="flex flex-col gap-6 sm:items-end">
          <nav
            aria-label="Footer"
            className="flex flex-col gap-2 text-sm sm:items-end"
          >
            <Link href="/events" className="transition-colors hover:text-white">
              Events
            </Link>
            {showOfficers && (
              <Link
                href="/officers"
                className="transition-colors hover:text-white"
              >
                Officers
              </Link>
            )}
            <Link
              href="/register"
              className="transition-colors hover:text-white"
            >
              Join the chapter
            </Link>
            <Link href="/login" className="transition-colors hover:text-white">
              Member login
            </Link>
          </nav>
          <ul className="flex gap-2" aria-label="Social media">
            {CHAPTER_SOCIALS.map(({ label, href, Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} (opens in a new tab)`}
                  className="flex size-10 items-center justify-center rounded-full ring-1 ring-brand-silver/30 transition-colors hover:bg-white/10 hover:text-white hover:ring-brand-silver/60"
                >
                  <Icon className="size-4.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 pb-8 text-xs text-brand-silver/70 sm:flex-row sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} PICE-PCUD. All rights reserved.</p>
        <a
          href="mailto:pice.cavite@pcu.edu.ph"
          className="transition-colors hover:text-white"
        >
          pice.cavite@pcu.edu.ph
        </a>
      </div>
    </footer>
  );
}
