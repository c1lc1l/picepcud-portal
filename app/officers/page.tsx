import type { Metadata } from "next";
import { UsersIcon } from "lucide-react";
import { OfficerDirectory } from "@/components/officers/OfficerDirectory";
import { PageMasthead } from "@/components/site/PageMasthead";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getPublicRoster } from "@/lib/officers/queries";

export const metadata: Metadata = {
  title: "Officers | PICE PCUD",
  description: "Officers of the PICE PCU–Dasmariñas Student Chapter.",
};

export default async function OfficersPage() {
  const { settings, officers } = await getPublicRoster();
  const live = officers.length > 0;

  return (
    <>
      <PageMasthead title="Officers" current="officers">
        {live && settings && <p>Chapter officers for {settings.term_label}.</p>}
      </PageMasthead>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-16 sm:px-6 md:py-20">
        {live ? (
          <OfficerDirectory officers={officers} />
        ) : (
          <div
            role="status"
            className="flex items-start gap-4 rounded-md border border-dashed border-brand-periwinkle/50 bg-white/60 p-6"
          >
            <UsersIcon className="mt-0.5 size-5 shrink-0 text-brand-violet" />
            <p className="font-medium text-brand-ink">
              The officer directory is not available yet.
            </p>
          </div>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
