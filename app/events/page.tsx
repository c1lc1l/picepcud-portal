import Link from "next/link";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Events | PICE PCUD" };

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, description, event_date, location, banner_url, luma_url")
    .eq("is_active", true)
    .order("event_date", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Chapter Events</h1>
        <p className="text-muted-foreground">
          Upcoming PICE PCUD events. Register through Luma.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          Failed to load events. Please try again later.
        </p>
      ) : !events?.length ? (
        <p className="py-12 text-center text-muted-foreground">
          No events are open right now. Check back soon!
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <Card key={ev.id} className="overflow-hidden pt-0">
              {ev.banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded banner from Supabase storage
                <img
                  src={ev.banner_url}
                  alt={`${ev.title} banner`}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground">
                  <CalendarIcon className="size-10" />
                </div>
              )}
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <CalendarIcon />
                    {dateFormat.format(new Date(ev.event_date))}
                  </Badge>
                  <Badge variant="outline">
                    <MapPinIcon />
                    {ev.location}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{ev.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="line-clamp-4 whitespace-pre-line">
                  {ev.description}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  nativeButton={false}
                  render={
                    <Link
                      href={ev.luma_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Register on Luma ↗
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
