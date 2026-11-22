"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleFollowAction(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to follow authors." };
  }

  if (user.id === targetUserId) {
    return { success: false, error: "You cannot follow yourself." };
  }

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followed_id", targetUserId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followed_id", targetUserId);

    revalidatePath("/profile/[username]", "page");
    return { success: true, following: false };
  } else {
    await supabase.from("follows").insert({
      follower_id: user.id,
      followed_id: targetUserId,
    });

    // Notify user
    await supabase.from("notifications").insert({
      recipient_id: targetUserId,
      actor_id: user.id,
      type: "new_follower",
      target_type: "profile",
      target_id: user.id,
    });

    revalidatePath("/profile/[username]", "page");
    return { success: true, following: true };
  }
}

export async function submitReportAction(
  targetType: "story" | "contribution" | "comment" | "profile",
  targetId: string,
  reason: string,
  description?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to submit a moderation report." };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    description: description || null,
    status: "pending",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: "Report submitted to moderation queue." };
}
