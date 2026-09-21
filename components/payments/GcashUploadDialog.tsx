"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { ImagePlus, Loader2, QrCode } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const BUCKET = "gcash-receipts";

type Stage = "idle" | "compressing" | "uploading";

export function GcashUploadDialog({
  userId,
  triggerLabel = "Pay via GCash",
}: {
  userId: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
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
        `Screenshot compressed to ${Math.round(compressed.size / 1024)} KB`
      );
    } catch {
      toast.error("Could not process that image. Try another one.");
    } finally {
      setStage("idle");
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
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
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

          <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/40 p-4">
            {/* TODO: replace with the official PICE PCUD GCash QR image */}
            <div className="flex size-40 items-center justify-center rounded-md border-2 border-dashed bg-background text-muted-foreground">
              <QrCode className="size-16" aria-label="GCash QR placeholder" />
            </div>
            <p className="text-sm font-medium">PICE PCUD — GCash</p>
          </div>

          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Open GCash and scan the QR code above.</li>
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
                  busy && "cursor-not-allowed opacity-60"
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
