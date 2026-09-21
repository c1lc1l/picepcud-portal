"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { ImagePlus, Loader2, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { createEvent } from "@/app/actions/admin-events";
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
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "event-banners";

type Stage = "idle" | "compressing" | "saving";

export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = stage !== "idle";

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setBanner(null);
    setPreview(null);
    setStage("idle");
    formRef.current?.reset();
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
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        fileType: "image/webp",
        useWebWorker: true,
      });
      const compressed = new File([blob], "banner.webp", { type: "image/webp" });
      if (preview) URL.revokeObjectURL(preview);
      setBanner(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      toast.error("Could not process that image. Try another one.");
    } finally {
      setStage("idle");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setStage("saving");

    const supabase = createClient();
    let path: string | null = null;
    if (banner) {
      path = `${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, banner, { contentType: "image/webp" });
      if (uploadError) {
        setStage("idle");
        toast.error(`Banner upload failed: ${uploadError.message}`);
        return;
      }
      formData.set(
        "bannerUrl",
        supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      );
    }

    const result = await createEvent(formData);
    if ("error" in result) {
      // Don't leave an orphaned banner behind.
      if (path) await supabase.storage.from(BUCKET).remove([path]);
      setStage("idle");
      toast.error(result.error);
      return;
    }

    toast.success("Event created");
    reset();
    setOpen(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Add Event
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (busy) return;
          setOpen(next);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
            <DialogDescription>
              Create a chapter event linked to its Luma registration page.
            </DialogDescription>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" maxLength={200} disabled={busy} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Date &amp; Time (Philippine time)</Label>
              <Input
                id="eventDate"
                name="eventDate"
                type="datetime-local"
                disabled={busy}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" maxLength={200} disabled={busy} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                maxLength={5000}
                disabled={busy}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lumaUrl">Luma Registration URL</Label>
              <Input
                id="lumaUrl"
                name="lumaUrl"
                type="url"
                placeholder="https://lu.ma/..."
                disabled={busy}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Banner (optional)</Label>
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
                className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm text-muted-foreground"
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
                      alt="Banner preview"
                      className="max-h-32 rounded-md object-contain"
                    />
                    <span>Click to replace</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-6" />
                    Click to select a banner image
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
              <Button type="submit" disabled={busy}>
                {stage === "saving" && <Loader2 className="size-4 animate-spin" />}
                {stage === "saving" ? "Saving…" : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
