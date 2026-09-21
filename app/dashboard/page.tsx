import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { StatusBadge, type PaymentStatus } from "@/components/admin/PaymentsTable";
import { GcashUploadDialog } from "@/components/payments/GcashUploadDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

type PaymentRow = {
  id: string;
  amount: number | string;
  reference_no: string;
  status: PaymentStatus;
  admin_notes: string | null;
  created_at: string;
};

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: payments }, { data: events }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, amount, reference_no, status, admin_notes, created_at")
      .eq("user_id", user?.id ?? "")
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, title, event_date, location")
      .eq("is_active", true)
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(5),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Welcome{profile ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-muted-foreground">Signed in as {user?.email}</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{profile?.full_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Student ID</p>
              <p className="font-medium">{profile?.student_id ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Year Level</p>
              <p className="font-medium">{profile?.year_level ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              GCash receipts you have submitted for verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {user && (
              <div>
                <GcashUploadDialog userId={user.id} />
              </div>
            )}
            {!payments?.length ? (
              <p className="text-sm text-muted-foreground">
                You haven’t submitted any payments yet.
              </p>
            ) : (
              <ul className="divide-y">
                {(payments as PaymentRow[]).map((p) => (
                  <li key={p.id} className="flex flex-col gap-1 py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">
                        {peso.format(Number(p.amount))}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="text-muted-foreground">
                      Ref{" "}
                      <span className="font-mono">{p.reference_no}</span> ·{" "}
                      {dateFormat.format(new Date(p.created_at))}
                    </div>
                    {p.status === "rejected" && p.admin_notes && (
                      <p className="rounded-md bg-red-50 p-2 text-red-800 dark:bg-red-500/10 dark:text-red-300">
                        Admin note: {p.admin_notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Chapter Events</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!events?.length ? (
            <p className="text-sm text-muted-foreground">
              No upcoming events right now.
            </p>
          ) : (
            <ul className="divide-y">
              {events.map((ev) => (
                <li
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="font-medium">{ev.title}</span>
                  <span className="text-muted-foreground">
                    {dateFormat.format(new Date(ev.event_date))} · {ev.location}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/events"
            className="text-sm font-medium underline underline-offset-4"
          >
            View all events →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
