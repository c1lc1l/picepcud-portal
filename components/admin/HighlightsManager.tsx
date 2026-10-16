"use client";

import { useRef, useState, useTransition } from "react";
import imageCompression from "browser-image-compression";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ImagePlus,
  Loader2,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import {
  createHighlight,
  deleteHighlight,
  moveHighlight,
  toggleHighlightStatus,
  updateHighlight,
} from "@/app/actions/admin-highlights";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { highlightPhotoUrl, type Highlight } from "@/lib/highlights/types";
import { createClient } from "@/lib/supabase/client";

type Editing = { mode: "create" } | { mode: "edit"; highlight: Highlight };

export function HighlightsManager({ highlights }: { highlights: Highlight[] }) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const [toDelete, setToDelete] = useState<Highlight | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startBusy] = useTransition();
  const [deleting, startDeleting] = useTransition();
  // Optimistic overrides until the revalidated data arrives.
  const [active, setActive] = useState<Record<string, boolean>>({});

  function move(highlight: Highlight, direction: "up" | "down") {
    setBusyId(highlight.id);
    startBusy(async () => {
      const result = await moveHighlight(highlight.id, direction);
      setBusyId(null);
      if ("error" in result) toast.error(result.error);
    });
  }

  function toggle(highlight: Highlight, next: boolean) {
    setBusyId(highlight.id);
    startBusy(async () => {
      const result = await toggleHighlightStatus(highlight.id, next);
      setBusyId(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setActive((s) => ({ ...s, [highlight.id]: next }));
      toast.success(next ? "Highlight shown" : "Highlight hidden");
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const highlight = toDelete;
    startDeleting(async () => {
      const result = await deleteHighlight(highlight.id);
      setToDelete(null);
      if ("error" in result) toast.error(result.error);
      else toast.success("Highlight removed");
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Highlights carousel</CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing({ mode: "create" })}
            >
              <PlusIcon />
              Add
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {!highlights.length ? (
            <p className="text-sm text-muted-foreground">
              No highlights yet. Add a past event or social post to feature
              below Upcoming events on the homepage.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {highlights.map((h, i) => {
                const isActive = active[h.id] ?? h.is_active;
                return (
                  <li
                    key={h.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={highlightPhotoUrl(h.image_path)}
                      alt=""
                      className="aspect-square size-12 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-brand-ink">
                        {h.caption}
                      </p>
                      <div className="flex items-center gap-2">
                        {h.link_url && (
                          <p className="truncate text-sm text-muted-foreground">
                            {h.link_url}
                          </p>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            isActive
                              ? "border-0 bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300"
                              : "border-0 bg-muted text-muted-foreground"
                          }
                        >
                          {isActive ? "Shown" : "Hidden"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {busyId === h.id ? (
                        <Loader2 className="mx-2 size-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={i === 0 || busyId !== null}
                            onClick={() => move(h, "up")}
                            aria-label={`Move "${h.caption}" up`}
                          >
                            <ArrowUpIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={
                              i === highlights.length - 1 || busyId !== null
                            }
                            onClick={() => move(h, "down")}
                            aria-label={`Move "${h.caption}" down`}
                          >
                            <ArrowDownIcon />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busyId !== null}
                            onClick={() => toggle(h, !isActive)}
                          >
                            {isActive ? "Hide" : "Show"}
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing({ mode: "edit", highlight: h })}
                        aria-label={`Edit "${h.caption}"`}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setToDelete(h)}
                        aria-label={`Remove "${h.caption}"`}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg">
          {editing && (
            // Remount per highlight so field and photo state reset.
            <HighlightForm
              key={editing.mode === "edit" ? editing.highlight.id : "new"}
              editing={editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && !deleting && setToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove highlight?</DialogTitle>
            <DialogDescription>
              “{toDelete?.caption}” will be removed from the homepage
              carousel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const BUCKET = "highlight-photos";

/** Add/edit form, including the image upload. */
function HighlightForm({
  editing,
  onDone,
}: {
  editing: Editing;
  onDone: () => void;
}) {
  const existing = editing.mode === "edit" ? editing.highlight : null;
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, startSaving] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = saving || processing;

  const shownImage =
    preview ?? (existing ? highlightPhotoUrl(existing.image_path) : null);

  async function pickImage(selected?: File) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setProcessing(true);
    try {
      const blob = await imageCompression(selected, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        fileType: "image/webp",
        useWebWorker: true,
      });
      if (preview) URL.revokeObjectURL(preview);
      setImage(new File([blob], "highlight.webp", { type: "image/webp" }));
      setPreview(URL.createObjectURL(blob));
    } catch {
      toast.error("Could not process that image. Try another one.");
    } finally {
      setProcessing(false);
    }
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!existing && !image) {
      toast.error("Add an image for this highlight");
      return;
    }

    startSaving(async () => {
      const supabase = createClient();
      let path: string | null = null;
      if (image) {
        path = `${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, image, { contentType: "image/webp" });
        if (error) {
          toast.error(`Image upload failed: ${error.message}`);
          return;
        }
        formData.set("imagePath", path);
      }

      const result = existing
        ? await updateHighlight(existing.id, formData)
        : await createHighlight(formData);
      if ("error" in result) {
        // Don't leave an orphaned upload behind.
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        toast.error(result.error);
        return;
      }
      toast.success(existing ? "Highlight updated" : "Highlight added");
      onDone();
    });
  }

  return (
    <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="border-b border-border p-4 pr-12">
        <DialogTitle>
          {existing ? "Edit highlight" : "Add highlight"}
        </DialogTitle>
        <DialogDescription>
          Shown in a carousel below Upcoming events on the homepage.
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="space-y-2">
          <Label>Image</Label>
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
            {processing ? (
              <>
                <Loader2 className="size-6 animate-spin" />
                Compressing image…
              </>
            ) : shownImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shownImage}
                  alt="Highlight preview"
                  className="max-h-32 rounded-md object-contain"
                />
                <span>Click to replace</span>
              </>
            ) : (
              <>
                <ImagePlus className="size-6" />
                Click to select an image
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              void pickImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            name="caption"
            defaultValue={existing?.caption ?? ""}
            maxLength={300}
            rows={2}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkUrl">Link (optional)</Label>
          <Input
            id="linkUrl"
            name="linkUrl"
            type="url"
            defaultValue={existing?.link_url ?? ""}
            placeholder="https://facebook.com/..."
            className="h-9"
          />
          <p className="text-xs text-muted-foreground">
            e.g. the Facebook or Instagram post this highlight came from.
          </p>
        </div>
      </div>

      <DialogFooter className="m-0">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={onDone}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {saving && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
