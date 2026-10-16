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
  createOfficer,
  deleteOfficer,
  moveOfficer,
  updateOfficer,
} from "@/app/actions/admin-officers";
import { OfficerPortrait } from "@/components/officers/OfficerPortrait";
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
import {
  MAX_OFFICER_LINKS,
  OFFICER_GROUPS,
  OFFICER_PHOTOS_BUCKET,
  officerPhotoUrl,
  type Officer,
  type OfficerGroup,
  type OfficerLink,
} from "@/lib/officers/types";
import { createClient } from "@/lib/supabase/client";

type Editing =
  { mode: "create"; group: OfficerGroup } | { mode: "edit"; officer: Officer };

export function OfficersManager({ officers }: { officers: Officer[] }) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const [toDelete, setToDelete] = useState<Officer | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startMoving] = useTransition();
  const [deleting, startDeleting] = useTransition();

  function move(officer: Officer, direction: "up" | "down") {
    setBusyId(officer.id);
    startMoving(async () => {
      const result = await moveOfficer(officer.id, direction);
      setBusyId(null);
      if ("error" in result) toast.error(result.error);
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const officer = toDelete;
    startDeleting(async () => {
      const result = await deleteOfficer(officer.id);
      setToDelete(null);
      if ("error" in result) toast.error(result.error);
      else toast.success("Officer removed");
    });
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {OFFICER_GROUPS.map(({ key, label }) => {
          const members = officers.filter((o) => o.officer_group === key);
          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle>{label}</CardTitle>
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing({ mode: "create", group: key })}
                  >
                    <PlusIcon />
                    Add
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {!members.length ? (
                  <p className="text-sm text-muted-foreground">
                    No one here yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {members.map((o, i) => (
                      <li
                        key={o.id}
                        className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <OfficerPortrait
                          name={o.display_name}
                          photoUrl={officerPhotoUrl(o.photo_path)}
                          className="size-10 shrink-0 rounded-md"
                          initialsClassName="text-base"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-brand-ink">
                            {o.display_name}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {o.title}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          {busyId === o.id ? (
                            <Loader2 className="mx-2 size-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={i === 0 || busyId !== null}
                                onClick={() => move(o, "up")}
                                aria-label={`Move ${o.display_name} up`}
                              >
                                <ArrowUpIcon />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={
                                  i === members.length - 1 || busyId !== null
                                }
                                onClick={() => move(o, "down")}
                                aria-label={`Move ${o.display_name} down`}
                              >
                                <ArrowDownIcon />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setEditing({ mode: "edit", officer: o })
                            }
                            aria-label={`Edit ${o.display_name}`}
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setToDelete(o)}
                            aria-label={`Remove ${o.display_name}`}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-xl">
          {editing && (
            // Remount per officer so field and photo state reset.
            <OfficerForm
              key={editing.mode === "edit" ? editing.officer.id : "new"}
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
            <DialogTitle>Remove officer?</DialogTitle>
            <DialogDescription>
              {toDelete?.display_name} ({toDelete?.title}) will be removed from
              the roster.
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

/** Add/edit form, including the optional portrait upload. */
function OfficerForm({
  editing,
  onDone,
}: {
  editing: Editing;
  onDone: () => void;
}) {
  const existing = editing.mode === "edit" ? editing.officer : null;
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, startSaving] = useTransition();
  const [links, setLinks] = useState<OfficerLink[]>(existing?.links ?? []);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = saving || processing;

  function updateLink(index: number, field: keyof OfficerLink, value: string) {
    setLinks((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  const name = existing?.display_name ?? "";
  const shownPhoto =
    preview ??
    (removeExisting ? null : officerPhotoUrl(existing?.photo_path ?? null));

  async function pickPhoto(selected?: File) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setProcessing(true);
    try {
      const blob = await imageCompression(selected, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1000,
        fileType: "image/webp",
        useWebWorker: true,
      });
      if (preview) URL.revokeObjectURL(preview);
      setPhoto(new File([blob], "portrait.webp", { type: "image/webp" }));
      setPreview(URL.createObjectURL(blob));
      setRemoveExisting(false);
    } catch {
      toast.error("Could not process that image. Try another one.");
    } finally {
      setProcessing(false);
    }
  }

  function clearPhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    if (existing?.photo_path) setRemoveExisting(true);
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (photo && formData.get("photoConsent") !== "on") {
      toast.error("Confirm the officer agreed to have this photo published");
      return;
    }

    startSaving(async () => {
      const supabase = createClient();
      let path: string | null = null;
      if (photo) {
        path = `${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from(OFFICER_PHOTOS_BUCKET)
          .upload(path, photo, { contentType: "image/webp" });
        if (error) {
          toast.error(`Photo upload failed: ${error.message}`);
          return;
        }
        formData.set("photoPath", path);
      }
      if (removeExisting) formData.set("removePhoto", "on");
      // Blank rows are dropped; the server validates the rest.
      formData.set(
        "links",
        JSON.stringify(
          links
            .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
            .filter((l) => l.label || l.url),
        ),
      );

      const result = existing
        ? await updateOfficer(existing.id, formData)
        : await createOfficer(formData);
      if ("error" in result) {
        // Don't leave an orphaned upload behind.
        if (path) {
          await supabase.storage.from(OFFICER_PHOTOS_BUCKET).remove([path]);
        }
        toast.error(result.error);
        return;
      }
      toast.success(existing ? "Officer updated" : "Officer added");
      onDone();
    });
  }

  return (
    <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="border-b border-border p-4 pr-12">
        <DialogTitle>{existing ? "Edit officer" : "Add officer"}</DialogTitle>
        <DialogDescription>
          The name, position and photo are shown publicly once the roster is
          published.
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-start gap-4">
          <OfficerPortrait
            name={name || "New officer"}
            photoUrl={shownPhoto}
            className="aspect-[4/5] w-24 shrink-0 rounded-lg"
            initialsClassName="text-3xl"
          />
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-sm font-medium">Photo</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                {processing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ImagePlus />
                )}
                {shownPhoto ? "Replace" : "Upload"}
              </Button>
              {shownPhoto && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={clearPhoto}
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Portrait photos work best (shown in a 4:5 frame). Without a photo,
              the officer&apos;s initials are shown.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </div>
        </div>

        {photo && (
          <label className="flex items-start gap-2.5 rounded-md bg-muted/60 p-3 text-sm">
            <input
              type="checkbox"
              name="photoConsent"
              required
              className="mt-0.5 size-4 accent-brand-indigo"
            />
            <span>
              {name || "This officer"} agreed to have this photo published on
              the chapter website.
            </span>
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">Full name</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={name}
              required
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Position</Label>
            <Input
              id="title"
              name="title"
              defaultValue={existing?.title ?? ""}
              placeholder="e.g. Treasurer"
              required
              className="h-9"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="group">Group</Label>
          <select
            id="group"
            name="group"
            defaultValue={
              existing?.officer_group ??
              (editing.mode === "create" ? editing.group : "executive")
            }
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-base outline-none md:text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {OFFICER_GROUPS.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="flex flex-col gap-4 border-t border-border pt-4">
          <legend className="sr-only">Profile</legend>
          <p className="text-sm text-muted-foreground">
            Profile details appear when someone opens this officer&apos;s card.
            Only add contact details the officer agreed to share — never a home
            address or personal phone number.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="motto">Motto</Label>
            <Textarea
              id="motto"
              name="motto"
              defaultValue={existing?.motto ?? ""}
              maxLength={200}
              rows={2}
              placeholder="Optional"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={existing?.contact_email ?? ""}
              placeholder="e.g. name@pcu.edu.ph"
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Links</p>
            {links.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={link.label}
                  onChange={(e) => updateLink(i, "label", e.target.value)}
                  placeholder="Label, e.g. LinkedIn"
                  aria-label={`Link ${i + 1} label`}
                  maxLength={40}
                  className="h-9 w-36 shrink-0"
                />
                <Input
                  value={link.url}
                  onChange={(e) => updateLink(i, "url", e.target.value)}
                  placeholder="https://"
                  aria-label={`Link ${i + 1} URL`}
                  inputMode="url"
                  className="h-9 min-w-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    setLinks((rows) => rows.filter((_, j) => j !== i))
                  }
                  aria-label={`Remove link ${i + 1}`}
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
            {links.length < MAX_OFFICER_LINKS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  setLinks((rows) => [...rows, { label: "", url: "" }])
                }
              >
                <PlusIcon />
                Add link
              </Button>
            )}
          </div>
        </fieldset>
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
