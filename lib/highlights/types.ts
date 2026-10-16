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

// A hashtag needs at least one letter, so "#1" in "we placed #1" isn't one.
const HASHTAG_SOURCE = String.raw`#[\p{N}_]*\p{L}[\p{L}\p{N}_]*`;
const TRAILING_HASHTAGS = new RegExp(
  String.raw`(?:\s*${HASHTAG_SOURCE})+\s*$`,
  "u",
);

/** Splits a caption into body text and its trailing block of hashtags (the
 * way Facebook posts usually end), so the tags can render as chips. Hashtags
 * mid-sentence stay in the body. */
export function splitHashtags(caption: string) {
  const match = TRAILING_HASHTAGS.exec(caption);
  if (!match) return { body: caption, tags: [] as string[] };
  const tags = match[0].match(new RegExp(HASHTAG_SOURCE, "gu")) ?? [];
  return {
    body: caption.slice(0, match.index).trimEnd(),
    tags: [...new Set(tags)],
  };
}

/** Splits text into alternating plain/hashtag parts (odd indices are tags). */
export function splitInlineHashtags(text: string) {
  return text.split(new RegExp(`(${HASHTAG_SOURCE})`, "u"));
}

/** Public URL of a highlight image stored in Supabase Storage. */
export function highlightPhotoUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${HIGHLIGHTS_BUCKET}/${path}`;
}
