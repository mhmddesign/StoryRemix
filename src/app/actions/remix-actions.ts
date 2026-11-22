"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { awardXPInternal, checkAndUnlockAchievementAction } from "./gamification-actions";

export async function createRemixAction(
  parentStoryId: string,
  remixTitle: string,
  remixDescription: string,
  branchParagraphIndex: number,
  maxParagraphs: number
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Please sign in to remix this story." };
  }

  // 1. Fetch parent story
  const { data: parentStoryRaw, error: parentError } = await supabase
    .from("stories")
    .select("*")
    .eq("id", parentStoryId)
    .single();

  const parentStory = parentStoryRaw as any;
  if (parentError || !parentStory) {
    return { success: false, error: "Original story not found." };
  }

  // 2. Fetch canonical segments up to the chosen branch point
  const { data: parentSegments, error: segmentsError } = await supabase
    .from("story_segments")
    .select("*")
    .eq("story_id", parentStoryId)
    .lte("paragraph_index", branchParagraphIndex)
    .order("paragraph_index", { ascending: true });

  if (segmentsError || !parentSegments || parentSegments.length === 0) {
    return { success: false, error: "Could not retrieve branching paragraphs." };
  }

  const slug = slugify(remixTitle);

  // 3. Create the remix story
  const { data: newStoryRaw, error: insertError } = await supabase
    .from("stories")
    .insert({
      owner_id: user.id,
      title: remixTitle,
      slug,
      description: remixDescription || `A remix of ${parentStory.title} branching at paragraph ${branchParagraphIndex}.`,
      genre: parentStory.genre,
      tags: [...(parentStory.tags || []), "remix"],
      language: parentStory.language,
      visibility: "public",
      max_paragraphs: maxParagraphs,
      current_paragraph_count: branchParagraphIndex,
      default_vote_threshold: parentStory.default_vote_threshold,
      default_round_duration: parentStory.default_round_duration,
      status: "active",
    } as any)
    .select()
    .single();

  const newStory = newStoryRaw as any;
  if (insertError || !newStory) {
    return { success: false, error: insertError?.message || "Failed to create remix." };
  }

  // 4. Copy inherited segments into the new story preserving author attribution!
  const segmentsToCopy = parentSegments.map((s: any) => ({
    story_id: newStory.id,
    paragraph_index: s.paragraph_index,
    author_id: s.author_id,
    source_contribution_id: s.source_contribution_id,
    body: s.body,
    vote_count_at_lock: s.vote_count_at_lock,
  }));

  const { error: copyError } = await supabase
    .from("story_segments")
    .insert(segmentsToCopy as any);

  if (copyError) {
    return { success: false, error: "Failed to link inherited paragraphs to remix." };
  }

  // 5. Open next round for paragraph (branchParagraphIndex + 1)
  const deadline = new Date(Date.now() + (newStory.default_round_duration || 86400) * 1000).toISOString();
  await supabase.from("story_rounds").insert({
    story_id: newStory.id,
    round_number: 1,
    paragraph_position: branchParagraphIndex + 1,
    vote_threshold: newStory.default_vote_threshold || 3,
    opened_at: new Date().toISOString(),
    deadline_at: deadline,
    status: "open",
  } as any);

  // 6. Record remix lineage
  await supabase.from("story_remixes").insert({
    parent_story_id: parentStoryId,
    remix_story_id: newStory.id,
    remixed_at_paragraph: branchParagraphIndex,
    creator_id: user.id,
  } as any);

  // Award XP for creating a remix (+25 XP)
  await awardXPInternal(user.id, "remix_story", 25, `story_remixed:${newStory.id}`, {
    parent_story_id: parentStoryId,
    remix_story_id: newStory.id,
  });
  await checkAndUnlockAchievementAction(user.id, "first_remix");

  // 7. Track analytics event
  await supabase.from("analytics_events").insert({
    event_name: "story_remixed",
    user_id: user.id,
    properties: {
      parent_story_id: parentStoryId,
      remix_story_id: newStory.id,
      branchParagraphIndex,
    },
  } as any);

  revalidatePath("/");
  revalidatePath(`/stories/${parentStory.slug}`);
  return { success: true, slug: newStory.slug };
}
