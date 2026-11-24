import { createClient } from "@/lib/supabase/server";
import { StoryCard, StoryCardData } from "@/components/story/story-card";
import { blendStoriesWithShowcase } from "@/lib/showcase-service";
import { AdSlot } from "@/components/ads/ad-slot";
import { Compass, Search, Filter } from "lucide-react";

interface ExplorePageProps {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    lang?: string;
  }>;
}

const GENRES = [
  "All Genres",
  "Fantasy",
  "Science Fiction",
  "Mystery & Detective",
  "Thriller & Suspense",
  "Historical Fiction",
  "Horror & Supernatural",
  "Literary Fiction",
  "Romance",
  "Adventure",
  "Satire & Comedy",
];

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { q, genre, lang } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("stories")
    .select(`
      *,
      owner:profiles!stories_owner_id_fkey(id, username, display_name, avatar_url),
      rounds:story_rounds(id, round_number, paragraph_position, deadline_at, status)
    `)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (genre && genre !== "All Genres") {
    query = query.eq("genre", genre);
  }

  if (lang) {
    query = query.eq("language", lang);
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data: storiesRaw } = await query;

  // Fetch likes & bookmarks
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

  const dbStories: StoryCardData[] = (storiesRaw || []).map((s: any) => {
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
        display_name: "Author",
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

  const stories = blendStoriesWithShowcase(dbStories, { q, genre, lang });

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5" />
          <span>Discovery Directory</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)]">
          Explore All Stories
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
          Search and filter across genres, languages, and collaborative styles.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col sm:flex-row items-center gap-4">
        <form method="GET" action="/explore" className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Search stories by title or description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <form method="GET" action="/explore" className="flex items-center gap-2">
            {q && <input type="hidden" name="q" value={q} />}
            <select
              name="genre"
              defaultValue={genre || "All Genres"}
              className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              name="lang"
              defaultValue={lang || ""}
              className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              <option value="">All Languages</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold cursor-pointer"
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* Results Grid */}
      {stories.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-[var(--border)] text-center space-y-2">
          <Compass className="w-8 h-8 text-[var(--muted-foreground)] mx-auto opacity-50" />
          <h3 className="font-semibold text-sm text-[var(--foreground)]">No stories found</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            Try adjusting your search criteria or clearing filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      {/* Non-intrusive AdSlot for Discovery Feed (Disabled by default) */}
      <AdSlot slotId="explore_feed_bottom" format="horizontal" />
    </div>
  );
}
