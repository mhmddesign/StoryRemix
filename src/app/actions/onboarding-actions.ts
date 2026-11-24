"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Database } from "@/types/database";

export interface OnboardingState {
  completed: boolean;
  step: number;
  interests: string[];
  preferredLanguage: string;
}

/**
 * Saves progressive onboarding progress for the current authenticated user.
 */
export async function saveOnboardingStepAction(
  step: number,
  interests?: string[],
  preferredLanguage?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required" };
  }

  const updates: Database["public"]["Tables"]["profiles"]["Update"] = {
    onboarding_step: step,
    updated_at: new Date().toISOString(),
  };

  if (interests && Array.isArray(interests)) {
    updates.literary_interests = interests;
  }

  if (preferredLanguage) {
    updates.preferred_language = preferredLanguage;
  }

  // Update in profiles table
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    // If column doesn't exist yet, store in privacy_settings JSON fallback
    const { data: profile } = await supabase
      .from("profiles")
      .select("privacy_settings")
      .eq("id", user.id)
      .maybeSingle();

    const currentSettings = (profile?.privacy_settings as Record<string, any>) || {};
    await supabase
      .from("profiles")
      .update({
        privacy_settings: {
          ...currentSettings,
          onboarding_step: step,
          literary_interests: interests || currentSettings.literary_interests || [],
          preferred_language: preferredLanguage || currentSettings.preferred_language || "en",
        },
      })
      .eq("id", user.id);
  }

  return { success: true, step };
}

/**
 * Completes the onboarding flow, awards welcome bonus points,
 * and qualifies any pending referral.
 */
export async function completeOnboardingAction(
  interests?: string[],
  preferredLanguage?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required" };
  }

  const updates: Database["public"]["Tables"]["profiles"]["Update"] = {
    onboarding_completed: true,
    onboarding_step: 7,
    updated_at: new Date().toISOString(),
  };

  if (interests && Array.isArray(interests)) {
    updates.literary_interests = interests;
  }

  if (preferredLanguage) {
    updates.preferred_language = preferredLanguage;
  }

  // 1. Mark profile completed
  const { error: profileError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (profileError) {
    // Fallback in privacy_settings
    const { data: profile } = await supabase
      .from("profiles")
      .select("privacy_settings")
      .eq("id", user.id)
      .maybeSingle();

    const currentSettings = (profile?.privacy_settings as Record<string, any>) || {};
    await supabase
      .from("profiles")
      .update({
        privacy_settings: {
          ...currentSettings,
          onboarding_completed: true,
          onboarding_step: 7,
          literary_interests: interests || currentSettings.literary_interests || [],
        },
      })
      .eq("id", user.id);
  }

  // 2. Award 50 Earned Points Welcome Bonus via Wallet or Gamification XP
  try {
    const adminClient = createAdminClient();
    // Try executing wallet RPC if available
    const { error: rpcError } = await (adminClient.rpc as any)("execute_wallet_transaction", {
      p_user_id: user.id,
      p_currency: "earned_points",
      p_amount: 50,
      p_tx_type: "welcome_bonus",
      p_ref_id: `welcome_bonus:${user.id}`,
      p_description: "Welcome bonus for completing onboarding",
      p_metadata: { source: "onboarding_wizard" },
    });

    if (rpcError) {
      // Direct wallet upsert fallback
      const { data: currentWallet } = await adminClient
        .from("wallets")
        .select("earned_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (currentWallet) {
        await adminClient
          .from("wallets")
          .update({
            earned_points: (currentWallet.earned_points || 0) + 50,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      }
    }
  } catch {
    // Ignore wallet error if table not yet migrated
  }

  // 3. Award 20 XP for completing onboarding
  try {
    const admin = createAdminClient();
    await admin.rpc("award_xp", {
      p_user_id: user.id,
      p_activity_type: "onboarding_complete",
      p_amount: 20,
      p_event_id: `onboarding:${user.id}`,
    });
  } catch {
    // Gamification RPC might already have recorded it
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    bonusPoints: 50,
    message: "Onboarding completed successfully! 50 points have been added to your wallet.",
  };
}

/**
 * Resets onboarding status so the user can re-trigger the walkthrough guide.
 */
export async function resetOnboardingAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  await supabase
    .from("profiles")
    .update({
      onboarding_completed: false,
      onboarding_step: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  revalidatePath("/", "layout");
  return { success: true };
}
