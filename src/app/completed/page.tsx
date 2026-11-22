import { createClient } from "@/lib/supabase/server";
import { StoryCard, StoryCardData } from "@/components/story/story-card";
import { CheckCircle2, Sparkles } from "lucide-react";

export default async function CompletedAnthologyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: storiesRaw } = await supabase
    .from("stories")
    .select(`
      *,
      owner:profiles!stories_owner_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("status", "completed")
    .eq("visibility", "public")
    .order("completed_at", { ascending: false });

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

  const completedStories: StoryCardData[] = (storiesRaw || []).map((s: any) => ({
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
    active_round: null,
    is_liked: userLikes.has(s.id),
    is_bookmarked: userBookmarks.has(s.id),
  }));

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Completed Anthology</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)]">
          Finished Collaborative Literature
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
          Read full stories co-crafted by multiple writers. Like, bookmark, or branch into an alternative remix timeline.
        </p>
      </div>

      {completedStories.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-[var(--border)] text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-[var(--muted-foreground)] mx-auto opacity-50" />
          <h3 className="font-semibold text-sm text-[var(--foreground)]">No stories completed yet</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            Stories will appear here as their final community rounds are finalized!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}
