import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HighlightsManager } from "@/components/admin/HighlightsManager";
import { getAllHighlights } from "@/lib/highlights/queries";

export const metadata: Metadata = {
  title: "Check these out! | Admin | PICE PCUD",
};

export default async function AdminHighlightsPage() {
  const { highlights, error } = await getAllHighlights();

  return (
    <>
      <AdminPageHeader
        title="Check these out!"
        description="Past events and social posts shown in the “Check these out!” carousel below Upcoming events on the homepage."
      />

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t load posts: {error.message}
        </p>
      ) : (
        <HighlightsManager highlights={highlights} />
      )}
    </>
  );
}
