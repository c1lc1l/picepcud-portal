"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";

export type EventActionResult = { error: string } | { success: true };

const BANNERS_BUCKET = "event-banners";
const bannerPrefix = () =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BANNERS_BUCKET}/`;

const eventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  // datetime-local value (e.g. 2026-10-05T14:30), entered in Philippine time.
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Enter a valid date and time"),
  location: z.string().trim().min(1, "Location is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5000),
  lumaUrl: z
    .url("Enter a valid Luma URL")
    .refine((u) => /^https?:\/\//i.test(u), "Luma URL must be http(s)"),
  bannerUrl: z.string().optional(),
});

function revalidateEvents() {
  revalidatePath("/admin/events");
  revalidatePath("/admin");
}

export async function createEvent(
  formData: FormData
): Promise<EventActionResult> {
  const { isAdmin } = await getCurrentUser();
  if (!isAdmin) return { error: "Only admins can create events" };

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    eventDate: formData.get("eventDate"),
    location: formData.get("location"),
    description: formData.get("description"),
    lumaUrl: formData.get("lumaUrl"),
    bannerUrl: formData.get("bannerUrl") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { title, eventDate, location, description, lumaUrl, bannerUrl } =
    parsed.data;

  const date = new Date(`${eventDate}:00+08:00`);
  if (Number.isNaN(date.getTime())) return { error: "Invalid event date" };
  if (bannerUrl && !bannerUrl.startsWith(bannerPrefix())) {
    return { error: "Invalid banner URL" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    title,
    description,
    event_date: date.toISOString(),
    location,
    luma_url: lumaUrl,
    banner_url: bannerUrl ?? null,
    is_active: true,
  });
  if (error) return { error: error.message };

  revalidateEvents();
  return { success: true };
}

export async function toggleEventStatus(
  eventId: string,
  isActive: boolean
): Promise<EventActionResult> {
  const { isAdmin } = await getCurrentUser();
  if (!isAdmin) return { error: "Only admins can update events" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .update({ is_active: isActive })
    .eq("id", eventId)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Event not found" };

  revalidateEvents();
  return { success: true };
}

export async function deleteEvent(eventId: string): Promise<EventActionResult> {
  const { isAdmin } = await getCurrentUser();
  if (!isAdmin) return { error: "Only admins can delete events" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .select("banner_url")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Event not found" };

  // Best-effort cleanup of the banner image.
  if (data.banner_url?.startsWith(bannerPrefix())) {
    await supabase.storage
      .from(BANNERS_BUCKET)
      .remove([data.banner_url.slice(bannerPrefix().length)]);
  }

  revalidateEvents();
  return { success: true };
}
