export type Highlight = {
  id: string;
  title: string | null;
  caption: string;
  link_url: string | null;
  image_path: string;
  display_order: number;
  is_active: boolean;
};

export const HIGHLIGHTS_BUCKET = "highlight-photos";

/** Public URL of a highlight image stored in Supabase Storage. */
export function highlightPhotoUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${HIGHLIGHTS_BUCKET}/${path}`;
}
