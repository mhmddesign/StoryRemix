import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StoryCard, StoryCardData } from "@/components/story/story-card";
import { BookOpen, PlusCircle, Feather } from "lucide-react";

export default async function MyStoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: storiesRaw } = await supabase
    .from("stories")
    .select(`
      *,
      rounds:story_rounds(id, round_number, paragraph_position, deadline_at, status)
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

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
      owner: {
        id: user.id,
        username: profile?.username || "me",
        display_name: profile?.display_name || "Me",
        avatar_url: profile?.avatar_url || null,
      },
      active_round: openRound
        ? {
            round_number: openRound.round_number,
            paragraph_position: openRound.paragraph_position,
            deadline_at: openRound.deadline_at,
            status: openRound.status,
          }
        : null,
    };
  });

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]">
            My Stories
          </h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Stories you initiated. Manage ongoing rounds and observe community contributions.
          </p>
        </div>

        <Link
          href="/stories/new"
          className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start a New Story</span>
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-[var(--border)] text-center space-y-3">
          <Feather className="w-8 h-8 text-[var(--muted-foreground)] mx-auto opacity-50" />
          <h3 className="font-semibold text-sm text-[var(--foreground)]">
            You haven&apos;t started any stories yet
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
            Plant your first story seed and let the community write the continuations with you.
          </p>
          <Link
            href="/stories/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-semibold mt-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Story</span>
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
