"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RevenuePolicyType } from "@/types/database";
import { calculateGiftSplit, calculateAuthorAllocations } from "@/lib/revenue-sharing";

export async function toggleStoryReactionAction(
  storyId: string,
  reactionType: string,
  segmentId?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to react to stories." };
  }

  // Check if existing
  let query = supabase
    .from("story_reactions")
    .select("id")
    .eq("story_id", storyId)
    .eq("user_id", user.id)
    .eq("reaction_type", reactionType);

  if (segmentId) {
    query = query.eq("segment_id", segmentId);
  } else {
    query = query.is("segment_id", null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    await supabase.from("story_reactions").delete().eq("id", existing.id);
    revalidatePath(`/stories/[slug]`, "page");
    return { success: true, reacted: false };
  } else {
    await supabase.from("story_reactions").insert({
      story_id: storyId,
      segment_id: segmentId || null,
      user_id: user.id,
      reaction_type: reactionType,
    });

    // Award minor discovery XP for community reaction
    const adminClient = createAdminClient();
    await adminClient.rpc("award_xp", {
      p_user_id: user.id,
      p_activity_type: "reaction",
      p_amount: 1,
      p_event_id: `reaction:${storyId}:${reactionType}:${Date.now()}`,
    });

    revalidatePath(`/stories/[slug]`, "page");
    return { success: true, reacted: true };
  }
}

export async function consentToRevenuePolicyAction(
  storyId: string,
  policyId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to record policy consent." };
  }

  const { error } = await supabase
    .from("contributor_policy_consents")
    .upsert({
      story_id: storyId,
      policy_id: policyId,
      user_id: user.id,
      consented_at: new Date().toISOString(),
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function sendGiftAction(
  storyId: string,
  giftCode: string,
  segmentId?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to send a gift." };
  }

  const adminClient = createAdminClient();

  // 1. Fetch gift from catalog
  const { data: gift, error: giftError } = await adminClient
    .from("gift_catalog")
    .select("*")
    .eq("code", giftCode)
    .eq("is_active", true)
    .single();

  if (giftError || !gift) {
    return { success: false, error: "Gift not found or unavailable." };
  }

  // 2. Fetch story and its canonical segments
  const { data: story, error: storyError } = await adminClient
    .from("stories")
    .select("*, segments:story_segments(author_id, paragraph_index)")
    .eq("id", storyId)
    .single();

  if (storyError || !story) {
    return { success: false, error: "Story not found." };
  }

  // 3. Calculate gift fee split
  const split = calculateGiftSplit(
    gift.price_cents,
    gift.creator_share_basis_points,
    gift.platform_fee_basis_points
  );

  // 4. Create gift transaction record (Sandbox / Test Mode)
  const { data: transaction, error: txError } = await adminClient
    .from("gift_transactions")
    .insert({
      gift_id: gift.id,
      story_id: storyId,
      segment_id: segmentId || null,
      sender_id: user.id,
      amount_cents: split.grossPriceCents,
      creator_pool_cents: split.creatorPoolCents,
      platform_fee_cents: split.platformFeeCents,
      status: "completed",
      payment_reference: `sandbox_gift_${Date.now()}`,
    })
    .select()
    .single();

  if (txError || !transaction) {
    return { success: false, error: txError?.message || "Failed to record gift." };
  }

  // 5. Fetch story's active revenue policy
  const { data: policy } = await adminClient
    .from("author_revenue_policies")
    .select("*")
    .eq("story_id", storyId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const policyConfig = {
    policyType: policy?.policy_type || "equal_collaborators",
    creatorReservedPercentage: policy?.creator_reserved_percentage ?? 30,
    openingParagraphWeight: policy?.opening_paragraph_weight ?? 1,
    continuationParagraphWeight: policy?.continuation_paragraph_weight ?? 1,
    finalParagraphWeight: policy?.final_paragraph_weight ?? 1,
  };

  const segments = (story.segments || []).map((s: any) => ({
    authorId: s.author_id,
    paragraphIndex: s.paragraph_index,
  }));

  // 6. Calculate individual author allocations
  const allocations = calculateAuthorAllocations(
    split.creatorPoolCents,
    story.owner_id,
    segments,
    policyConfig,
    story.max_paragraphs
  );

  if (allocations.length > 0) {
    const allocationInserts = allocations.map((a) => ({
      gift_transaction_id: transaction.id,
      recipient_id: a.authorId,
      allocated_cents: a.allocatedCents,
      status: "allocated",
    }));

    await adminClient.from("gift_allocations").insert(allocationInserts);
  }

  // 7. Double-entry accounting ledger entries
  // Transaction
  const { data: finTx } = await adminClient
    .from("financial_transactions")
    .insert({
      reference_type: "gift",
      reference_id: transaction.id,
      amount_cents: split.grossPriceCents,
      currency: "USD",
      status: "completed",
    })
    .select()
    .single();

  if (finTx) {
    await adminClient.from("financial_ledger_entries").insert([
      // Credit Platform Fee
      {
        transaction_id: finTx.id,
        account_type: "platform_revenue",
        account_id: "platform",
        entry_type: "credit",
        amount_cents: split.platformFeeCents,
      },
      // Credit Creator Escrow
      {
        transaction_id: finTx.id,
        account_type: "creator_escrow",
        account_id: "escrow",
        entry_type: "credit",
        amount_cents: split.creatorPoolCents,
      },
    ]);
  }

  // 8. Award minor patronage XP to sender
  await adminClient.rpc("award_xp", {
    p_user_id: user.id,
    p_activity_type: "gift_sent",
    p_amount: 15,
    p_event_id: `gift_sent:${transaction.id}`,
    p_metadata: { gift_name: gift.name, story_id: storyId },
  });

  revalidatePath(`/stories/[slug]`, "page");
  return {
    success: true,
    message: `Sent ${gift.name} ${gift.symbol}! Support allocated to ${allocations.length} authors.`,
    allocations,
  };
}
