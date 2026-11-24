import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StoryCard, StoryCardData } from "@/components/story/story-card";
import { calculateHotScore, calculateTrendingScore } from "@/lib/leaderboards";
import { blendStoriesWithShowcase } from "@/lib/showcase-service";
import { HomeHero } from "@/components/home/home-hero";
import { HomePrimitiveSteps } from "@/components/home/home-primitive-steps";
import { HomeFeedTabs } from "@/components/home/home-feed-tabs";
import { HomeEmptyState } from "@/components/home/home-empty-state";
import { HomeSavedPrompt } from "@/components/home/home-saved-prompt";
import { HomeCompletedBanner } from "@/components/home/home-completed-banner";

interface HomePageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

const VALID_TABS = ["hot", "for-you", "trending", "new", "week", "completed", "saved"];

export default async function HomePage({ searchParams }: HomePageProps) {
  const { tab = "hot" } = await searchParams;
  const activeTab = VALID_TABS.includes(tab) ? tab : "hot";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch likes & bookmarks for current user if signed in
  const userLikes = new Set<string>();
  const userBookmarks = new Set<string>();

  if (user) {
    const { data: likes } = await supabase
      .from("story_likes")
      .select("story_id")
      .eq("user_id", user.id);
    likes?.forEach((l) => userLikes.add(l.story_id));

    const { data: bmarks } = await supabase
      .from("bookmarks")
      .select("story_id")
      .eq("user_id", user.id);
    bmarks?.forEach((b) => userBookmarks.add(b.story_id));
  }

  // Construct query based on active tab
  let query = supabase
    .from("stories")
    .select(`
      *,
      owner:profiles!stories_owner_id_fkey(id, username, display_name, avatar_url),
      rounds:story_rounds(id, round_number, paragraph_position, deadline_at, status),
      segments:story_segments(id, author_id)
    `)
    .eq("visibility", "public");

  let requiresAuthPrompt = false;

  if (activeTab === "saved") {
    if (!user) {
      requiresAuthPrompt = true;
    } else {
      const savedIds = Array.from(userBookmarks);
      if (savedIds.length > 0) {
        query = query.in("id", savedIds);
      } else {
        query = query.in("id", ["none"]); // empty result
      }
    }
  } else if (activeTab === "completed") {
    query = query.eq("status", "completed").order("updated_at", { ascending: false }).limit(18);
  } else if (activeTab === "new") {
    query = query.order("created_at", { ascending: false }).limit(18);
  } else if (activeTab === "week") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    query = query.gte("created_at", sevenDaysAgo).order("created_at", { ascending: false }).limit(18);
  } else {
    // For Hot, Trending, or For-You
    query = query.limit(30);
  }

  const { data: rawStories } = requiresAuthPrompt ? { data: [] } : await query;

  // Transform raw stories into Card Data
  const dbStories: StoryCardData[] = (rawStories || []).map((s: any) => {
    const openRound = s.rounds?.find((r: any) =>
      ["open", "evaluating", "awaiting_creator_resolution"].includes(r.status)
    );

    return {
      id: s.id,
      title: s.title,
      slug: s.slug,
      description: s.description,
      genre: s.genre,
      language: s.language,
      status: s.status,
      max_paragraphs: s.max_paragraphs,
      current_paragraph_count: s.current_paragraph_count,
      owner: s.owner || {
        id: s.owner_id,
        username: "creator",
        display_name: "Original Author",
        avatar_url: null,
      },
      active_round: openRound
        ? {
            round_number: openRound.round_number,
            paragraph_position: openRound.paragraph_position,
            deadline_at: openRound.deadline_at,
            status: openRound.status,
          }
        : null,
      is_liked: userLikes.has(s.id),
      is_bookmarked: userBookmarks.has(s.id),
      is_demo: s.is_demo || false,
    };
  });

  // Blend with showcase community stories so the platform is ALWAYS vibrant and active
  const stories = requiresAuthPrompt
    ? []
    : blendStoriesWithShowcase(dbStories, { tab: activeTab, limit: 18 });

  // Apply tab-specific sorting algorithms
  if (activeTab === "hot") {
    stories.sort((a, b) => {
      const rawA = (rawStories || []).find((s: any) => s.id === a.id);
      const rawB = (rawStories || []).find((s: any) => s.id === b.id);

      const uniqueA = new Set(rawA?.segments?.map((seg: any) => seg.author_id)).size;
      const uniqueB = new Set(rawB?.segments?.map((seg: any) => seg.author_id)).size;

      const scoreA = calculateHotScore(
        a.active_round ? 5 : 1,
        uniqueA,
        userLikes.has(a.id) ? 1 : 0,
        rawA?.updated_at || rawA?.created_at || new Date().toISOString()
      );
      const scoreB = calculateHotScore(
        b.active_round ? 5 : 1,
        uniqueB,
        userLikes.has(b.id) ? 1 : 0,
        rawB?.updated_at || rawB?.created_at || new Date().toISOString()
      );

      return scoreB - scoreA;
    });
  } else if (activeTab === "trending") {
    stories.sort((a, b) => {
      const rawA = (rawStories || []).find((s: any) => s.id === a.id);
      const rawB = (rawStories || []).find((s: any) => s.id === b.id);

      const uniqueA = new Set(rawA?.segments?.map((seg: any) => seg.author_id)).size;
      const uniqueB = new Set(rawB?.segments?.map((seg: any) => seg.author_id)).size;

      const scoreA = calculateTrendingScore(a.active_round ? 10 : 2, uniqueA, 2);
      const scoreB = calculateTrendingScore(b.active_round ? 10 : 2, uniqueB, 2);

      return scoreB - scoreA;
    });
  }

  return (
    <div className="space-y-14 py-4">
      {/* Literary Hero */}
      <HomeHero />

      {/* The 3-Step Primitive Action (NPE Framework) */}
      <HomePrimitiveSteps />

      {/* Discovery Feeds */}
      <section className="space-y-6">
        <HomeFeedTabs activeTab={activeTab} />

        {/* Feed Content */}
        {requiresAuthPrompt ? (
          <HomeSavedPrompt />
        ) : stories.length === 0 ? (
          <HomeEmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>

      {/* Completed Anthology Callout (if not on completed tab) */}
      {activeTab !== "completed" && <HomeCompletedBanner />}
    </div>
  );
}
