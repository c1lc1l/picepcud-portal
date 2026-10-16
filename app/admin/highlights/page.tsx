import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HighlightsManager } from "@/components/admin/HighlightsManager";
import { getAllHighlights } from "@/lib/highlights/queries";

export const metadata: Metadata = { title: "Moments | Admin | PICE PCUD" };

export default async function AdminHighlightsPage() {
  const { highlights, error } = await getAllHighlights();

  return (
    <>
      <AdminPageHeader
        title="Moments"
        description="Past events and social posts shown in a carousel below Upcoming events on the homepage."
      />

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t load moments: {error.message}
        </p>
      ) : (
        <HighlightsManager highlights={highlights} />
      )}
    </>
  );
}
