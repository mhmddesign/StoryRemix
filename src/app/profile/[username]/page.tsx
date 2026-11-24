import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryCard, StoryCardData } from "@/components/story/story-card";
import { FollowButton } from "@/components/profile/follow-button";
import { LevelProgressCard } from "@/components/profile/level-progress-card";
import { CreativePathCard } from "@/components/profile/creative-path-card";
import { ProfileEditModal } from "@/components/profile/profile-edit-modal";
import { evaluateCommunityArchetype } from "@/lib/gamification";
import { ensureUserProfile } from "@/app/actions/auth-actions";
import { getShowcaseProfileByUsername, getAllShowcaseStories } from "@/lib/showcase-service";
import {
  Calendar,
  Award,
  BookOpen,
  Feather,
  Sparkles,
  Trophy,
  Shield,
  Zap,
  UserX,
  Compass,
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

  let targetId: string | null = null;
  let targetUsername: string | null = username;

  // Handle "/profile/me" shortcut
  if (username === "me") {
    if (!user) {
      redirect("/login");
    }
    targetId = user.id;
    targetUsername = null;
  } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username)) {
    // If username is actually a UUID
    targetId = username;
    targetUsername = null;
  }

  // 1. Fetch profile
  let query = supabase.from("profiles").select("*");
  if (targetId) {
    query = query.eq("id", targetId);
  } else {
    query = query.eq("username", targetUsername!);
  }

  let { data: profileRaw } = await query.maybeSingle();

  // If viewing own profile and it was not found, self-heal
  if (!profileRaw && user && (targetId === user.id || username === "me")) {
    const heal = await ensureUserProfile();
    if (heal.success && heal.profile) {
      profileRaw = heal.profile;
    }
  }

  // Check showcase author directory
  const showcaseProfile = !profileRaw ? getShowcaseProfileByUsername(username) : null;

  // If still not found, render a friendly profile not found screen
  if (!profileRaw && !showcaseProfile) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-700/10 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
          <UserX className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-[var(--foreground)]">
            Writer Profile Not Found
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
            The author &ldquo;{username}&rdquo; hasn&apos;t joined StoryRemix yet or may have updated their pen name.
          </p>
        </div>
        <div className="pt-3 flex items-center justify-center gap-3">
          <Link
            href="/explore"
            className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow transition-colors inline-flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover Stories</span>
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)] text-xs font-semibold text-[var(--foreground)] transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const profile = (profileRaw as any) || {
    id: showcaseProfile!.id,
    username: showcaseProfile!.username,
    display_name: showcaseProfile!.display_name,
    avatar_url: showcaseProfile!.avatar_url,
    bio: showcaseProfile!.bio,
    created_at: showcaseProfile!.registration_date,
    preferred_language: showcaseProfile!.preferred_language,
    is_demo: true,
    literary_interests: showcaseProfile!.literary_interests,
  };
  const isOwner = user?.id === profile.id;
  const isShowcase = !!showcaseProfile;

  // 2. Fetch created stories
  let createdStoriesRaw: any[] | null = null;
  let segmentsWon: any[] | null = null;
  let gamificationRaw: any = null;

  if (isShowcase) {
    const allShowcase = getAllShowcaseStories();
    createdStoriesRaw = allShowcase.filter((s) => s.owner_id === profile.id);
    segmentsWon = allShowcase.flatMap((s) =>
      s.segments
        .filter((seg) => seg.author.id === profile.id && seg.paragraph_index > 1)
        .map((seg) => ({
          id: seg.id,
          paragraph_index: seg.paragraph_index,
          body: seg.body,
          vote_count_at_lock: seg.vote_count_at_lock,
          story: { title: s.title, slug: s.slug },
        }))
    );
    gamificationRaw = {
      lifetime_xp: showcaseProfile!.xp,
      current_level: showcaseProfile!.level,
      creative_path: showcaseProfile!.creative_path,
    };
  } else {
    const { data: dbStories } = await supabase
      .from("stories")
      .select(`
        *,
        owner:profiles!stories_owner_id_fkey(id, username, display_name, avatar_url),
        rounds:story_rounds(id, round_number, paragraph_position, deadline_at, status)
      `)
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false });
    createdStoriesRaw = dbStories;

    const { data: dbSegments } = await supabase
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
    segmentsWon = dbSegments;

    const { data: dbGamification } = await supabase
      .from("user_gamification")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle();
    gamificationRaw = dbGamification;
  }

  const lifetimeXp = gamificationRaw?.lifetime_xp || 0;
  const creativePath = gamificationRaw?.creative_path || "storyteller";

  // 5. Fetch unlocked achievements
  const { data: userAchievementsRaw } = await supabase
    .from("user_achievements")
    .select(`
      unlocked_at,
      achievement:achievement_definitions(id, code, title, description, category, rarity, icon)
    `)
    .eq("user_id", profile.id);

  // 6. Check if current viewer follows this profile
  let isFollowing = false;
  if (user && !isOwner) {
    const { data: follow } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("followed_id", profile.id)
      .maybeSingle();
    isFollowing = !!follow;
  }

  // 7. Stats calculation
  const storiesCount = createdStoriesRaw?.length || 0;
  const segmentsWonCount = segmentsWon?.length || 0;

  // Derive calculated community archetype
  const calculatedArchetype = evaluateCommunityArchetype({
    storiesCreated: storiesCount,
    continuationsSubmitted: segmentsWonCount * 2, // proxy activity
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
    cover_image_url: s.cover_image_url,
    owner: s.owner || {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    },
    active_round: null,
    is_liked: false,
    is_bookmarked: false,
  }));

  const achievements = (userAchievementsRaw || []).map((ua: any) => ua.achievement);

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-10 px-4 sm:px-0">
      {/* Community Showcase Banner if demo profile */}
      {isShowcase && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-600/30 text-amber-900 dark:text-amber-200 flex items-center gap-3 text-xs shadow-xs">
          <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider text-[11px]">Curated Community Showcase Writer</span>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              This is a fictional showcase writer profile demonstrating platform XP progression, literary paths, and collaborative story participation.
            </p>
          </div>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="relative p-6 sm:p-10 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-3xl bg-amber-700/10 border-2 border-amber-700/20 flex items-center justify-center text-amber-700 dark:text-amber-400 text-3xl font-bold shadow-inner shrink-0 overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile.display_name?.charAt(0).toUpperCase()}</span>
            )}
          </div>

          {/* Identity & Bio */}
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                  {profile.display_name}
                </h1>
                <p className="text-xs text-[var(--muted-foreground)] font-mono">
                  @{profile.username}
                </p>
              </div>

              {/* Action Buttons: Follow or Edit Profile */}
              <div>
                {isOwner ? (
                  <ProfileEditModal
                    currentDisplayName={profile.display_name}
                    currentBio={profile.bio}
                    currentLanguage={profile.preferred_language || "en"}
                    currentAvatarUrl={profile.avatar_url}
                  />
                ) : (
                  user && (
                    <FollowButton
                      targetUserId={profile.id}
                      initialIsFollowing={isFollowing}
                    />
                  )
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)] story-font max-w-2xl leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Badges / Meta tags */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-700/10 text-amber-800 dark:text-amber-300 font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>{calculatedArchetype}</span>
              </span>

              {profile.role === "admin" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 font-semibold">
                  <Shield className="w-3 h-3" />
                  <span>Curator / Staff</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <Calendar className="w-3 h-3" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Aggregate Stats Ribbons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--border)]">
          <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-center">
            <span className="block text-lg font-bold text-[var(--foreground)]">
              {storiesCount}
            </span>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              Stories Started
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-center">
            <span className="block text-lg font-bold text-amber-600">
              {segmentsWonCount}
            </span>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              Rounds Won
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-center">
            <span className="block text-lg font-bold text-[var(--foreground)]">
              {lifetimeXp}
            </span>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              Lifetime XP
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-center">
            <span className="block text-lg font-bold text-[var(--foreground)]">
              {achievements.length}
            </span>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              Badges
            </span>
          </div>
        </div>
      </div>

      {/* Gamification Dashboard: Levels & Creative Path */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LevelProgressCard lifetimeXp={lifetimeXp} />
        <CreativePathCard currentPath={creativePath} isOwner={isOwner} />
      </div>

      {/* Achievements Gallery */}
      <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>Unlocked Achievements</span>
          </h2>
          <span className="text-xs text-[var(--muted-foreground)] font-mono">
            {achievements.length} Badges
          </span>
        </div>

        {achievements.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-[var(--border)] text-center space-y-2">
            <Award className="w-8 h-8 text-[var(--muted-foreground)] mx-auto opacity-40" />
            <p className="text-xs text-[var(--muted-foreground)]">
              No milestone badges unlocked yet. Start writing or participating in voting rounds to earn achievements!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map((a: any) => (
              <div
                key={a.id}
                className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-700/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-[var(--foreground)] block">
                    {a.title}
                  </span>
                  <p className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                    {a.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stories Created Section */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-700" />
          <span>Stories Started by {profile.display_name}</span>
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
          <Feather className="w-5 h-5 text-amber-700" />
          <span>Winning Paragraph Contributions</span>
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
