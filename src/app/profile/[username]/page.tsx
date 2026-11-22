import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryCard, StoryCardData } from "@/components/story/story-card";
import { FollowButton } from "@/components/profile/follow-button";
import {
  Calendar,
  Award,
  BookOpen,
  Feather,
  Sparkles,
} from "lucide-react";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch profile
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  const profile = profileRaw as any;
  if (!profile) {
    notFound();
  }

  // 2. Fetch created stories
  const { data: createdStoriesRaw } = await supabase
    .from("stories")
    .select(`
      *,
      owner:profiles!stories_owner_id_fkey(id, username, display_name, avatar_url),
      rounds:story_rounds(id, round_number, paragraph_position, deadline_at, status)
    `)
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  // 3. Fetch winning segments written by this user
  const { data: segmentsWon } = await supabase
    .from("story_segments")
    .select(`
      id,
      paragraph_index,
      body,
      vote_count_at_lock,
      story:stories!story_segments_story_id_fkey(title, slug)
    `)
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false });

  // 4. Follow counts & status
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("followed_id", profile.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  let isFollowing = false;
  if (user) {
    const { data: followRecord } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("followed_id", profile.id)
      .maybeSingle();
    isFollowing = !!followRecord;
  }

  const storiesCount = createdStoriesRaw?.length || 0;
  const segmentsWonCount = segmentsWon?.length || 0;

  // Badges calculation
  const badges = [];
  if (storiesCount > 0) badges.push({ name: "Story Creator", desc: "Planted a story seed" });
  if (segmentsWonCount > 0) badges.push({ name: "Collaborative Writer", desc: "Won a community continuation" });
  if (segmentsWonCount >= 5) badges.push({ name: "Master Storyteller", desc: "5+ winning paragraphs" });
  if (profile.role === "admin") badges.push({ name: "Platform Guardian", desc: "Verified Administrator" });

  const createdStories: StoryCardData[] = (createdStoriesRaw || []).map((s: any) => ({
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
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    },
    active_round: null,
  }));

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-10">
      {/* Profile Header */}
      <div className="p-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-amber-700/15 text-amber-800 dark:text-amber-300 font-bold text-3xl flex items-center justify-center border-2 border-amber-700/30">
            {profile.display_name?.charAt(0).toUpperCase() || "W"}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                  {profile.display_name}
                </h1>
                <p className="text-xs text-[var(--muted-foreground)]">@{profile.username}</p>
              </div>

              {user?.id !== profile.id && (
                <FollowButton
                  targetUserId={profile.id}
                  initialIsFollowing={isFollowing}
                />
              )}
            </div>

            {profile.bio && (
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)] story-font max-w-xl">
                {profile.bio}
              </p>
            )}

            {/* Social stats & Join date */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-[var(--muted-foreground)]">
              <span>
                <strong className="text-[var(--foreground)]">{followersCount || 0}</strong> Followers
              </span>
              <span>
                <strong className="text-[var(--foreground)]">{followingCount || 0}</strong> Following
              </span>
              <span>
                <strong className="text-[var(--foreground)]">{storiesCount}</strong> Stories Started
              </span>
              <span>
                <strong className="text-[var(--foreground)]">{segmentsWonCount}</strong> Accepted Paragraphs
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Reputation Badges */}
        {badges.length > 0 && (
          <div className="pt-4 border-t border-[var(--border)] space-y-2">
            <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" /> Community Reputation & Badges
            </h3>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <div
                  key={b.name}
                  className="px-3 py-1.5 rounded-xl border border-amber-700/20 bg-amber-700/5 flex items-center gap-2 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <div>
                    <span className="font-bold text-[var(--foreground)]">{b.name}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] ml-1.5">
                      ({b.desc})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stories Created Section */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-700" /> Stories Started by {profile.display_name}
        </h2>

        {createdStories.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
            No stories published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </div>

      {/* Winning Continuations Section */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <Feather className="w-5 h-5 text-amber-700" /> Winning Paragraph Contributions
        </h2>

        {segmentsWonCount === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
            No winning community continuations recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {segmentsWon?.map((seg: any) => (
              <div
                key={seg.id}
                className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-800 dark:text-amber-300">
                    Paragraph {seg.paragraph_index} in &ldquo;{seg.story?.title}&rdquo;
                  </span>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    Won with {seg.vote_count_at_lock} votes
                  </span>
                </div>
                <p className="story-font text-sm text-[var(--foreground)] italic">
                  &ldquo;{seg.body}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
