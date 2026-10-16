"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { HIGHLIGHTS_BUCKET } from "@/lib/highlights/types";
import { createClient } from "@/lib/supabase/server";

export type HighlightActionResult = { error: string } | { success: true };

const highlightSchema = z.object({
  title: z.string().trim().max(120, "Keep the title under 120 characters").optional(),
  caption: z.string().trim().min(1, "Caption is required").max(300),
  linkUrl: z
    .union([
      z.literal(""),
      z
        .url("Enter a valid link URL")
        .refine((u) => u.startsWith("https://"), "Links must start with https://"),
    ])
    .optional(),
  // Freshly uploaded object name, e.g. "<uuid>.webp".
  imagePath: z
    .string()
    .regex(/^[0-9a-f-]{36}\.webp$/, "Invalid photo upload")
    .optional(),
});

async function requireAdmin() {
  const { user, isAdmin } = await getCurrentUser();
  return user && isAdmin ? user : null;
}

function revalidateHighlights() {
  revalidatePath("/admin/highlights");
  revalidatePath("/", "layout");
}

async function nextOrder() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("highlights")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.display_order ?? 0) + 1;
}

/** Best-effort removal of a replaced or orphaned highlight image. */
async function removeImage(path: string | null | undefined) {
  if (!path) return;
  const supabase = await createClient();
  await supabase.storage.from(HIGHLIGHTS_BUCKET).remove([path]);
}

export async function createHighlight(
  formData: FormData,
): Promise<HighlightActionResult> {
  if (!(await requireAdmin()))
    return { error: "Only admins can add posts" };

  const parsed = highlightSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { title, caption, linkUrl, imagePath } = parsed.data;
  if (!imagePath) return { error: "Add an image for this post" };

  const supabase = await createClient();
  const { error } = await supabase.from("highlights").insert({
    title: title || null,
    caption,
    link_url: linkUrl || null,
    image_path: imagePath,
    display_order: await nextOrder(),
    is_active: true,
  });
  if (error) return { error: error.message };

  revalidateHighlights();
  return { success: true };
}

export async function updateHighlight(
  id: string,
  formData: FormData,
): Promise<HighlightActionResult> {
  if (!(await requireAdmin()))
    return { error: "Only admins can edit posts" };

  const parsed = highlightSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { title, caption, linkUrl, imagePath } = parsed.data;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("highlights")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { error: "Post not found" };

  const { error } = await supabase
    .from("highlights")
    .update({
      title: title || null,
      caption,
      link_url: linkUrl || null,
      ...(imagePath ? { image_path: imagePath } : {}),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  if (imagePath && current.image_path !== imagePath) {
    await removeImage(current.image_path);
  }

  revalidateHighlights();
  return { success: true };
}

export async function toggleHighlightStatus(
  id: string,
  isActive: boolean,
): Promise<HighlightActionResult> {
  if (!(await requireAdmin()))
    return { error: "Only admins can update posts" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("highlights")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Post not found" };

  revalidateHighlights();
  return { success: true };
}

export async function deleteHighlight(
  id: string,
): Promise<HighlightActionResult> {
  if (!(await requireAdmin()))
    return { error: "Only admins can delete posts" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("highlights")
    .delete()
    .eq("id", id)
    .select("image_path")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Post not found" };

  await removeImage(data.image_path);

  revalidateHighlights();
  return { success: true };
}

/** Swap a highlight with its neighbour, renumbering the list 1..n. */
export async function moveHighlight(
  id: string,
  direction: "up" | "down",
): Promise<HighlightActionResult> {
  if (!(await requireAdmin()))
    return { error: "Only admins can reorder posts" };

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("highlights")
    .select("id, display_order")
    .order("display_order")
    .order("id");
  if (error || !rows) return { error: error?.message ?? "Could not reorder" };

  const index = rows.findIndex((h) => h.id === id);
  if (index === -1) return { error: "Post not found" };
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= rows.length) return { success: true };
  [rows[index], rows[swapWith]] = [rows[swapWith], rows[index]];

  for (const [i, row] of rows.entries()) {
    if (row.display_order === i + 1) continue;
    const { error: updateError } = await supabase
      .from("highlights")
      .update({ display_order: i + 1 })
      .eq("id", row.id);
    if (updateError) return { error: updateError.message };
  }

  revalidateHighlights();
  return { success: true };
}
