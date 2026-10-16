import { OfficerProfileCard } from "@/components/officers/OfficerProfileCard";
import { OFFICER_GROUPS, type Officer } from "@/lib/officers/types";
import { sortOfficers } from "@/lib/officers/validation";

/** Grouped, ordered officer grid; each card opens a profile pop-up. */
export function OfficerDirectory({
  officers,
}: {
  officers: readonly Officer[];
}) {
  const sorted = sortOfficers(officers);

  return (
    <div className="flex flex-col gap-14">
      {OFFICER_GROUPS.map(({ key, label }) => {
        const members = sorted.filter((o) => o.officer_group === key);
        if (!members.length) return null;
        return (
          <section key={key} aria-labelledby={`officers-${key}`}>
            <h2
              id={`officers-${key}`}
              className="font-headline text-5xl leading-none uppercase text-brand-ink md:text-6xl"
            >
              {label}
            </h2>
            <hr className="chrome-rule mt-5 mb-8" />
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {members.map((o) => (
                <li key={o.id}>
                  <OfficerProfileCard officer={o} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
