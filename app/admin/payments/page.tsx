import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AdminPageHeader,
  tableFrameClass,
} from "@/components/admin/AdminPageHeader";
import { Pagination } from "@/components/admin/Pagination";
import {
  PaymentsTable,
  type PaymentRow,
  type PaymentStatus,
} from "@/components/admin/PaymentsTable";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments | Admin | PICE PCUD" };

const FILTERS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
] as const;

const STATUSES: PaymentStatus[] = ["pending", "approved", "rejected"];

const PAGE_SIZE = 20;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const active =
    FILTERS.find((f) => f.value === params.status)?.value ?? "pending";
  const requestedPage = Math.max(
    1,
    Number.parseInt(params.page ?? "1", 10) || 1,
  );

  const supabase = await createClient();
  const [{ data, error }, ...countResults] = await Promise.all([
    supabase.rpc("admin_list_payments", {
      p_status: active === "all" ? null : active,
    }),
    ...STATUSES.map((s) =>
      supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", s),
    ),
  ]);

  const counts: Record<string, number | null> = Object.fromEntries(
    STATUSES.map((s, i) => [s, countResults[i].count]),
  );
  counts.all = STATUSES.every((s) => counts[s] != null)
    ? STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0)
    : null;

  // The RPC returns every row for the status; page through them here.
  const rows = (data ?? []) as PaymentRow[];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageHref = (p: number) =>
    `/admin/payments?status=${active}${p > 1 ? `&page=${p}` : ""}`;
  if (!error && requestedPage > totalPages) redirect(pageHref(page));

  const payments = rows
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((p) => ({ ...p, amount: Number(p.amount) }));

  return (
    <>
      <AdminPageHeader
        title="Payments"
        description="Check each GCash receipt against its reference number and amount before approving."
      />

      <nav
        aria-label="Filter by status"
        className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:flex sm:w-fit"
      >
        {FILTERS.map((f) => {
          const isActive = active === f.value;
          return (
            <Link
              key={f.value}
              href={`/admin/payments?status=${f.value}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-card text-brand-ink shadow-sm ring-1 ring-foreground/10"
                  : "text-muted-foreground hover:text-brand-ink",
              )}
            >
              {f.label}
              {counts[f.value] != null && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    f.value === "pending" && (counts.pending ?? 0) > 0
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  {counts[f.value]}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Failed to load payments: {error.message}
        </p>
      ) : (
        <>
          <div className={tableFrameClass}>
            <PaymentsTable payments={payments} />
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={rows.length}
            hrefFor={pageHref}
            label="Payments pages"
          />
        </>
      )}
    </>
  );
}
