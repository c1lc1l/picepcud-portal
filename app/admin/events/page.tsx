import { CreateEventDialog } from "@/components/admin/CreateEventDialog";
import { EventsTable, type EventRow } from "@/components/admin/EventsTable";
import { createClient } from "@/lib/supabase/server";

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, event_date, location, luma_url, is_active")
    .order("event_date", { ascending: false });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-muted-foreground">
            Create and manage chapter events linked to Luma.
          </p>
        </div>
        <CreateEventDialog />
      </div>
      {error ? (
        <p className="text-sm text-destructive">
          Failed to load events: {error.message}
        </p>
      ) : (
        <EventsTable events={(data ?? []) as EventRow[]} />
      )}
    </div>
  );
}
