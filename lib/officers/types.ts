export type OfficerGroup = "executive" | "committee";

/** Public display fields only — never contact details or account data. */
export type Officer = {
  id: string;
  display_name: string;
  title: string;
  officer_group: OfficerGroup;
  display_order: number;
  /** Object name in the public `officer-photos` bucket, if any. */
  photo_path: string | null;
  motto: string | null;
  /** Public contact address the officer agreed to share. */
  contact_email: string | null;
  links: OfficerLink[];
};

export type OfficerLink = { label: string; url: string };

export const MAX_OFFICER_LINKS = 5;

export type RosterSettings = {
  term_label: string;
  term_start: string | null;
  term_end: string | null;
  is_published: boolean;
  published_at: string | null;
};

export const OFFICER_GROUPS: { key: OfficerGroup; label: string }[] = [
  { key: "executive", label: "Executive board" },
  { key: "committee", label: "Committee heads" },
];

export const OFFICER_PHOTOS_BUCKET = "officer-photos";

/** Public URL of an officer portrait stored in Supabase Storage. */
export function officerPhotoUrl(path: string | null) {
  return path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${OFFICER_PHOTOS_BUCKET}/${path}`
    : null;
}
