import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OfficersManager } from "@/components/admin/OfficersManager";
import { RosterTermCard } from "@/components/admin/RosterTermCard";
import { getAllOfficers, getRosterSettings } from "@/lib/officers/queries";
import {
  isRosterLive,
  rosterPublishBlocker,
  sortOfficers,
} from "@/lib/officers/validation";

export const metadata: Metadata = { title: "Officers | Admin | PICE PCUD" };

// en-CA formats as YYYY-MM-DD, the value a date input expects.
const manilaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
});

export default async function AdminOfficersPage() {
  const [settings, { officers, error }] = await Promise.all([
    getRosterSettings(),
    getAllOfficers(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Officers"
        description="The executive board shown on the public officers page."
      />

      {!settings || error ? (
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t load the officer roster
          {error
            ? `: ${error.message}`
            : ". Run the latest database migration."}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <RosterTermCard
            initial={{
              termLabel: settings.term_label,
              termStart: settings.term_start
                ? manilaDate.format(new Date(settings.term_start))
                : "",
              termEnd: settings.term_end
                ? manilaDate.format(new Date(settings.term_end))
                : "",
              isPublished: settings.is_published,
              isLive: isRosterLive(settings),
              blocker: rosterPublishBlocker(settings),
            }}
          />
          <OfficersManager officers={sortOfficers(officers)} />
        </div>
      )}
    </>
  );
}
