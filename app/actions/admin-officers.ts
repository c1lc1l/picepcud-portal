"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  MAX_OFFICER_LINKS,
  OFFICER_PHOTOS_BUCKET,
  type OfficerGroup,
} from "@/lib/officers/types";
import { createClient } from "@/lib/supabase/server";

export type OfficerActionResult = { error: string } | { success: true };

const officerSchema = z
  .object({
    displayName: z.string().trim().min(2, "Enter the officer's name").max(120),
    title: z.string().trim().min(2, "Enter the position").max(120),
    group: z.enum(["executive", "committee"], "Choose a group"),
    // Freshly uploaded object name, e.g. "<uuid>.webp".
    photoPath: z
      .string()
      .regex(/^[0-9a-f-]{36}\.webp$/, "Invalid photo upload")
      .optional(),
    photoConsent: z.literal("on").optional(),
    removePhoto: z.literal("on").optional(),
    motto: z
      .string()
      .trim()
      .max(200, "Keep the motto under 200 characters")
      .optional(),
    contactEmail: z
      .union([z.literal(""), z.email("Enter a valid contact email").max(254)])
      .optional(),
    // JSON-encoded [{ label, url }] from the form's link rows.
    links: z
      .string()
      .optional()
      .transform((value, ctx) => {
        if (!value) return [];
        try {
          return JSON.parse(value) as unknown;
        } catch {
          ctx.addIssue({ code: "custom", message: "Invalid links" });
          return z.NEVER;
        }
      })
      .pipe(
        z
          .array(
            z.object({
              label: z
                .string()
                .trim()
                .min(1, "Each link needs a label")
                .max(40),
              url: z
                .url("Enter a valid link URL")
                .refine(
                  (u) => u.startsWith("https://"),
                  "Links must start with https://",
                ),
            }),
          )
          .max(MAX_OFFICER_LINKS, `Add up to ${MAX_OFFICER_LINKS} links`),
      ),
  })
  .refine((v) => !v.photoPath || v.photoConsent, {
    message: "Confirm the officer agreed to have this photo published",
  });

const termSchema = z.object({
  termLabel: z.string().trim().min(1, "Enter a term name").max(60),
  termStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a start date"),
  termEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter an end date"),
});

/** Optional public profile fields, normalised for the database. */
function profileFields(data: z.infer<typeof officerSchema>) {
  return {
    motto: data.motto || null,
    contact_email: data.contactEmail?.trim().toLowerCase() || null,
    links: data.links,
  };
}

async function requireAdmin() {
  const { user, isAdmin } = await getCurrentUser();
  return user && isAdmin ? user : null;
}

function revalidateOfficers() {
  revalidatePath("/admin/officers");
  // Public nav shows the Officers link only while the roster is live.
  revalidatePath("/", "layout");
}

async function nextOrder(group: OfficerGroup) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("officers")
    .select("display_order")
    .eq("officer_group", group)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.display_order ?? 0) + 1;
}

/** Best-effort removal of a replaced or orphaned portrait. */
async function removePhoto(path: string | null | undefined) {
  if (!path) return;
  const supabase = await createClient();
  await supabase.storage.from(OFFICER_PHOTOS_BUCKET).remove([path]);
}

export async function createOfficer(
  formData: FormData,
): Promise<OfficerActionResult> {
  if (!(await requireAdmin())) return { error: "Only admins can add officers" };

  const parsed = officerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { displayName, title, group, photoPath } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("officers").insert({
    display_name: displayName,
    title,
    officer_group: group,
    display_order: await nextOrder(group),
    ...profileFields(parsed.data),
    ...(photoPath
      ? { photo_path: photoPath, photo_consent_at: new Date().toISOString() }
      : {}),
  });
  if (error) return { error: error.message };

  revalidateOfficers();
  return { success: true };
}

export async function updateOfficer(
  id: string,
  formData: FormData,
): Promise<OfficerActionResult> {
  if (!(await requireAdmin()))
    return { error: "Only admins can edit officers" };

  const parsed = officerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const {
    displayName,
    title,
    group,
    photoPath,
    removePhoto: remove,
  } = parsed.data;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("officers")
    .select("officer_group, photo_path")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { error: "Officer not found" };

  const photoChange = photoPath
    ? { photo_path: photoPath, photo_consent_at: new Date().toISOString() }
    : remove
      ? { photo_path: null, photo_consent_at: null }
      : {};

  const { error } = await supabase
    .from("officers")
    .update({
      display_name: displayName,
      title,
      officer_group: group,
      // Moving to another group puts the officer at the end of it.
      ...(current.officer_group !== group
        ? { display_order: await nextOrder(group) }
        : {}),
      ...profileFields(parsed.data),
      ...photoChange,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  if ((photoPath || remove) && current.photo_path !== photoPath) {
    await removePhoto(current.photo_path);
  }

  revalidateOfficers();
  return { success: true };
}

export async function deleteOfficer(id: string): Promise<OfficerActionResult> {
  if (!(await requireAdmin()))
    return { error: "Only admins can remove officers" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("officers")
    .delete()
    .eq("id", id)
    .select("photo_path")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Officer not found" };

  await removePhoto(data.photo_path);

  revalidateOfficers();
  return { success: true };
}

/** Swap an officer with its neighbour, renumbering the group 1..n. */
export async function moveOfficer(
  id: string,
  direction: "up" | "down",
): Promise<OfficerActionResult> {
  if (!(await requireAdmin()))
    return { error: "Only admins can reorder officers" };

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("officers")
    .select("officer_group")
    .eq("id", id)
    .maybeSingle();
  if (!target) return { error: "Officer not found" };

  const { data: group, error } = await supabase
    .from("officers")
    .select("id, display_order")
    .eq("officer_group", target.officer_group)
    .order("display_order")
    .order("id");
  if (error || !group) return { error: error?.message ?? "Could not reorder" };

  const index = group.findIndex((o) => o.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= group.length) return { success: true };
  [group[index], group[swapWith]] = [group[swapWith], group[index]];

  for (const [i, officer] of group.entries()) {
    if (officer.display_order === i + 1) continue;
    const { error: updateError } = await supabase
      .from("officers")
      .update({ display_order: i + 1 })
      .eq("id", officer.id);
    if (updateError) return { error: updateError.message };
  }

  revalidateOfficers();
  return { success: true };
}

export async function updateRosterTerm(
  formData: FormData,
): Promise<OfficerActionResult> {
  if (!(await requireAdmin()))
    return { error: "Only admins can change the term" };

  const parsed = termSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { termLabel, termStart, termEnd } = parsed.data;

  // Whole days in Philippine time, inclusive of the end date.
  const start = new Date(`${termStart}T00:00:00+08:00`);
  const end = new Date(`${termEnd}T23:59:59+08:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Enter valid dates" };
  }
  if (start >= end) return { error: "The term must end after it starts" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("officer_roster")
    .update({
      term_label: termLabel,
      term_start: start.toISOString(),
      term_end: end.toISOString(),
    })
    .eq("id", true);
  if (error) return { error: error.message };

  revalidateOfficers();
  return { success: true };
}

export async function setRosterPublished(
  published: boolean,
): Promise<OfficerActionResult> {
  const user = await requireAdmin();
  if (!user) return { error: "Only admins can publish the roster" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("officer_roster")
    .update(
      published
        ? {
            is_published: true,
            published_at: new Date().toISOString(),
            published_by: user.id,
          }
        : { is_published: false },
    )
    .eq("id", true);
  if (error) {
    // officer_roster_publishable check constraint.
    return {
      error: error.message.includes("officer_roster_publishable")
        ? "Set a term name and valid dates before publishing"
        : error.message,
    };
  }

  revalidateOfficers();
  return { success: true };
}
