"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeStoryText } from "@/lib/sentence-tokenizer";
import { slugify } from "@/lib/utils";
import { awardXPInternal, checkAndUnlockAchievementAction } from "./gamification-actions";
import { RevenuePolicyType } from "@/types/database";
import { z } from "zod";

const createStorySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(500).optional(),
  openingText: z.string().min(20, "Opening must be at least 20 characters").max(2500),
  genre: z.string().min(1, "Please select a genre"),
  language: z.enum(["en", "fr", "ar"]),
  visibility: z.enum(["public", "unlisted", "private"]),
  maxParagraphs: z.number().int().min(2).max(30),
  defaultVoteThreshold: z.number().int().min(1).max(100),
  defaultRoundDuration: z.number().int().min(60).max(604800), // 1 min to 7 days
  tags: z.array(z.string()).default([]),
  revenuePolicyType: z.enum([
    "equal_collaborators",
    "contribution_weighted",
    "creator_and_collaborators",
    "weighted_roles",
  ]).default("equal_collaborators"),
  creatorReservedPercentage: z.number().int().min(0).max(100).default(30),
  openingParagraphWeight: z.number().int().min(1).max(5).default(2),
  continuationParagraphWeight: z.number().int().min(1).max(5).default(1),
  finalParagraphWeight: z.number().int().min(1).max(5).default(2),
});

export async function createStoryAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to create a story." };
  }

  const rawTags = formData.get("tags") as string;
  const parsedTags = rawTags
    ? rawTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const validated = createStorySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    openingText: formData.get("openingText"),
    genre: formData.get("genre"),
    language: formData.get("language") || "en",
    visibility: formData.get("visibility") || "public",
    maxParagraphs: Number(formData.get("maxParagraphs") || 8),
    defaultVoteThreshold: Number(formData.get("defaultVoteThreshold") || 3),
    defaultRoundDuration: Number(formData.get("defaultRoundDuration") || 86400),
    tags: parsedTags,
    revenuePolicyType: (formData.get("revenuePolicyType") as any) || "equal_collaborators",
    creatorReservedPercentage: Number(formData.get("creatorReservedPercentage") || 30),
    openingParagraphWeight: Number(formData.get("openingParagraphWeight") || 2),
    continuationParagraphWeight: Number(formData.get("continuationParagraphWeight") || 1),
    finalParagraphWeight: Number(formData.get("finalParagraphWeight") || 2),
  });

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues.map((i) => i.message).join(", "),
    };
  }

  const values = validated.data;

  // Validate opening text sentence count (2 to 5 sentences for the opening)
  const analysis = analyzeStoryText(values.openingText);
  if (analysis.sentenceCount < 2 || analysis.sentenceCount > 5) {
    return {
      success: false,
      error: `Opening paragraph must have between 2 and 5 sentences (currently detected ${analysis.sentenceCount}).`,
    };
  }

  const slug = slugify(values.title);

  // 1. Insert Story
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .insert({
      owner_id: user.id,
      title: values.title,
      slug,
      description: values.description || null,
      genre: values.genre,
      tags: values.tags,
      language: values.language,
      visibility: values.visibility,
      max_paragraphs: values.maxParagraphs,
      current_paragraph_count: 1,
      default_vote_threshold: values.defaultVoteThreshold,
      default_round_duration: values.defaultRoundDuration,
      status: "active",
    })
    .select()
    .single();

  if (storyError || !story) {
    return { success: false, error: storyError?.message || "Failed to create story." };
  }

  // 2. Insert opening paragraph into canonical story_segments (paragraph_index: 1)
  const { error: segmentError } = await supabase.from("story_segments").insert({
    story_id: story.id,
    paragraph_index: 1,
    author_id: user.id,
    body: values.openingText.trim(),
    vote_count_at_lock: 0,
  });

  if (segmentError) {
    return { success: false, error: "Failed to initialize opening story paragraph." };
  }

  // 3. Open Round 1 for Paragraph 2
  const deadline = new Date(Date.now() + values.defaultRoundDuration * 1000).toISOString();

  const { error: roundError } = await supabase.from("story_rounds").insert({
    story_id: story.id,
    round_number: 1,
    paragraph_position: 2,
    vote_threshold: values.defaultVoteThreshold,
    opened_at: new Date().toISOString(),
    deadline_at: deadline,
    status: "open",
  });

  if (roundError) {
    return { success: false, error: "Failed to open round 1." };
  }

  // 4. Save Revenue Sharing Policy
  await supabase.from("author_revenue_policies").insert({
    story_id: story.id,
    policy_type: values.revenuePolicyType,
    creator_reserved_percentage: values.creatorReservedPercentage,
    opening_paragraph_weight: values.openingParagraphWeight,
    continuation_paragraph_weight: values.continuationParagraphWeight,
    final_paragraph_weight: values.finalParagraphWeight,
    version: 1,
    is_locked: false,
  });

  // 5. Award Creator XP & Unlock Achievements
  await awardXPInternal(user.id, "publish_story", 25, `story_created:${story.id}`, {
    story_id: story.id,
  });
  await checkAndUnlockAchievementAction(user.id, "first_story");

  // 6. Log analytics event
  await supabase.from("analytics_events").insert({
    event_name: "story_created",
    user_id: user.id,
    properties: {
      story_id: story.id,
      genre: values.genre,
      max_paragraphs: values.maxParagraphs,
      vote_threshold: values.defaultVoteThreshold,
      revenue_policy: values.revenuePolicyType,
    },
  });

  revalidatePath("/");
  revalidatePath("/explore");
  return { success: true, slug: story.slug };
}

export async function submitContinuationAction(
  storyId: string,
  roundId: string,
  body: string
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to submit a continuation." };
  }

  const analysis = analyzeStoryText(body);
  if (!analysis.isValidForContinuation) {
    return { success: false, error: analysis.validationError || "Invalid sentence structure." };
  }

  // Attempt using the secure PostgreSQL stored procedure first
  const { data: rpcData, error: rpcError } = await supabase.rpc("submit_continuation", {
    p_story_id: storyId,
    p_round_id: roundId,
    p_body: body.trim(),
    p_sentence_count: analysis.sentenceCount,
    p_word_count: analysis.wordCount,
  });

  let contributionId: string | null = null;

  if (!rpcError && rpcData) {
    contributionId = (rpcData as any)?.contribution_id || null;
  } else {
    // Fallback direct transaction
    const { data: round } = await supabase
      .from("story_rounds")
      .select("status, deadline_at")
      .eq("id", roundId)
      .single();

    if (!round || round.status !== "open" || new Date() >= new Date(round.deadline_at)) {
      return { success: false, error: "Round submission deadline has expired." };
    }

    const { data: existing } = await supabase
      .from("contributions")
      .select("id")
      .eq("round_id", roundId)
      .eq("author_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      return { success: false, error: "You have already submitted an active continuation for this round." };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("contributions")
      .insert({
        story_id: storyId,
        round_id: roundId,
        author_id: user.id,
        body: body.trim(),
        sentence_count: analysis.sentenceCount,
        word_count: analysis.wordCount,
        status: "active",
        vote_count: 0,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }
    contributionId = inserted?.id || null;
  }

  // Award XP for submitting continuation (+10 XP)
  await awardXPInternal(
    user.id,
    "submit_continuation",
    10,
    `continuation:${roundId}:${user.id}`,
    { story_id: storyId, round_id: roundId }
  );
  await checkAndUnlockAchievementAction(user.id, "first_contribution");

  await supabase.from("analytics_events").insert({
    event_name: "contribution_submitted",
    user_id: user.id,
    properties: { story_id: storyId, round_id: roundId },
  });

  revalidatePath(`/stories/[slug]`, "page");
  return { success: true, message: "Continuation submitted successfully!" };
}

export async function castVoteAction(roundId: string, contributionId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to vote." };
  }

  // Attempt using the secure PostgreSQL stored procedure
  const { data: rpcData, error: rpcError } = await supabase.rpc("cast_vote", {
    p_round_id: roundId,
    p_contribution_id: contributionId,
  });

  if (!rpcError && rpcData) {
    // Award XP for voting (+2 XP with daily cap)
    await awardXPInternal(user.id, "cast_vote", 2, `vote:${roundId}:${user.id}`);
    await checkAndUnlockAchievementAction(user.id, "first_vote");

    revalidatePath(`/stories/[slug]`, "page");
    return { success: true, message: (rpcData as any)?.message || "Vote recorded!" };
  }

  // Fallback direct transaction
  const { data: round } = await supabase
    .from("story_rounds")
    .select("status, deadline_at")
    .eq("id", roundId)
    .single();

  if (!round || round.status !== "open" || new Date() >= new Date(round.deadline_at)) {
    return { success: false, error: "Voting is closed for this round." };
  }

  const { data: candidate } = await supabase
    .from("contributions")
    .select("author_id, vote_count")
    .eq("id", contributionId)
    .single();

  if (!candidate) {
    return { success: false, error: "Candidate not found." };
  }

  if (candidate.author_id === user.id) {
    return { success: false, error: "You cannot vote for your own contribution." };
  }

  const { data: existingVote } = await supabase
    .from("votes")
    .select("id, contribution_id")
    .eq("round_id", roundId)
    .eq("voter_id", user.id)
    .maybeSingle();

  if (existingVote) {
    if (existingVote.contribution_id === contributionId) {
      return { success: true, message: "Vote already recorded." };
    }

    const { data: prevCandidate } = await supabase
      .from("contributions")
      .select("vote_count")
      .eq("id", existingVote.contribution_id)
      .single();

    if (prevCandidate) {
      await supabase
        .from("contributions")
        .update({ vote_count: Math.max(0, prevCandidate.vote_count - 1) })
        .eq("id", existingVote.contribution_id);
    }

    await supabase
      .from("contributions")
      .update({ vote_count: candidate.vote_count + 1 })
      .eq("id", contributionId);

    await supabase
      .from("votes")
      .update({ contribution_id: contributionId, updated_at: new Date().toISOString() })
      .eq("id", existingVote.id);

    return { success: true, message: "Vote switched to new candidate!" };
  }

  await supabase
    .from("contributions")
    .update({ vote_count: candidate.vote_count + 1 })
    .eq("id", contributionId);

  await supabase.from("votes").insert({
    round_id: roundId,
    contribution_id: contributionId,
    voter_id: user.id,
  });

  // Award XP for voting (+2 XP)
  await awardXPInternal(user.id, "cast_vote", 2, `vote:${roundId}:${user.id}`);
  await checkAndUnlockAchievementAction(user.id, "first_vote");

  return { success: true, message: "Vote recorded!" };
}

export async function finalizeRoundAction(roundId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("finalize_round", {
    p_round_id: roundId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // If winner resolved, award winner XP (+25 XP)
  const winnerId = (data as any)?.winner_id;
  if (winnerId) {
    const { data: winnerContrib } = await supabase
      .from("contributions")
      .select("author_id, story_id")
      .eq("id", winnerId)
      .single();

    if (winnerContrib) {
      await awardXPInternal(
        winnerContrib.author_id,
        "win_round",
        25,
        `win_round:${roundId}:${winnerContrib.author_id}`,
        { round_id: roundId, story_id: winnerContrib.story_id }
      );
      await checkAndUnlockAchievementAction(winnerContrib.author_id, "first_win");
    }
  }

  revalidatePath("/", "layout");
  return { success: true, data };
}

export async function resolveUnqualifiedRoundAction(
  roundId: string,
  action: "extend" | "select_highest" | "cancel_and_reopen",
  selectedContributionId?: string,
  extensionDurationSeconds = 86400
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("resolve_unqualified_round", {
    p_round_id: roundId,
    p_action: action,
    p_selected_contribution_id: selectedContributionId || null,
    p_extension_seconds: extensionDurationSeconds,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, data };
}

export async function toggleStoryLikeAction(storyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sign in to like stories." };
  }

  const { data: existing } = await supabase
    .from("story_likes")
    .select("id")
    .eq("story_id", storyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("story_likes").delete().eq("id", existing.id);
    return { success: true, liked: false };
  } else {
    await supabase.from("story_likes").insert({ story_id: storyId, user_id: user.id });
    return { success: true, liked: true };
  }
}

export async function toggleBookmarkAction(storyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sign in to bookmark stories." };
  }

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("story_id")
    .eq("story_id", storyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("bookmarks").delete().eq("story_id", storyId).eq("user_id", user.id);
    return { success: true, bookmarked: false };
  } else {
    await supabase.from("bookmarks").insert({ story_id: storyId, user_id: user.id });
    return { success: true, bookmarked: true };
  }
}
