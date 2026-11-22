import { createClient } from "@/lib/supabase/server";
import { StoryCard, StoryCardData } from "@/components/story/story-card";
import { Flame, Clock } from "lucide-react";

export default async function ActiveRoundsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch stories with open rounds
  const { data: storiesRaw } = await supabase
    .from("stories")
    .select(`
      *,
      owner:profiles!stories_owner_id_fkey(id, username, display_name, avatar_url),
      rounds:story_rounds(id, round_number, paragraph_position, deadline_at, status)
    `)
    .eq("status", "active")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  const userLikes = new Set<string>();
  const userBookmarks = new Set<string>();

  if (user) {
    const { data: likes } = await supabase
      .from("story_likes")
      .select("story_id")
      .eq("user_id", user.id);
    likes?.forEach((l: any) => userLikes.add(l.story_id));

    const { data: bmarks } = await supabase
      .from("bookmarks")
      .select("story_id")
      .eq("user_id", user.id);
    bmarks?.forEach((b: any) => userBookmarks.add(b.story_id));
  }

  const storiesWithOpenRounds: StoryCardData[] = [];

  (storiesRaw || []).forEach((s: any) => {
    const openRound = s.rounds?.find((r: any) =>
      ["open", "evaluating", "awaiting_creator_resolution"].includes(r.status)
    );

    if (openRound) {
      storiesWithOpenRounds.push({
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
        active_round: {
          round_number: openRound.round_number,
          paragraph_position: openRound.paragraph_position,
          deadline_at: openRound.deadline_at,
          status: openRound.status,
        },
        is_liked: userLikes.has(s.id),
        is_bookmarked: userBookmarks.has(s.id),
      });
    }
  });

  // Sort by deadline urgency (closest deadline first)
  storiesWithOpenRounds.sort((a, b) => {
    const deadA = new Date(a.active_round?.deadline_at || 0).getTime();
    const deadB = new Date(b.active_round?.deadline_at || 0).getTime();
    return deadA - deadB;
  });

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <Flame className="w-3.5 h-3.5 text-amber-600" />
          <span>Active Voting Rounds</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)]">
          Stories Seeking Their Next Continuation
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
          Ordered by closing urgency. Cast your vote or submit your 2-to-3 sentence candidate before deadlines expire.
        </p>
      </div>

      {storiesWithOpenRounds.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-[var(--border)] text-center space-y-2">
          <Clock className="w-8 h-8 text-[var(--muted-foreground)] mx-auto opacity-50" />
          <h3 className="font-semibold text-sm text-[var(--foreground)]">No active rounds right now</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            Check back soon or start a new story to launch a round!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {storiesWithOpenRounds.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}
