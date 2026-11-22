import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryReader } from "@/components/story/story-reader";
import { ActiveRoundWidget, StoryRoundData } from "@/components/story/active-round-widget";
import { StoryInteractionBar } from "@/components/story/story-interaction-bar";
import { RemixModalTrigger } from "@/components/story/remix-modal-trigger";
import { BookOpen, Users, Flame, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

interface StoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: storyRaw } = await supabase
    .from("stories")
    .select("title, description, genre")
    .eq("slug", slug)
    .single();

  const story = storyRaw as any;
  if (!story) {
    return { title: "Story Not Found | StoryRemix" };
  }

  return {
    title: `${story.title} | StoryRemix`,
    description: story.description || `Read and contribute to ${story.title} on StoryRemix.`,
    openGraph: {
      title: `${story.title} | StoryRemix`,
      description: story.description || `Collaborative storytelling on StoryRemix.`,
    },
  };
}

export default async function StoryDetailPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch story
  const { data: storyRaw, error: storyError } = await supabase
    .from("stories")
    .select(`
      *,
      owner:profiles!stories_owner_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("slug", slug)
    .single();

  const story = storyRaw as any;
  if (storyError || !story) {
    notFound();
  }

  // 2. Fetch canonical story segments
  const { data: segmentsRaw } = await supabase
    .from("story_segments")
    .select(`
      id,
      paragraph_index,
      body,
      vote_count_at_lock,
      author:profiles!story_segments_author_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("story_id", story.id)
    .order("paragraph_index", { ascending: true });

  const segments = (segmentsRaw || []).map((s: any) => ({
    id: s.id,
    paragraph_index: s.paragraph_index,
    body: s.body,
    vote_count_at_lock: s.vote_count_at_lock,
    author: s.author || {
      id: "unknown",
      username: "writer",
      display_name: "Collaborator",
      avatar_url: null,
    },
  }));

  // 3. Fetch active or latest round if not completed
  let roundData: StoryRoundData | null = null;
  if (story.status !== "completed") {
    const { data: currentRoundRaw } = await supabase
      .from("story_rounds")
      .select("*")
      .eq("story_id", story.id)
      .in("status", ["open", "evaluating", "awaiting_creator_resolution"])
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentRound = currentRoundRaw as any;
    if (currentRound) {
      // Fetch competing candidates for this round
      const { data: candidatesRaw } = await supabase
        .from("contributions")
        .select(`
          id,
          round_id,
          author_id,
          body,
          sentence_count,
          word_count,
          vote_count,
          status,
          author:profiles!contributions_author_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq("round_id", currentRound.id)
        .order("vote_count", { ascending: false });

      // Check if logged-in user cast a vote in this round
      let userVotedContributionId: string | null = null;
      if (user) {
        const { data: userVoteRaw } = await supabase
          .from("votes")
          .select("contribution_id")
          .eq("round_id", currentRound.id)
          .eq("voter_id", user.id)
          .maybeSingle();

        const userVote = userVoteRaw as any;
        if (userVote) {
          userVotedContributionId = userVote.contribution_id;
        }
      }

      roundData = {
        id: currentRound.id,
        story_id: story.id,
        round_number: currentRound.round_number,
        paragraph_position: currentRound.paragraph_position,
        vote_threshold: currentRound.vote_threshold,
        deadline_at: currentRound.deadline_at,
        status: currentRound.status,
        candidates: (candidatesRaw || []).map((c: any) => ({
          ...c,
          author: c.author || {
            id: c.author_id,
            username: "writer",
            display_name: "Contributor",
            avatar_url: null,
          },
        })),
        userVotedContributionId,
        storyOwnerId: story.owner_id,
      };
    }
  }

  // 4. Fetch like & bookmark status
  let isLiked = false;
  let isBookmarked = false;
  if (user) {
    const { data: likeRecord } = await supabase
      .from("story_likes")
      .select("id")
      .eq("story_id", story.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isLiked = !!likeRecord;

    const { data: bookmarkRecord } = await supabase
      .from("bookmarks")
      .select("story_id")
      .eq("story_id", story.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isBookmarked = !!bookmarkRecord;
  }

  const { count: likesCount } = await supabase
    .from("story_likes")
    .select("*", { count: "exact", head: true })
    .eq("story_id", story.id);

  // Unique contributors calculation
  const uniqueAuthors = new Set(segments.map((s) => s.author.id));

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-10">
      {/* Story Metadata & Title Header */}
      <div className="space-y-4 border-b border-[var(--border)] pb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider">
            {story.genre}
          </span>
          <span className="px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--muted-foreground)] uppercase">
            {story.language}
          </span>
          {story.status === "completed" ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete Story
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 font-semibold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> Round in Progress
            </span>
          )}
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[var(--foreground)] tracking-tight leading-tight">
          {story.title}
        </h1>

        {story.description && (
          <p className="text-sm sm:text-base text-[var(--muted-foreground)] font-serif italic max-w-2xl">
            &ldquo;{story.description}&rdquo;
          </p>
        )}

        {/* Stats & Progress Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <strong className="text-[var(--foreground)]">{segments.length}</strong> of{" "}
              {story.max_paragraphs} Paragraphs
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-700" />
              <strong className="text-[var(--foreground)]">{uniqueAuthors.size}</strong>{" "}
              Contributors
            </span>
          </div>

          <StoryInteractionBar
            storyId={story.id}
            initialLikes={likesCount || 0}
            initialIsLiked={isLiked}
            initialIsBookmarked={isBookmarked}
            storyTitle={story.title}
          />
        </div>
      </div>

      {/* Published Story Paragraphs Reader */}
      <section>
        <StoryReader
          segments={segments}
          storyTitle={story.title}
          isCompleted={story.status === "completed"}
          totalParagraphs={story.max_paragraphs}
        />
      </section>

      {/* Active Round Voting and Submissions (if story is active) */}
      {roundData && story.status !== "completed" && (
        <section className="border-t border-[var(--border)] pt-8">
          <ActiveRoundWidget round={roundData} storyId={story.id} />
        </section>
      )}

      {/* Remix Trigger (if story is completed) */}
      {story.status === "completed" && (
        <section className="border-t border-[var(--border)] pt-8">
          <RemixModalTrigger
            storyId={story.id}
            storyTitle={story.title}
            segments={segments}
          />
        </section>
      )}
    </div>
  );
}
