"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { SITE_MEDIA_BUCKET, siteMediaPrefix } from "@/lib/featured";
import { GCASH_QR_BUCKET } from "@/lib/payments/gcash";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionResult = { error: string } | { success: true };

/** Accepts 09XXXXXXXXX or +639XXXXXXXXX, ignoring spaces and dashes. */
function normalizeMobile(value: string) {
  const digits = value.replace(/[\s-]/g, "");
  const local = digits.startsWith("+63") ? `0${digits.slice(3)}` : digits;
  return /^09\d{9}$/.test(local)
    ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
    : null;
}

const gcashSchema = z.object({
  accountName: z.string().trim().min(2, "Enter the account name").max(120),
  accountRole: z
    .string()
    .trim()
    .min(1, "Enter the account holder's role")
    .max(60),
  accountNumber: z.string().transform((v, ctx) => {
    const formatted = normalizeMobile(v);
    if (!formatted) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid mobile number, e.g. 0917 123 4567",
      });
      return z.NEVER;
    }
    return formatted;
  }),
  // Freshly uploaded object name, e.g. "<uuid>.png".
  qrPath: z
    .string()
    .regex(/^[0-9a-f-]{36}\.(png|jpe?g|webp)$/, "Invalid QR upload")
    .optional(),
});

export async function updateGcashSettings(
  formData: FormData,
): Promise<SettingsActionResult> {
  const { user, isAdmin } = await getCurrentUser();
  if (!user || !isAdmin)
    return { error: "Only admins can change payment settings" };

  const parsed = gcashSchema.safeParse({
    accountName: formData.get("accountName"),
    accountRole: formData.get("accountRole"),
    accountNumber: formData.get("accountNumber"),
    qrPath: formData.get("qrPath") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { accountName, accountRole, accountNumber, qrPath } = parsed.data;

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("gcash_settings")
    .select("qr_path")
    .maybeSingle();

  const { data, error } = await supabase
    .from("gcash_settings")
    .update({
      account_name: accountName,
      account_role: accountRole,
      account_number: accountNumber,
      ...(qrPath ? { qr_path: qrPath } : {}),
      updated_by: user.id,
    })
    .eq("id", true)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data)
    return { error: "Payment settings not found. Run the latest migration." };

  // Best-effort cleanup of the replaced QR image.
  if (qrPath && previous?.qr_path && previous.qr_path !== qrPath) {
    await supabase.storage.from(GCASH_QR_BUCKET).remove([previous.qr_path]);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

const featuredSchema = z.object({
  isVisible: z.literal("on").optional(),
  title: z.string().trim().min(1, "Enter a title").max(120),
  eyebrow: z.string().trim().max(120).optional(),
  body: z.string().trim().max(2000, "Keep the text under 2,000 characters"),
  linkUrl: z
    .union([
      z.literal(""),
      z
        .url("Enter a valid post link")
        .refine(
          (u) => u.startsWith("https://"),
          "Link must start with https://",
        ),
    ])
    .optional(),
  linkLabel: z.string().trim().max(40).optional(),
  imageAlt: z.string().trim().max(200).optional(),
  // Public URL of a freshly uploaded image in the site-media bucket.
  imageUrl: z.string().optional(),
});

export async function updateFeaturedPost(
  formData: FormData,
): Promise<SettingsActionResult> {
  const { user, isAdmin } = await getCurrentUser();
  if (!user || !isAdmin) {
    return { error: "Only admins can change the featured post" };
  }

  const parsed = featuredSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const prefix = siteMediaPrefix();
  if (data.imageUrl && !data.imageUrl.startsWith(prefix)) {
    return { error: "Invalid image upload" };
  }

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("featured_post")
    .select("image_url")
    .maybeSingle();

  const { data: saved, error } = await supabase
    .from("featured_post")
    .update({
      is_visible: data.isVisible === "on",
      title: data.title,
      eyebrow: data.eyebrow ?? "",
      body: data.body,
      link_url: data.linkUrl || null,
      link_label: data.linkLabel || "View post",
      image_alt: data.imageAlt ?? "",
      ...(data.imageUrl ? { image_url: data.imageUrl } : {}),
      updated_by: user.id,
    })
    .eq("id", true)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!saved) {
    return { error: "Featured post not found. Run the latest migration." };
  }

  // Best-effort cleanup of a replaced upload (bundled defaults are kept).
  const old = previous?.image_url;
  if (data.imageUrl && old?.startsWith(prefix) && old !== data.imageUrl) {
    await supabase.storage
      .from(SITE_MEDIA_BUCKET)
      .remove([old.slice(prefix.length)]);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { success: true };
}
