import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { PaymentRow } from "@/components/admin/PaymentsTable";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eventDateFormat, getUpcomingEvents } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin | PICE PCUD" };

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const QUEUE_SIZE = 5;

export default async function AdminDashboardPage() {
  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const [members, events, pending, upcoming] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.rpc("admin_list_payments", { p_status: "pending" }),
    getUpcomingEvents(3),
  ]);

  // The RPC returns newest first; review the ones waiting longest first.
  const pendingRows = (pending.data ?? []) as PaymentRow[];
  const queue = pendingRows.slice(-QUEUE_SIZE).reverse();

  const stats = [
    {
      label: "Payments awaiting review",
      value: pending.error ? null : pendingRows.length,
      href: "/admin/payments",
    },
    {
      label: "Registered members",
      value: members.count,
      href: "/admin/members",
    },
    { label: "Active events", value: events.count, href: "/admin/events" },
  ];

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description={profile ? `Signed in as ${profile.full_name}.` : undefined}
      />

      <ul className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className="group flex h-full flex-col justify-between gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-colors hover:ring-brand-periwinkle/60"
            >
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className="flex items-end justify-between">
                <span className="text-4xl font-semibold text-brand-ink">
                  {s.value ?? "—"}
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Waiting for review</CardTitle>
            <CardAction>
              <Link
                href="/admin/payments"
                className="text-sm font-semibold text-brand-indigo underline-offset-4 hover:underline"
              >
                Review payments
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {pending.error ? (
              <p role="alert" className="text-sm text-destructive">
                Couldn&apos;t load payments: {pending.error.message}
              </p>
            ) : !queue.length ? (
              <p className="text-sm text-muted-foreground">
                All caught up — no payments are waiting.
              </p>
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {queue.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-brand-ink">
                          {p.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {p.student_id} · Ref{" "}
                          <span className="font-mono">{p.reference_no}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums text-brand-ink">
                          {peso.format(Number(p.amount))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {eventDateFormat.format(new Date(p.created_at))}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                {pendingRows.length > queue.length && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Showing the {queue.length} oldest of {pendingRows.length}.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next events</CardTitle>
            <CardAction>
              <Link
                href="/admin/events"
                className="text-sm font-semibold text-brand-indigo underline-offset-4 hover:underline"
              >
                Manage
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {!upcoming.data?.length ? (
              <p className="text-sm text-muted-foreground">
                No upcoming events. Add one from the Events tab.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {upcoming.data.map((ev) => (
                  <li key={ev.id} className="text-sm">
                    <p className="font-medium text-brand-ink">{ev.title}</p>
                    <p className="text-muted-foreground">
                      {eventDateFormat.format(new Date(ev.event_date))} ·{" "}
                      {ev.location}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
