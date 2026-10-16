"use client";

import { useRef, useState, type ComponentProps } from "react";
import imageCompression from "browser-image-compression";
import { CheckIcon, CopyIcon, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitPayment } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GcashAccount } from "@/lib/payments/gcash";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const BUCKET = "gcash-receipts";

type Stage = "idle" | "compressing" | "uploading";

export function GcashUploadDialog({
  userId,
  gcash,
  triggerLabel = "Pay via GCash",
  triggerVariant,
}: {
  userId: string;
  /**
   * Receiving account, passed from the server so it stays out of the bundle.
   * Null until an admin sets it up in /admin/settings.
   */
  gcash: GcashAccount | null;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referenceNo, setReferenceNo] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = stage !== "idle";

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setReferenceNo("");
    setAmount("");
    setFile(null);
    setPreview(null);
    setStage("idle");
  }

  async function handleFile(selected?: File) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setStage("compressing");
    try {
      const blob = await imageCompression(selected, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1200,
        fileType: "image/webp",
        useWebWorker: true,
      });
      const compressed = new File([blob], "receipt.webp", {
        type: "image/webp",
      });
      if (preview) URL.revokeObjectURL(preview);
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
      toast.success(
        `Screenshot compressed to ${Math.round(compressed.size / 1024)} KB`,
      );
    } catch {
      toast.error("Could not process that image. Try another one.");
    } finally {
      setStage("idle");
    }
  }

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(
        (gcash?.number ?? "").replace(/\s/g, ""),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Please type the number manually.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please attach your payment screenshot");
      return;
    }
    const parsedAmount = Number(amount);
    if (!/^\d{13}$/.test(referenceNo.trim())) {
      toast.error("GCash reference number must be 13 digits");
      return;
    }
    if (!(parsedAmount > 0)) {
      toast.error("Enter a valid amount");
      return;
    }

    setStage("uploading");
    const path = `${userId}/${Date.now()}.webp`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: "image/webp" });
    if (uploadError) {
      setStage("idle");
      toast.error(`Upload failed: ${uploadError.message}`);
      return;
    }

    const result = await submitPayment({
      referenceNo: referenceNo.trim(),
      amount: parsedAmount,
      proofUrl: path,
    });
    if ("error" in result) {
      // Don't leave an orphaned receipt behind.
      await supabase.storage.from(BUCKET).remove([path]);
      setStage("idle");
      toast.error(result.error);
      return;
    }

    toast.success("Payment submitted! Awaiting admin verification.");
    reset();
    setOpen(false);
  }

  return (
    <>
      <Button variant={triggerVariant} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (busy) return;
          setOpen(next);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay via GCash</DialogTitle>
            <DialogDescription>
              Send your payment, then upload the screenshot for verification.
            </DialogDescription>
          </DialogHeader>

          {gcash ? (
            <div className="flex flex-col items-center gap-4 rounded-lg border bg-muted/40 p-4 sm:flex-row sm:items-center">
              {gcash.hasQr && (
                // eslint-disable-next-line @next/next/no-img-element -- served by an authenticated route handler
                <img
                  src={`/payments/gcash-qr?v=${encodeURIComponent(gcash.version)}`}
                  alt={`GCash QR code for ${gcash.accountName}`}
                  width={410}
                  height={410}
                  className="size-44 shrink-0 rounded-md bg-white object-contain"
                />
              )}
              <div className="flex min-w-0 flex-col items-center gap-1 text-center sm:items-start sm:text-left">
                <p className="text-xs text-muted-foreground">Send to</p>
                <p className="font-medium text-brand-ink">
                  {gcash.accountName}
                </p>
                <p className="text-xs text-muted-foreground">
                  PICE PCUD {gcash.role}
                </p>
                {gcash.number && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="font-mono text-sm font-medium text-brand-ink">
                      {gcash.number}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={copyNumber}
                      aria-label={
                        copied ? "Number copied" : "Copy GCash number"
                      }
                    >
                      {copied ? <CheckIcon /> : <CopyIcon />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p
              role="status"
              className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900"
            >
              The chapter&apos;s GCash details haven&apos;t been set up yet.
              Please contact a chapter officer before paying.
            </p>
          )}

          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Open GCash and scan the QR code, or send to the number above.
            </li>
            <li>Enter the exact amount and send the payment.</li>
            <li>Screenshot the receipt showing the reference number.</li>
            <li>Fill out the form below and upload the screenshot.</li>
          </ol>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referenceNo">GCash Reference Number</Label>
              <Input
                id="referenceNo"
                inputMode="numeric"
                placeholder="13-digit reference no."
                maxLength={13}
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                disabled={busy}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PHP)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Screenshot</Label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => !busy && inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!busy) inputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  if (!busy) void handleFile(e.dataTransfer.files[0]);
                }}
                className={cn(
                  "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm text-muted-foreground transition-colors",
                  dragging && "border-primary bg-primary/5",
                  busy && "cursor-not-allowed opacity-60",
                )}
              >
                {stage === "compressing" ? (
                  <>
                    <Loader2 className="size-6 animate-spin" />
                    Compressing image…
                  </>
                ) : preview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Payment screenshot preview"
                      className="max-h-40 rounded-md object-contain"
                    />
                    <span>
                      {Math.round((file?.size ?? 0) / 1024)} KB · click or drop
                      to replace
                    </span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-6" />
                    Drag &amp; drop or click to select
                  </>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={busy || !file}>
                {stage === "uploading" && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {stage === "uploading" ? "Uploading…" : "Submit Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
