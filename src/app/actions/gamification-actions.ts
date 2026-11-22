"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreativePathType } from "@/types/database";

export async function awardXPInternal(
  userId: string,
  activityType: string,
  amount: number,
  eventId: string,
  metadata: Record<string, any> = {}
) {
  const adminClient = createAdminClient();

  try {
    const { data, error } = await adminClient.rpc("award_xp", {
      p_user_id: userId,
      p_activity_type: activityType,
      p_amount: amount,
      p_event_id: eventId,
      p_metadata: metadata,
    });

    if (error) {
      console.error("XP award RPC error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("XP award exception:", err);
    return { success: false, error: err?.message };
  }
}

export async function updateCreativePathAction(path: CreativePathType) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to select a Creative Path." };
  }

  const { error } = await supabase
    .from("user_gamification")
    .upsert({
      user_id: user.id,
      creative_path: path,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/profile/[username]", "page");
  return { success: true, path };
}

export async function checkAndUnlockAchievementAction(
  userId: string,
  achievementCode: string
) {
  const adminClient = createAdminClient();

  const { data: achievement } = await adminClient
    .from("achievement_definitions")
    .select("id, code, title, xp_reward")
    .eq("code", achievementCode)
    .single();

  if (!achievement) return { success: false };

  // Check if already unlocked
  const { data: existing } = await adminClient
    .from("user_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("achievement_id", achievement.id)
    .maybeSingle();

  if (existing) return { success: true, status: "already_unlocked" };

  // Unlock achievement
  await adminClient.from("user_achievements").insert({
    user_id: userId,
    achievement_id: achievement.id,
  });

  // Award bonus XP for unlocking achievement
  if (achievement.xp_reward > 0) {
    await awardXPInternal(
      userId,
      "achievement",
      achievement.xp_reward,
      `achievement:${achievementCode}:${userId}`,
      { code: achievementCode, title: achievement.title }
    );
  }

  // Notify user
  await adminClient.from("notifications").insert({
    recipient_id: userId,
    type: "achievement_unlocked",
    target_type: "profile",
    target_id: userId,
    metadata: {
      code: achievementCode,
      title: achievement.title,
      xp_reward: achievement.xp_reward,
    },
  });

  return { success: true, unlocked: true, title: achievement.title };
}
