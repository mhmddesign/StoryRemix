"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function fetchCompetitionsAction() {
  const supabase = await createClient();

  const { data: competitions, error } = await supabase
    .from("prize_competitions")
    .select(`
      *,
      awards:prize_awards(
        id,
        award_rank,
        prize_amount_cents,
        award_badge_code,
        story:stories(id, title, slug)
      )
    `)
    .order("start_date", { ascending: false });

  if (error || !competitions) {
    return [];
  }

  return competitions;
}

export async function checkStoryEligibilityAction(storyId: string) {
  const supabase = await createClient();

  const { data: story, error } = await supabase
    .from("stories")
    .select(`
      id,
      title,
      status,
      current_paragraph_count,
      segments:story_segments(author_id)
    `)
    .eq("id", storyId)
    .single();

  if (error || !story) {
    return { eligible: false, reasons: ["Story not found."] };
  }

  const reasons: string[] = [];
  const uniqueAuthors = new Set((story.segments || []).map((s: any) => s.author_id));

  // Eligibility Rule 1: Collaborative (at least 2 authors)
  if (uniqueAuthors.size < 2) {
    reasons.push("Requires at least two distinct co-authors.");
  }

  // Eligibility Rule 2: Sufficient length (at least 4 paragraphs)
  if (story.current_paragraph_count < 4) {
    reasons.push("Story must have reached at least 4 paragraphs.");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    uniqueAuthorsCount: uniqueAuthors.size,
    paragraphsCount: story.current_paragraph_count,
  };
}
