"use client";

import { useRef, useState, useTransition } from "react";
import imageCompression from "browser-image-compression";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateFeaturedPost } from "@/app/actions/admin-settings";
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
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "site-media";

export type FeaturedPostValues = {
  isVisible: boolean;
  title: string;
  eyebrow: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string;
  linkUrl: string;
  linkLabel: string;
};

export function FeaturedPostForm({ initial }: { initial: FeaturedPostValues }) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, startSaving] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = saving || processing;

  async function pickImage(selected?: File) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setProcessing(true);
    try {
      const blob = await imageCompression(selected, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        fileType: "image/webp",
        useWebWorker: true,
      });
      if (preview) URL.revokeObjectURL(preview);
      setImage(new File([blob], "featured.webp", { type: "image/webp" }));
      setPreview(URL.createObjectURL(blob));
    } catch {
      toast.error("Could not process that image. Try another one.");
    } finally {
      setProcessing(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startSaving(async () => {
      const supabase = createClient();
      let path: string | null = null;
      if (image) {
        path = `featured/${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, image, { contentType: "image/webp" });
        if (error) {
          toast.error(`Image upload failed: ${error.message}`);
          return;
        }
        formData.set(
          "imageUrl",
          supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
        );
      }

      const result = await updateFeaturedPost(formData);
      if ("error" in result) {
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        toast.error(result.error);
        return;
      }
      toast.success("Featured post saved");
      if (preview) URL.revokeObjectURL(preview);
      setImage(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  const shownImage = preview ?? initial.imageUrl;

  return (
    <Card>
      <form onSubmit={handleSubmit} className="contents">
        <CardHeader>
          <CardTitle>Featured post</CardTitle>
          <CardDescription>
            Highlighted on the homepage, right below the hero. Link it to a
            chapter post on Facebook or Instagram.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-2 md:grid-cols-[14rem_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="featuredImage">Image</Label>
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-input bg-muted/40 text-muted-foreground transition-colors hover:border-ring"
            >
              {processing ? (
                <Loader2 className="size-6 animate-spin" />
              ) : shownImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview or public storage URL
                <img
                  src={shownImage}
                  alt={preview ? "New image preview" : "Current image"}
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex flex-col items-center gap-1 text-sm">
                  <ImagePlus className="size-6" />
                  Upload image
                </span>
              )}
            </button>
            <input
              ref={inputRef}
              id="featuredImage"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => pickImage(e.target.files?.[0])}
            />
            <p className="text-xs text-muted-foreground">
              {preview
                ? "New image — saved when you click Save."
                : "Click to replace. Square images work best."}
            </p>
            <Label htmlFor="imageAlt" className="mt-2">
              Image description
            </Label>
            <Input
              id="imageAlt"
              name="imageAlt"
              defaultValue={initial.imageAlt}
              placeholder="For screen readers"
              className="h-9"
            />
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                name="isVisible"
                defaultChecked={initial.isVisible}
                className="size-4 accent-brand-indigo"
              />
              Show on the homepage
            </label>
            <div className="flex flex-col gap-2">
              <Label htmlFor="featuredTitle">Title</Label>
              <Input
                id="featuredTitle"
                name="title"
                defaultValue={initial.title}
                required
                maxLength={120}
                className="h-9"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="eyebrow">Tagline</Label>
              <Input
                id="eyebrow"
                name="eyebrow"
                defaultValue={initial.eyebrow}
                maxLength={120}
                placeholder="Optional"
                className="h-9"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="body">Text</Label>
              <Textarea
                id="body"
                name="body"
                defaultValue={initial.body}
                rows={7}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                Line breaks are kept. Use plain text rather than the fancy
                bold/italic letters from Facebook — screen readers and search
                engines can&apos;t read them.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="linkUrl">Post link</Label>
                <Input
                  id="linkUrl"
                  name="linkUrl"
                  type="url"
                  defaultValue={initial.linkUrl}
                  placeholder="https://www.facebook.com/…"
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="linkLabel">Button text</Label>
                <Input
                  id="linkLabel"
                  name="linkLabel"
                  defaultValue={initial.linkLabel}
                  maxLength={40}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={busy}>
            {saving && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
