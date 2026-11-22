import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StoryCard, StoryCardData } from "@/components/story/story-card";
import {
  Feather,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Award,
  Bookmark,
  LogIn,
} from "lucide-react";
import { calculateHotScore, calculateTrendingScore } from "@/lib/leaderboards";

interface HomePageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

const FEED_TABS = [
  { id: "hot", label: "Hot", icon: Flame, desc: "Active rounds & voting momentum" },
  { id: "for-you", label: "For You", icon: Sparkles, desc: "Personalized literary recommendations" },
  { id: "trending", label: "Trending", icon: TrendingUp, desc: "Fastest-moving story arcs" },
  { id: "new", label: "New Seeds", icon: Clock, desc: "Freshly planted story openings" },
  { id: "week", label: "Best of This Week", icon: Award, desc: "Top-voted stories of the current cycle" },
  { id: "completed", label: "Completed", icon: CheckCircle2, desc: "Finished canonical stories" },
  { id: "saved", label: "Saved", icon: Bookmark, desc: "Your personal reading list" },
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const { tab = "hot" } = await searchParams;
  const activeTab = FEED_TABS.some((t) => t.id === tab) ? tab : "hot";

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
  let stories: StoryCardData[] = (rawStories || []).map((s: any) => {
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
    };
  });

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

  const currentTabObj = FEED_TABS.find((t) => t.id === activeTab) || FEED_TABS[0];
  const TabIcon = currentTabObj.icon;

  return (
    <div className="space-y-14 py-4">
      {/* Literary Hero */}
      <section className="relative p-8 sm:p-14 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-amber-700/5 via-[var(--card)] to-amber-700/10 shadow-sm text-center sm:text-left overflow-hidden">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Collective Storytelling Social Platform</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-[var(--foreground)] tracking-tight leading-[1.15]">
            One story. Many minds. Endless possibilities.
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted-foreground)] story-font leading-relaxed">
            Write an opening paragraph. Each subsequent paragraph is submitted by the community and selected through transparent democratic voting.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/stories/new"
              className="px-6 py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Feather className="w-4 h-4" />
              <span>Plant a Story Seed</span>
            </Link>

            <Link
              href="/explore"
              className="px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] text-[var(--foreground)] font-semibold text-xs sm:text-sm transition-all"
            >
              <span>Explore Library</span>
            </Link>

            <Link
              href="/leaderboards"
              className="px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-amber-700/50 text-[var(--foreground)] font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>Rankings</span>
            </Link>
          </div>
        </div>

        {/* Decorative corner icon */}
        <div className="hidden lg:block absolute -right-6 -bottom-6 text-amber-700/10 pointer-events-none">
          <Feather className="w-72 h-72" />
        </div>
      </section>

      {/* The 3-Step Primitive Action (NPE Framework) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-700/10 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center text-sm">
            01
          </div>
          <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
            Read & Discover
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            Follow stories in progress. Read what other minds have contributed and immerse yourself in evolving plotlines.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-700/10 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center text-sm">
            02
          </div>
          <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
            Write 2–3 Sentences
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            Accessible participation. You don&apos;t need to write a whole chapter—just submit a concise, punchy 2-to-3 sentence continuation.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-700/10 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center text-sm">
            03
          </div>
          <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
            Vote & Immortalize
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            One vote per round. When the round closes, the winning candidate is locked forever into the canonical story with attribution.
          </p>
        </div>
      </section>

      {/* Discovery Feeds */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <TabIcon className="w-5 h-5 text-amber-600" />
              <span>{currentTabObj.label}</span>
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {currentTabObj.desc}
            </p>
          </div>

          {/* Feed Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {FEED_TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <Link
                  key={t.id}
                  href={t.id === "hot" ? "/" : `/?tab=${t.id}`}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-amber-800 text-white shadow-sm"
                      : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-amber-700/30"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Feed Content */}
        {requiresAuthPrompt ? (
          <div className="p-12 rounded-2xl border border-dashed border-[var(--border)] text-center space-y-3">
            <Bookmark className="w-10 h-10 text-[var(--muted-foreground)] mx-auto opacity-40" />
            <h3 className="font-semibold text-base text-[var(--foreground)]">
              Sign in to view your reading list
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
              Save captivating stories to follow their narrative evolution and cast votes in upcoming rounds.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-semibold mt-2 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          </div>
        ) : stories.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-[var(--border)] text-center space-y-3">
            <BookOpen className="w-10 h-10 text-[var(--muted-foreground)] mx-auto opacity-40" />
            <h3 className="font-semibold text-base text-[var(--foreground)]">
              No stories found in this view
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
              {activeTab === "saved"
                ? "You haven't bookmarked any stories yet. Explore the community feeds to find your first favorite!"
                : "Be the first to plant a story seed in this collection!"}
            </p>
            <Link
              href="/stories/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-semibold mt-2 cursor-pointer"
            >
              <Feather className="w-3.5 h-3.5" />
              <span>Start Story</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>

      {/* Completed Anthology Callout (if on active tab) */}
      {activeTab !== "completed" && (
        <section className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[var(--foreground)]">
                Looking for finished stories?
              </h4>
              <p className="text-xs text-[var(--muted-foreground)]">
                Browse our completed anthology to read full collaborative works and create story remixes.
              </p>
            </div>
          </div>

          <Link
            href="/?tab=completed"
            className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)] text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <span>View Completed Stories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      )}
    </div>
  );
}
