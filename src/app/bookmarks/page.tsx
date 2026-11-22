import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryCard, StoryCardData } from "@/components/story/story-card";
import { Bookmark, Compass } from "lucide-react";
import Link from "next/link";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: bookmarksRaw } = await supabase
    .from("bookmarks")
    .select(`
      created_at,
      story:stories(
        *,
        owner:profiles!stories_owner_id_fkey(id, username, display_name, avatar_url),
        rounds:story_rounds(id, round_number, paragraph_position, deadline_at, status)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const stories: StoryCardData[] = [];

  (bookmarksRaw || []).forEach((b: any) => {
    const s = b.story;
    if (!s) return;

    const openRound = s.rounds?.find((r: any) =>
      ["open", "evaluating", "awaiting_creator_resolution"].includes(r.status)
    );

    stories.push({
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
      is_bookmarked: true,
    });
  });

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-amber-700" /> Saved Stories
        </h1>
        <p className="text-xs text-[var(--muted-foreground)]">
          Stories you bookmarked to follow their round progress and read new paragraphs.
        </p>
      </div>

      {stories.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-[var(--border)] text-center space-y-3">
          <Bookmark className="w-8 h-8 text-[var(--muted-foreground)] mx-auto opacity-50" />
          <h3 className="font-semibold text-sm text-[var(--foreground)]">No bookmarked stories</h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
            Click the bookmark icon on any story card to save it to your personal library.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-semibold mt-2"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Stories</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}
