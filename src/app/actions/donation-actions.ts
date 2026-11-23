"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateDonationSplit, allocateCreatorPool, ContributorWeight } from "@/lib/donations";
import { awardXPInternal } from "./gamification-actions";

export interface ProcessDonationInput {
  storyId: string;
  grossCents: number;
  donorMessage?: string;
  isAnonymous?: boolean;
}

export async function processDonationAction(input: ProcessDonationInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { storyId, grossCents, donorMessage, isAnonymous = false } = input;

  if (!storyId || !grossCents || grossCents < 100) {
    return {
      success: false,
      error: "Invalid donation amount. Minimum donation is $1.00 USD.",
    };
  }

  // 1. Fetch story details
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("id, slug, owner_id, title")
    .eq("id", storyId)
    .single();

  if (storyError || !story) {
    return { success: false, error: "Story not found." };
  }

  // 2. Fetch canonical segments and unique contributors
  const { data: segments } = await supabase
    .from("story_segments")
    .select("paragraph_index, author_id")
    .eq("story_id", storyId);

  const contributorsMap = new Map<string, number>();
  (segments || []).forEach((seg: any) => {
    contributorsMap.set(seg.author_id, (contributorsMap.get(seg.author_id) || 0) + 1);
  });

  // Ensure original creator is represented
  if (!contributorsMap.has(story.owner_id)) {
    contributorsMap.set(story.owner_id, 1);
  }

  // 3. Fetch active revenue policy
  const { data: policy } = await supabase
    .from("author_revenue_policies")
    .select("*")
    .eq("story_id", storyId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 4. Calculate 90/10 split
  const split = calculateDonationSplit(grossCents);

  const contributorWeights: ContributorWeight[] = Array.from(contributorsMap.entries()).map(
    ([userId, count]) => ({
      userId,
      weight: count,
      isOriginalCreator: userId === story.owner_id,
    })
  );

  const allocations = allocateCreatorPool(
    split.creatorPoolCents,
    contributorWeights,
    policy?.policy_type || "equal_collaborators",
    policy?.creator_reserved_percentage || 30
  );

  // 5. Insert Donation (using admin client to ensure clean multi-table transaction record)
  const adminClient = createAdminClient();

  const { data: donation, error: donationError } = await adminClient
    .from("donations")
    .insert({
      story_id: story.id,
      donor_id: user?.id || null,
      gross_amount_cents: split.grossCents,
      processor_fee_cents: split.processorFeeCents,
      net_amount_cents: split.netCents,
      creator_pool_cents: split.creatorPoolCents,
      platform_fee_cents: split.platformFeeCents,
      currency: "USD",
      status: "completed",
      is_sandbox: true, // Sandbox simulation for production MVP testing
      metadata: {
        donor_message: donorMessage || null,
        is_anonymous: isAnonymous,
        donor_email: user?.email || null,
        story_title: story.title,
      },
    })
    .select()
    .single();

  if (donationError || !donation) {
    return {
      success: false,
      error: donationError?.message || "Failed to record donation transaction.",
    };
  }

  // 6. Insert Contributor Allocations
  if (allocations.length > 0) {
    const allocationRecords = allocations.map((alloc) => ({
      donation_id: donation.id,
      author_id: alloc.userId,
      allocated_cents: alloc.amountCents,
    }));

    await adminClient.from("donation_allocations").insert(allocationRecords);
  }

  // 7. Award Gamification XP to authenticated donor (+20 XP for supporting creators)
  if (user) {
    await awardXPInternal(
      user.id,
      "support_creator",
      20,
      `donation_${donation.id}`,
      {
        donation_id: donation.id,
        story_id: story.id,
        amount_cents: grossCents,
      }
    );
  }

  revalidatePath(`/stories/${story.slug}`);

  return {
    success: true,
    donationId: donation.id,
    split,
    allocations,
  };
}
