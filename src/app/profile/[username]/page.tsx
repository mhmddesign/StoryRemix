import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryCard, StoryCardData } from "@/components/story/story-card";
import { FollowButton } from "@/components/profile/follow-button";
import { LevelProgressCard } from "@/components/profile/level-progress-card";
import { CreativePathCard } from "@/components/profile/creative-path-card";
import { evaluateCommunityArchetype } from "@/lib/gamification";
import {
  Calendar,
  Award,
  BookOpen,
  Feather,
  Sparkles,
  Trophy,
  Shield,
  Zap,
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

  // 4. Fetch user gamification state
  const { data: gamificationRaw } = await supabase
    .from("user_gamification")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();

  const lifetimeXp = gamificationRaw?.lifetime_xp || 0;
  const creativePath = gamificationRaw?.creative_path || "storyteller";

  // 5. Fetch unlocked achievements
  const { data: userAchievementsRaw } = await supabase
    .from("user_achievements")
    .select(`
      unlocked_at,
      achievement:achievement_definitions(code, title, description, category, rarity, xp_reward, icon)
    `)
    .eq("user_id", profile.id)
    .order("unlocked_at", { ascending: false });

  const achievements = (userAchievementsRaw || []).map((ua: any) => ({
    unlockedAt: ua.unlocked_at,
    ...ua.achievement,
  }));

  // 6. Follow counts & status
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

  // Calculate community archetype
  const calculatedArchetype = evaluateCommunityArchetype({
    storiesCreated: storiesCount,
    continuationsSubmitted: segmentsWonCount * 2, // approximation
    votesCast: 10,
    remixesCreated: 0,
  });

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

  const isOwner = user?.id === profile.id;

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
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                    {profile.display_name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 font-semibold text-[10px]">
                    {calculatedArchetype}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">@{profile.username}</p>
              </div>

              {!isOwner && (
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

        {/* Gamification Dual Cards: Level Progress & Creative Path */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
          <LevelProgressCard lifetimeXp={lifetimeXp} />
          <CreativePathCard currentPath={creativePath} isOwner={isOwner} />
        </div>

        {/* Achievements Gallery */}
        <div className="pt-4 border-t border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              Achievements ({achievements.length} Unlocked)
            </h3>
          </div>

          {achievements.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
              No achievements unlocked yet. Publish a story, vote in active rounds, or win continuations to unlock honors!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map((a: any) => {
                const rarityColor =
                  a.rarity === "legendary"
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-700"
                    : a.rarity === "epic"
                    ? "border-purple-500/40 bg-purple-500/10 text-purple-700"
                    : a.rarity === "rare"
                    ? "border-blue-500/40 bg-blue-500/10 text-blue-700"
                    : a.rarity === "uncommon"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                    : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]";

                return (
                  <div
                    key={a.code}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${rarityColor}`}
                  >
                    <Award className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs">{a.title}</span>
                        <span className="text-[9px] uppercase font-bold tracking-wider opacity-75">
                          {a.rarity}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                        {a.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
