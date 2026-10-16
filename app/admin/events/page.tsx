import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CreateEventDialog } from "@/components/admin/CreateEventDialog";
import { EventsBrowser } from "@/components/admin/EventsBrowser";
import type { EventRow } from "@/components/admin/EventsTable";
import { manilaDateKey } from "@/lib/calendar";
import { withPastFlag } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Events | Admin | PICE PCUD" };

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, event_date, location, luma_url, is_active")
    .order("event_date", { ascending: false });

  return (
    <>
      <AdminPageHeader
        title="Events"
        description="Active events appear on the public site. Registration happens on Luma."
        actions={<CreateEventDialog />}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Failed to load events: {error.message}
        </p>
      ) : (
        <EventsBrowser
          events={withPastFlag((data ?? []) as Omit<EventRow, "is_past">[])}
          today={manilaDateKey()}
        />
      )}
    </>
  );
}
