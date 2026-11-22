import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StoryCard, StoryCardData } from "@/components/story/story-card";
import {
  Feather,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  BookOpen,
  Users,
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch active stories with their rounds & owners
  const { data: storiesRaw } = await supabase
    .from("stories")
    .select(`
      *,
      owner:profiles!stories_owner_id_fkey(id, username, display_name, avatar_url),
      rounds:story_rounds(id, round_number, paragraph_position, deadline_at, status)
    `)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(12);

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

  const stories: StoryCardData[] = (storiesRaw || []).map((s: any) => {
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

  const activeStories = stories.filter((s) => s.status === "active");
  const completedStories = stories.filter((s) => s.status === "completed");

  return (
    <div className="space-y-16 py-4">
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
              <span>Explore Active Rounds</span>
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

      {/* Active Stories & Open Voting Rounds */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-600" />
              Active Collaborative Rounds
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Stories currently seeking their next community-voted paragraph.
            </p>
          </div>

          <Link
            href="/rounds"
            className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeStories.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-[var(--border)] text-center space-y-3">
            <BookOpen className="w-10 h-10 text-[var(--muted-foreground)] mx-auto opacity-40" />
            <h3 className="font-semibold text-base text-[var(--foreground)]">
              No active stories right now
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
              Be the first to plant a story seed and invite the community to continue it!
            </p>
            <Link
              href="/stories/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-semibold mt-2"
            >
              <Feather className="w-3.5 h-3.5" />
              <span>Start Story</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>

      {/* Completed Anthology */}
      {completedStories.length > 0 && (
        <section className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Completed Anthology
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Stories that reached their planned conclusion. Ready to read and remix.
              </p>
            </div>

            <Link
              href="/completed"
              className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
