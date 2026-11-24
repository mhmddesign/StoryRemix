import { ShowcaseStory, ShowcaseAuthor, SHOWCASE_PROFILES, AUTHOR_BY_ID } from "@/data/showcase-data";
import { getFullShowcaseStories } from "@/data/showcase-stories-full";
import { StoryCardData } from "@/components/story/story-card";

// Cache full showcase dataset in memory
let cachedStories: ShowcaseStory[] | null = null;

export function getAllShowcaseStories(): ShowcaseStory[] {
  if (!cachedStories) {
    cachedStories = getFullShowcaseStories();
  }
  return cachedStories;
}

export function getShowcaseStoryBySlug(slug: string): ShowcaseStory | undefined {
  const stories = getAllShowcaseStories();
  return stories.find((s) => s.slug === slug);
}

export function getShowcaseStoryById(id: string): ShowcaseStory | undefined {
  const stories = getAllShowcaseStories();
  return stories.find((s) => s.id === id);
}

export function getShowcaseProfiles(): ShowcaseAuthor[] {
  return SHOWCASE_PROFILES;
}

export function getShowcaseProfileByUsername(username: string): ShowcaseAuthor | undefined {
  return SHOWCASE_PROFILES.find((p) => p.username === username);
}

export function getShowcaseActiveRounds() {
  const stories = getAllShowcaseStories();
  return stories
    .filter((s) => s.status === "active" && s.active_round)
    .map((s) => ({
      story: s,
      round: s.active_round!,
    }));
}

export function getShowcaseCompletedStories() {
  const stories = getAllShowcaseStories();
  return stories.filter((s) => s.status === "completed");
}

export interface StoryFilterOptions {
  q?: string;
  genre?: string;
  lang?: string;
  tab?: string;
  status?: string;
  limit?: number;
}

export function getShowcaseCardDataList(filter?: StoryFilterOptions): StoryCardData[] {
  let stories = getAllShowcaseStories();

  if (filter?.genre && filter.genre !== "All Genres") {
    stories = stories.filter((s) => s.genre.toLowerCase() === filter.genre?.toLowerCase());
  }

  if (filter?.lang) {
    stories = stories.filter((s) => s.language === filter.lang);
  }

  if (filter?.status) {
    stories = stories.filter((s) => s.status === filter.status);
  }

  if (filter?.q) {
    const qLower = filter.q.toLowerCase();
    stories = stories.filter(
      (s) => s.title.toLowerCase().includes(qLower) || s.description.toLowerCase().includes(qLower)
    );
  }

  if (filter?.tab === "completed") {
    stories = stories.filter((s) => s.status === "completed");
  } else if (filter?.tab === "new") {
    stories = [...stories].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (filter?.tab === "hot" || filter?.tab === "trending") {
    stories = [...stories].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
  }

  if (filter?.limit && filter.limit > 0) {
    stories = stories.slice(0, filter.limit);
  }

  return stories.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    description: s.description,
    genre: s.genre,
    language: s.language,
    status: s.status,
    max_paragraphs: s.max_paragraphs,
    current_paragraph_count: s.current_paragraph_count,
    owner: {
      id: s.owner.id,
      username: s.owner.username,
      display_name: s.owner.display_name,
      avatar_url: s.owner.avatar_url,
    },
    cover_image_url: s.cover_image_url,
    cover_alt_text: s.cover_alt_text,
    created_at: s.created_at,
    likes_count: s.likes_count,
    is_liked: false,
    is_bookmarked: false,
    is_demo: true,
    active_round: s.active_round
      ? {
          round_number: s.active_round.round_number,
          paragraph_position: s.active_round.paragraph_position,
          deadline_at: s.active_round.deadline_at,
          candidates_count: s.active_round.candidates.length,
          top_vote_count: Math.max(...s.active_round.candidates.map((c) => c.vote_count), 0),
        }
      : undefined,
  }));
}

/**
 * Blends database stories with showcase community stories.
 * Ensures the platform is vibrant and never empty to new or existing visitors.
 */
export function blendStoriesWithShowcase(
  dbStories: StoryCardData[],
  filter?: StoryFilterOptions
): StoryCardData[] {
  const showcaseStories = getShowcaseCardDataList(filter);
  const seenIds = new Set(dbStories.map((s) => s.id));
  const seenSlugs = new Set(dbStories.map((s) => s.slug));

  const filteredShowcase = showcaseStories.filter(
    (s) => !seenIds.has(s.id) && !seenSlugs.has(s.slug)
  );

  return [...dbStories, ...filteredShowcase];
}
