"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const updateProfileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
  bio: z.string().max(300, "Bio must be at most 300 characters").optional(),
  preferredLanguage: z.enum(["en", "fr", "ar"]).default("en"),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

/**
 * Ensures an authenticated user has an active profile row in `public.profiles`.
 * If missing (e.g. from earlier signups before triggers were set), self-heals idempotently.
 */
export async function ensureUserProfile() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  // 1. Check existing profile
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { success: true, profile: existing };
  }

  // 2. Generate safe username from metadata or email
  const meta = user.user_metadata || {};
  let candidateUsername = meta.username || meta.user_name || "";

  if (!candidateUsername && user.email) {
    candidateUsername = user.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
  }

  if (candidateUsername.length < 3) {
    candidateUsername = `writer_${user.id.slice(0, 6)}`;
  }

  // Sanitize
  candidateUsername = candidateUsername.slice(0, 24);

  // Check uniqueness
  const { data: collision } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", candidateUsername)
    .neq("id", user.id)
    .maybeSingle();

  if (collision) {
    candidateUsername = `${candidateUsername.slice(0, 18)}_${user.id.slice(0, 5)}`;
  }

  const displayName = meta.display_name || meta.full_name || candidateUsername;
  const preferredLanguage = meta.preferred_language || "en";

  const newProfile = {
    id: user.id,
    username: candidateUsername,
    display_name: displayName,
    preferred_language: preferredLanguage,
    role: "user" as const,
    privacy_settings: { show_reading_activity: true, allow_email_notifications: true },
  };

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert(newProfile)
    .select()
    .single();

  if (insertError) {
    // If concurrent insert happened, return existing
    const { data: fallback } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (fallback) return { success: true, profile: fallback };
    return { success: false, error: insertError.message };
  }

  // Ensure gamification row
  try {
    await supabase.from("user_gamification").insert({
      user_id: user.id,
      lifetime_xp: 0,
      current_level: 1,
      creative_path: "storyteller",
      calculated_archetype: "Emerging Scribe",
    });
  } catch {
    // Already exists
  }

  return { success: true, profile: inserted };
}

/**
 * Updates the current authenticated user's profile information
 */
export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to update your profile." };
  }

  const validated = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio") || "",
    preferredLanguage: formData.get("preferredLanguage") || "en",
    avatarUrl: formData.get("avatarUrl") || "",
  });

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid profile data.",
    };
  }

  const { displayName, bio, preferredLanguage, avatarUrl } = validated.data;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio: bio || null,
      preferred_language: preferredLanguage,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath(`/profile/me`);
  return { success: true, message: "Profile updated successfully." };
}
