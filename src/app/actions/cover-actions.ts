"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const submitProposalSchema = z.object({
  storyId: z.string().uuid(),
  imageUrl: z.string().url("Valid image URL required"),
  altText: z.string().max(200).optional(),
  rightsConfirmed: z.boolean().refine((val) => val === true, {
    message: "You must confirm you have the rights to use this cover image.",
  }),
});

export async function submitCoverProposalAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to propose a cover." };
  }

  const validated = submitProposalSchema.safeParse({
    storyId: formData.get("storyId"),
    imageUrl: formData.get("imageUrl"),
    altText: formData.get("altText") || undefined,
    rightsConfirmed: formData.get("rightsConfirmed") === "true" || formData.get("rightsConfirmed") === "on",
  });

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid cover proposal data.",
    };
  }

  const { storyId, imageUrl, altText, rightsConfirmed } = validated.data;

  // Insert proposal
  const { data: proposal, error: insertError } = await supabase
    .from("story_cover_proposals")
    .insert({
      story_id: storyId,
      proposer_id: user.id,
      image_url: imageUrl,
      alt_text: altText || null,
      rights_confirmed: rightsConfirmed,
      status: "pending",
      votes_count: 0,
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  revalidatePath(`/stories/[slug]`, "page");
  return { success: true, proposal, message: "Cover proposal submitted for creator review!" };
}

export async function voteCoverProposalAction(proposalId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to vote on covers." };
  }

  // 1. Fetch proposal to get storyId
  const { data: proposal, error: pError } = await supabase
    .from("story_cover_proposals")
    .select("id, story_id, votes_count")
    .eq("id", proposalId)
    .single();

  if (pError || !proposal) {
    return { success: false, error: "Cover proposal not found." };
  }

  // 2. Check if already voted
  const { data: existingVote } = await supabase
    .from("story_cover_votes")
    .select("id")
    .eq("proposal_id", proposalId)
    .eq("voter_id", user.id)
    .maybeSingle();

  if (existingVote) {
    // Toggle off (remove vote)
    await supabase.from("story_cover_votes").delete().eq("id", existingVote.id);
    await supabase
      .from("story_cover_proposals")
      .update({ votes_count: Math.max(0, proposal.votes_count - 1) })
      .eq("id", proposalId);

    revalidatePath(`/stories/[slug]`, "page");
    return { success: true, voted: false, votesCount: Math.max(0, proposal.votes_count - 1) };
  } else {
    // Cast vote
    const { error: vError } = await supabase.from("story_cover_votes").insert({
      story_id: proposal.story_id,
      proposal_id: proposalId,
      voter_id: user.id,
    });

    if (vError) {
      return { success: false, error: vError.message };
    }

    await supabase
      .from("story_cover_proposals")
      .update({ votes_count: proposal.votes_count + 1 })
      .eq("id", proposalId);

    revalidatePath(`/stories/[slug]`, "page");
    return { success: true, voted: true, votesCount: proposal.votes_count + 1 };
  }
}

export async function acceptCoverProposalAction(storyId: string, proposalId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to manage story covers." };
  }

  // Verify ownership of the story
  const { data: story, error: sError } = await supabase
    .from("stories")
    .select("id, owner_id, cover_image_url")
    .eq("id", storyId)
    .single();

  if (sError || !story || story.owner_id !== user.id) {
    return { success: false, error: "Only the original story creator can approve cover proposals." };
  }

  // Fetch proposal
  const { data: proposal, error: pError } = await supabase
    .from("story_cover_proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (pError || !proposal) {
    return { success: false, error: "Cover proposal not found." };
  }

  // Archive previous cover in history if existed
  if (story.cover_image_url) {
    await supabase.from("story_cover_history").insert({
      story_id: storyId,
      image_url: story.cover_image_url,
      chosen_by: user.id,
      proposal_id: proposalId,
    });
  }

  // Update story cover
  const { error: updateError } = await supabase
    .from("stories")
    .update({
      cover_image_url: proposal.image_url,
      cover_alt_text: proposal.alt_text,
      cover_creator_id: proposal.proposer_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storyId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Mark proposal as approved
  await supabase
    .from("story_cover_proposals")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", proposalId);

  revalidatePath(`/stories/[slug]`, "page");
  return { success: true, message: "New cover applied to story!" };
}

export async function rejectCoverProposalAction(storyId: string, proposalId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to manage story covers." };
  }

  const { data: story } = await supabase
    .from("stories")
    .select("owner_id")
    .eq("id", storyId)
    .single();

  if (!story || story.owner_id !== user.id) {
    return { success: false, error: "Only the original story creator can reject cover proposals." };
  }

  await supabase
    .from("story_cover_proposals")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", proposalId);

  revalidatePath(`/stories/[slug]`, "page");
  return { success: true, message: "Cover proposal rejected." };
}

export async function fetchCoverProposalsAction(storyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: proposals, error } = await supabase
    .from("story_cover_proposals")
    .select(`
      *,
      proposer:profiles!story_cover_proposals_proposer_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("story_id", storyId)
    .order("votes_count", { ascending: false });

  if (error || !proposals) {
    return [];
  }

  // Fetch current user votes
  let userVotedIds = new Set<string>();
  if (user) {
    const { data: userVotes } = await supabase
      .from("story_cover_votes")
      .select("proposal_id")
      .eq("story_id", storyId)
      .eq("voter_id", user.id);

    userVotes?.forEach((v) => userVotedIds.add(v.proposal_id));
  }

  return proposals.map((p) => ({
    ...p,
    hasVoted: userVotedIds.has(p.id),
  }));
}
