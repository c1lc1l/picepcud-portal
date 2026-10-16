import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const SITE_MEDIA_BUCKET = "site-media";

export type FeaturedPost = {
  is_visible: boolean;
  eyebrow: string;
  title: string;
  body: string;
  image_url: string | null;
  image_alt: string;
  link_url: string | null;
  link_label: string;
  updated_at: string;
};

const FEATURED_FIELDS =
  "is_visible, eyebrow, title, body, image_url, image_alt, link_url, link_label, updated_at";

/** Public URL prefix for admin-uploaded site imagery. */
export const siteMediaPrefix = () =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${SITE_MEDIA_BUCKET}/`;

/**
 * The featured post row. RLS returns it to the public only while visible
 * (admins always see it, for editing).
 */
export const getFeaturedPost = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("featured_post")
    .select(FEATURED_FIELDS)
    .maybeSingle();
  return { post: (data as FeaturedPost | null) ?? null, error };
});
