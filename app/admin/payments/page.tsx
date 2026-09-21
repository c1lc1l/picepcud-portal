import Link from "next/link";
import { PaymentsTable, type PaymentRow } from "@/components/admin/PaymentsTable";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const FILTERS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
] as const;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = FILTERS.find((f) => f.value === status)?.value ?? "pending";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_payments", {
    p_status: active === "all" ? null : active,
  });

  const payments = (data ?? []).map((p: PaymentRow) => ({
    ...p,
    amount: Number(p.amount),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-muted-foreground">
          Review GCash receipts submitted by members.
        </p>
      </div>
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={active === f.value ? "default" : "outline"}
            size="sm"
            nativeButton={false}
            render={<Link href={`/admin/payments?status=${f.value}`} />}
          >
            {f.label}
          </Button>
        ))}
      </div>
      {error ? (
        <p className="text-sm text-destructive">
          Failed to load payments: {error.message}
        </p>
      ) : (
        <PaymentsTable payments={payments} />
      )}
    </div>
  );
}
