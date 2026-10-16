import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  WalletIcon,
} from "lucide-react";
import {
  StatusBadge,
  type PaymentStatus,
} from "@/components/admin/PaymentsTable";
import { GcashUploadDialog } from "@/components/payments/GcashUploadDialog";
import { EditProfileDialog } from "@/components/portal/EditProfileDialog";
import { PortalHeader } from "@/components/portal/PortalHeader";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  eventDateFormat,
  getUpcomingEvents,
  manilaDateParts,
} from "@/lib/events";
import { yearLevelLabel } from "@/lib/members";
import { getGcashAccount } from "@/lib/payments/gcash";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard | PICE PCUD" };

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

/** What the dues panel says, driven by the member's most recent payment. */
function duesState(latest: PaymentRow | undefined) {
  if (!latest) {
    return {
      tone: "neutral",
      Icon: WalletIcon,
      title: "No payment submitted yet",
      body: "Settle your membership fee through GCash, then upload your receipt here so an officer can verify it.",
      action: { label: "Pay via GCash", variant: "default" },
    } as const;
  }
  const submitted = eventDateFormat.format(new Date(latest.created_at));
  switch (latest.status) {
    case "pending":
      return {
        tone: "pending",
        Icon: ClockIcon,
        title: "Your payment is under review",
        body: `Submitted ${submitted}. You'll get an email once an officer approves it.`,
        action: { label: "Submit another payment", variant: "outline" },
      } as const;
    case "approved":
      return {
        tone: "approved",
        Icon: CircleCheckIcon,
        title: "Your latest payment was approved",
        body: `${peso.format(Number(latest.amount))} · submitted ${submitted}.`,
        action: { label: "Submit another payment", variant: "outline" },
      } as const;
    case "rejected":
      return {
        tone: "rejected",
        Icon: CircleXIcon,
        title: "Your latest payment was rejected",
        body: "Check the officer's note below, then submit a corrected receipt.",
        action: { label: "Submit again", variant: "default" },
      } as const;
  }
}

const TONE_STYLES = {
  neutral: { bar: "bg-brand-periwinkle", icon: "text-brand-violet" },
  pending: { bar: "bg-yellow-500", icon: "text-yellow-700" },
  approved: { bar: "bg-green-600", icon: "text-green-700" },
  rejected: { bar: "bg-destructive", icon: "text-destructive" },
};

export default async function DashboardPage() {
  const { user, profile, isAdmin } = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: paymentData }, { data: events }, gcash] = await Promise.all([
    supabase
      .from("payments")
      .select("id, amount, reference_no, status, admin_notes, created_at")
      .eq("user_id", user?.id ?? "")
      .order("created_at", { ascending: false }),
    getUpcomingEvents(4),
    getGcashAccount(),
  ]);
  const payments = (paymentData ?? []) as PaymentRow[];
  const latest = payments[0];
  const dues = duesState(latest);
  const tone = TONE_STYLES[dues.tone];
  const firstName = profile?.full_name.split(" ")[0];
  const year = yearLevelLabel(profile?.year_level);

  return (
    <>
      <PortalHeader current="dashboard" isAdmin={isAdmin}>
        <h1 className="font-headline text-6xl leading-none uppercase text-brand-ink sm:text-7xl">
          Welcome{firstName ? `, ${firstName}` : ""}
        </h1>
        {profile && (
          <p className="mt-3 font-wide text-[0.7rem] uppercase tracking-[0.14em] text-brand-ink">
            {profile.student_id}
            {year && ` · ${year}`}
          </p>
        )}
      </PortalHeader>

      <main className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          {/* Dues status */}
          <section
            aria-labelledby="dues-heading"
            className="relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
          >
            <span
              aria-hidden
              className={cn("absolute inset-y-0 left-0 w-1", tone.bar)}
            />
            <div className="flex flex-col gap-5 p-6 pl-7 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <dues.Icon
                  className={cn("mt-0.5 size-6 shrink-0", tone.icon)}
                />
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Membership fee
                  </p>
                  <h2
                    id="dues-heading"
                    className="mt-1 text-lg font-semibold text-brand-ink"
                  >
                    {dues.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {dues.body}
                  </p>
                  {latest?.status === "rejected" && latest.admin_notes && (
                    <p className="mt-3 rounded-md bg-destructive/5 px-3 py-2 text-sm text-brand-ink ring-1 ring-destructive/20">
                      <span className="font-semibold">
                        Officer&apos;s note:
                      </span>{" "}
                      {latest.admin_notes}
                    </p>
                  )}
                </div>
              </div>
              {user && (
                <div className="shrink-0 pl-10 sm:pl-0">
                  <GcashUploadDialog
                    userId={user.id}
                    gcash={gcash}
                    triggerLabel={dues.action.label}
                    triggerVariant={dues.action.variant}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Payment history */}
          <Card>
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
              <CardDescription>
                GCash receipts you&apos;ve submitted, newest first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!payments.length ? (
                <p className="text-sm text-muted-foreground">
                  Nothing here yet. Your payments will be listed once you submit
                  a receipt.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold tabular-nums text-brand-ink">
                          {peso.format(Number(p.amount))}
                        </span>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ref <span className="font-mono">{p.reference_no}</span>{" "}
                        · {eventDateFormat.format(new Date(p.created_at))}
                      </p>
                      {p.status === "rejected" &&
                        p.admin_notes &&
                        p.id !== latest?.id && (
                          <p className="text-sm text-muted-foreground">
                            Officer&apos;s note: {p.admin_notes}
                          </p>
                        )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Your details</CardTitle>
              {profile && (
                <CardAction>
                  <EditProfileDialog profile={profile} email={user?.email} />
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium text-brand-ink">
                  {profile?.full_name ?? "—"}
                </dd>
                <dt className="text-muted-foreground">Student ID</dt>
                <dd className="font-medium text-brand-ink">
                  {profile?.student_id ?? "—"}
                </dd>
                <dt className="text-muted-foreground">Year level</dt>
                <dd className="font-medium text-brand-ink">{year ?? "—"}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium break-all text-brand-ink">
                  {user?.email}
                </dd>
              </dl>
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming events</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!events?.length ? (
                <p className="text-sm text-muted-foreground">
                  No upcoming events right now.
                </p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {events.map((ev) => {
                    const d = manilaDateParts(ev.event_date);
                    return (
                      <li key={ev.id} className="flex gap-3">
                        <div className="w-11 shrink-0 text-center text-brand-indigo">
                          <p className="font-wide text-[0.7rem] uppercase tracking-widest">
                            {d.month}
                          </p>
                          <p className="font-display text-3xl leading-none font-extrabold">
                            {d.day}
                          </p>
                        </div>
                        <div className="min-w-0 text-sm">
                          <p className="font-medium text-brand-ink">
                            {ev.title}
                          </p>
                          <p className="text-muted-foreground">
                            {ev.location} · {d.time}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                href="/dashboard/events"
                className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-indigo underline-offset-4 hover:underline"
              >
                All events <ArrowRightIcon className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
