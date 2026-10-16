"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateGcashSettings } from "@/app/actions/admin-settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "gcash-qr";
const MAX_BYTES = 2 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export type GcashSettingsValues = {
  accountName: string;
  accountRole: string;
  accountNumber: string;
  /** Versioned URL of the saved QR, or null if none uploaded yet. */
  qrUrl: string | null;
  updatedAt: string | null;
};

export function GcashSettingsForm({
  initial,
}: {
  initial: GcashSettingsValues;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(selected?: File) {
    if (!selected) return;
    if (!EXTENSIONS[selected.type]) {
      toast.error("Upload a PNG, JPG or WebP image");
      return;
    }
    if (selected.size > MAX_BYTES) {
      toast.error("QR image must be 2 MB or smaller");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startSaving(async () => {
      const supabase = createClient();
      let path: string | null = null;
      // Uploaded as-is: recompressing a QR can make it unscannable.
      if (file) {
        path = `${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type });
        if (error) {
          toast.error(`QR upload failed: ${error.message}`);
          return;
        }
        formData.set("qrPath", path);
      }

      const result = await updateGcashSettings(formData);
      if ("error" in result) {
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        toast.error(result.error);
        return;
      }
      toast.success("Payment settings saved");
      if (preview) URL.revokeObjectURL(preview);
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  const shownQr = preview ?? initial.qrUrl;

  return (
    <Card>
      <form onSubmit={handleSubmit} className="contents">
        <CardHeader>
          <CardTitle>GCash account</CardTitle>
          <CardDescription>
            Shown to members when they pay their dues. Update this whenever the
            receiving account changes, and upload the matching QR code.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-2 md:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="accountName">Account name</Label>
              <Input
                id="accountName"
                name="accountName"
                defaultValue={initial.accountName}
                placeholder="As shown in GCash"
                required
                className="h-9"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="accountRole">Role</Label>
                <Input
                  id="accountRole"
                  name="accountRole"
                  defaultValue={initial.accountRole}
                  placeholder="Treasurer"
                  required
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="accountNumber">GCash number</Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  inputMode="tel"
                  defaultValue={initial.accountNumber}
                  placeholder="0917 123 4567"
                  required
                  className="h-9 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="qr">QR code</Label>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-input bg-muted/40 text-muted-foreground transition-colors hover:border-ring"
            >
              {shownQr ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview or authenticated route
                <img
                  src={shownQr}
                  alt={preview ? "New QR code preview" : "Current QR code"}
                  className="size-full bg-white object-contain"
                />
              ) : (
                <span className="flex flex-col items-center gap-1 text-sm">
                  <ImagePlus className="size-6" />
                  Upload QR
                </span>
              )}
            </button>
            <input
              ref={inputRef}
              id="qr"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <p className="text-xs text-muted-foreground">
              {preview
                ? "New QR — saved when you click Save."
                : "Click to replace. PNG, JPG or WebP, up to 2 MB."}
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {initial.updatedAt
              ? `Last updated ${initial.updatedAt}`
              : "Not set up yet"}
          </p>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
