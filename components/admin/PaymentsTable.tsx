"use client";

import { useState, useTransition } from "react";
import { CheckIcon, EyeIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { approvePayment, rejectPayment } from "@/app/actions/admin-payments";
import { getReceiptUrl } from "@/app/actions/payments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PaymentStatus = "pending" | "approved" | "rejected";

export type PaymentRow = {
  id: string;
  full_name: string;
  student_id: string;
  email: string;
  reference_no: string;
  amount: number;
  status: PaymentStatus;
  proof_url: string;
  created_at: string;
};

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
  approved:
    "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant="outline"
      className={`border-0 capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </Badge>
  );
}

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function PaymentsTable({ payments }: { payments: PaymentRow[] }) {
  const [selected, setSelected] = useState<PaymentRow | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [review, setReview] = useState<{
    payment: PaymentRow;
    action: "approve" | "reject";
  } | null>(null);
  const [reason, setReason] = useState("");
  const [reviewing, startReview] = useTransition();
  // Optimistic status overrides until the revalidated data arrives.
  const [statuses, setStatuses] = useState<Record<string, PaymentStatus>>({});

  function openReceipt(payment: PaymentRow) {
    setSelected(payment);
    setSignedUrl(null);
    setError(null);
    startTransition(async () => {
      const result = await getReceiptUrl(payment.proof_url);
      if ("error" in result) setError(result.error);
      else setSignedUrl(result.url);
    });
  }

  function confirmReview() {
    if (!review) return;
    const { payment, action } = review;
    startReview(async () => {
      const result =
        action === "approve"
          ? await approvePayment(payment.id)
          : await rejectPayment(payment.id, reason);
      setReview(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setStatuses((s) => ({
        ...s,
        [payment.id]: action === "approve" ? "approved" : "rejected",
      }));
      if (result.warning) toast.warning(result.warning);
      else
        toast.success(
          action === "approve" ? "Payment approved" : "Payment rejected",
        );
    });
  }

  function handleOpenChange(open: boolean) {
    if (open) return;
    setSelected(null);
    setSignedUrl(null);
    setError(null);
  }

  return (
    <>
      <Table className="min-w-180">
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Reference no.</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No payments found.
              </TableCell>
            </TableRow>
          ) : (
            payments.map((row) => {
              const p = { ...row, status: statuses[row.id] ?? row.status };
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium text-brand-ink">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.student_id} · {p.email}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {p.reference_no}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {peso.format(p.amount)}
                  </TableCell>
                  <TableCell>
                    {dateFormat.format(new Date(p.created_at))}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReceipt(p)}
                      >
                        <EyeIcon />
                        Receipt
                      </Button>
                      {p.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            disabled={reviewing}
                            onClick={() =>
                              setReview({ payment: p, action: "approve" })
                            }
                          >
                            <CheckIcon />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={reviewing}
                            onClick={() => {
                              setReason("");
                              setReview({ payment: p, action: "reject" });
                            }}
                          >
                            <XIcon />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Dialog open={selected !== null} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt — {selected?.full_name}</DialogTitle>
            <DialogDescription>
              Ref {selected?.reference_no} ·{" "}
              {selected ? peso.format(selected.amount) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-64 items-center justify-center overflow-auto rounded-lg bg-muted">
            {isPending && (
              <p className="text-sm text-muted-foreground">Loading receipt…</p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {signedUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
              <img
                src={signedUrl}
                alt={`GCash receipt from ${selected?.full_name}`}
                className="max-h-[70vh] w-auto object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={review !== null}
        onOpenChange={(open) => !open && !reviewing && setReview(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {review?.action === "approve"
                ? "Approve payment?"
                : "Reject payment?"}
            </DialogTitle>
            <DialogDescription>
              {review?.payment.full_name} · Ref {review?.payment.reference_no} ·{" "}
              {review ? peso.format(review.payment.amount) : null}
              {review?.action === "approve" &&
                ". A confirmation email will be sent to the member."}
            </DialogDescription>
          </DialogHeader>
          {review?.action === "reject" && (
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={reviewing}
              onClick={() => setReview(null)}
            >
              Cancel
            </Button>
            <Button
              variant={review?.action === "reject" ? "destructive" : "default"}
              disabled={reviewing}
              onClick={confirmReview}
            >
              {reviewing
                ? "Working…"
                : review?.action === "approve"
                  ? "Approve"
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
