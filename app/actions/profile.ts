"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/auth";

export type ProfileActionResult = { error: string } | { success: true };

/**
 * Lets a signed-in member correct their own name, student ID and year level.
 * Only their own row is touched (RLS `profiles_update_own` agrees), and the
 * role can't change here: it isn't in the update and a trigger blocks it.
 */
export async function updateOwnProfile(
  formData: FormData,
): Promise<ProfileActionResult> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired. Log in again." };

  const { fullName, studentId, yearLevel } = parsed.data;
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      student_id: studentId,
      year_level: yearLevel,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    // profiles.student_id is unique.
    if (error.code === "23505") {
      return { error: "That student ID is already registered to another account." };
    }
    return { error: error.message };
  }
  if (!data) return { error: "Profile not found." };

  revalidatePath("/dashboard");
  return { success: true };
}
