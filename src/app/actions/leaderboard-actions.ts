"use server";

import { createClient } from "@/lib/supabase/server";
import {
  calculateHotScore,
  calculateTrendingScore,
  getPeriodBoundaries,
  RankedStoryItem,
  RankedCreatorItem,
} from "@/lib/leaderboards";
import { LeaderboardCategory, LeaderboardPeriodType } from "@/types/database";

export async function fetchRankedStoriesAction(
  category: LeaderboardCategory = "hot",
  periodType: LeaderboardPeriodType = "week"
): Promise<RankedStoryItem[]> {
  const supabase = await createClient();

  const boundaries = getPeriodBoundaries(periodType);

  // 1. Fetch public stories with segments and likes
  const { data: stories, error } = await supabase
    .from("stories")
    .select(`
      id,
      title,
      slug,
      genre,
      language,
      current_paragraph_count,
      max_paragraphs,
      status,
      created_at,
      updated_at,
      owner:profiles!stories_owner_id_fkey(id, username, display_name, avatar_url),
      segments:story_segments(author_id, vote_count_at_lock),
      likes:story_likes(count)
    `)
    .eq("visibility", "public");

  if (error || !stories) {
    return [];
  }

  // 2. Compute rankings according to category rules
  const ranked: { story: any; score: number; uniqueContributors: number; votesCount: number; likesCount: number }[] = [];

  for (const story of stories) {
    const segments = story.segments || [];
    const uniqueContributors = new Set(segments.map((s: any) => s.author_id)).size;
    const votesCount = segments.reduce((acc: number, s: any) => acc + (s.vote_count_at_lock || 0), 0);
    const likesCount = (story as any).likes?.[0]?.count || 0;

    let score = 0;
    if (category === "hot") {
      score = calculateHotScore(votesCount, uniqueContributors, likesCount, story.updated_at || story.created_at || new Date().toISOString());
    } else if (category === "trending") {
      score = calculateTrendingScore(votesCount, uniqueContributors, likesCount);
    } else {
      // Period Best: (votes * 3 + likes * 2 + contributors * 5)
      score = votesCount * 3 + likesCount * 2 + uniqueContributors * 5;
    }

    ranked.push({
      story,
      score,
      uniqueContributors,
      votesCount,
      likesCount,
    });
  }

  // Sort descending by score
  ranked.sort((a, b) => b.score - a.score);

  return ranked.slice(0, 25).map((item, index) => ({
    id: item.story.id,
    rank: index + 1,
    title: item.story.title,
    slug: item.story.slug,
    genre: item.story.genre,
    language: item.story.language,
    currentParagraphCount: item.story.current_paragraph_count,
    maxParagraphs: item.story.max_paragraphs,
    status: item.story.status,
    owner: {
      id: item.story.owner?.id || "unknown",
      username: item.story.owner?.username || "author",
      displayName: item.story.owner?.display_name || "Author",
      avatarUrl: item.story.owner?.avatar_url || null,
    },
    score: item.score,
    uniqueContributors: item.uniqueContributors,
    votesCount: item.votesCount,
    likesCount: item.likesCount,
  }));
}

export async function fetchRankedCreatorsAction(): Promise<RankedCreatorItem[]> {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      created_stories:stories(id, status),
      segments_won:story_segments(id, story_id)
    `)
    .limit(50);

  if (error || !profiles) {
    return [];
  }

  const creators: RankedCreatorItem[] = profiles.map((p: any) => {
    const storiesCreated = p.created_stories?.length || 0;
    const winningParagraphs = p.segments_won?.length || 0;
    const uniqueStoriesContributed = new Set(p.segments_won?.map((s: any) => s.story_id)).size;

    // Creator score based purely on creative achievements (NOT gifts or XP!)
    const score = storiesCreated * 10 + winningParagraphs * 15 + uniqueStoriesContributed * 8;

    return {
      id: p.id,
      rank: 0,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      score,
      storiesCreated,
      winningParagraphs,
      uniqueCollaborators: uniqueStoriesContributed,
    };
  });

  creators.sort((a, b) => b.score - a.score);

  return creators.slice(0, 20).map((c, idx) => ({
    ...c,
    rank: idx + 1,
  }));
}
