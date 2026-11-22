import Link from "next/link";
import {
  fetchRankedStoriesAction,
  fetchRankedCreatorsAction,
} from "@/app/actions/leaderboard-actions";
import { LeaderboardCategory, LeaderboardPeriodType } from "@/types/database";
import {
  Trophy,
  Flame,
  TrendingUp,
  Clock,
  Sparkles,
  Users,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface LeaderboardsPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function LeaderboardsPage({ searchParams }: LeaderboardsPageProps) {
  const { tab = "hot" } = await searchParams;

  let category: LeaderboardCategory = "hot";
  let period: LeaderboardPeriodType = "week";
  const isCreatorTab = tab === "creators";

  if (tab === "trending") {
    category = "trending";
  } else if (tab === "today") {
    category = "best_today";
    period = "today";
  } else if (tab === "week") {
    category = "best_week";
    period = "week";
  } else if (tab === "month") {
    category = "best_month";
    period = "month";
  } else if (tab === "year") {
    category = "best_year";
    period = "year";
  } else if (tab === "all_time") {
    category = "all_time";
    period = "all_time";
  }

  const rankedStories = isCreatorTab ? [] : await fetchRankedStoriesAction(category, period);
  const rankedCreators = isCreatorTab ? await fetchRankedCreatorsAction() : [];

  const TABS = [
    { id: "hot", label: "Hot", icon: Flame },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "today", label: "Best Today", icon: Clock },
    { id: "week", label: "This Week", icon: Trophy },
    { id: "month", label: "This Month", icon: Sparkles },
    { id: "year", label: "This Year", icon: Award },
    { id: "all_time", label: "All-Time Best", icon: BookOpen },
    { id: "creators", label: "Top Creators", icon: Users },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Community Rankings</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)]">
          StoryRemix Leaderboards
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
          Celebrating the most captivating collaborative narratives and prolific co-authors.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border)]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <Link
              key={t.id}
              href={`/leaderboards?tab=${t.id}`}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-amber-800 text-white shadow-sm"
                  : "border border-[var(--border)] hover:bg-[var(--accent)] text-[var(--foreground)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Integrity Transparency Notice */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] flex items-start gap-2.5 text-xs text-[var(--muted-foreground)]">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-[var(--foreground)]">Ranking Integrity Rule:</strong> Rankings are calculated purely from genuine democratic participation: unique community votes, reader engagement, and accepted contributions. Financial gifts and XP never alter story or author rankings.
        </div>
      </div>

      {/* Story Leaderboard Table */}
      {!isCreatorTab && (
        <div className="space-y-3">
          {rankedStories.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-2xl">
              No ranked stories found for this period. Participate in active rounds to climb the leaderboard!
            </div>
          ) : (
            rankedStories.map((story) => {
              const isTop3 = story.rank <= 3;
              const rankColor =
                story.rank === 1
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                  : story.rank === 2
                  ? "bg-slate-300/30 text-slate-700 dark:text-slate-300 border-slate-400/40"
                  : story.rank === 3
                  ? "bg-amber-700/20 text-amber-800 dark:text-amber-400 border-amber-700/40"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] border-transparent";

              return (
                <div
                  key={story.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isTop3
                      ? "border-amber-700/30 bg-[var(--card)] shadow-sm"
                      : "border-[var(--border)] bg-[var(--card)]"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <span
                      className={`w-9 h-9 rounded-xl border font-bold text-sm flex items-center justify-center shrink-0 ${rankColor}`}
                    >
                      {story.rank}
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 font-semibold text-[10px]">
                          {story.genre}
                        </span>
                        <span className="text-[var(--muted-foreground)]">
                          By @{story.owner.username}
                        </span>
                      </div>

                      <Link
                        href={`/stories/${story.slug}`}
                        className="font-serif text-lg font-bold text-[var(--foreground)] hover:text-amber-800 dark:hover:text-amber-400 hover:underline block"
                      >
                        {story.title}
                      </Link>

                      <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                        <span>
                          {story.currentParagraphCount} / {story.maxParagraphs} Paragraphs
                        </span>
                        <span>•</span>
                        <span>{story.uniqueContributors} Contributors</span>
                        <span>•</span>
                        <span>{story.votesCount} Total Votes</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--border)]">
                    <div className="text-right">
                      <span className="text-[10px] text-[var(--muted-foreground)] block">
                        Rank Score
                      </span>
                      <span className="font-mono font-bold text-sm text-amber-700 dark:text-amber-400">
                        {story.score.toFixed(1)}
                      </span>
                    </div>

                    <Link
                      href={`/stories/${story.slug}`}
                      className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Read Story</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Creator Leaderboard Table */}
      {isCreatorTab && (
        <div className="space-y-3">
          {rankedCreators.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-2xl">
              No creator rankings available yet.
            </div>
          ) : (
            rankedCreators.map((creator) => (
              <div
                key={creator.id}
                className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-xl bg-amber-700/10 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                    {creator.rank}
                  </span>

                  <div className="w-10 h-10 rounded-full bg-amber-700/15 text-amber-800 font-bold text-sm flex items-center justify-center shrink-0">
                    {creator.displayName.charAt(0).toUpperCase()}
                  </div>

                  <div className="space-y-0.5">
                    <Link
                      href={`/profile/${creator.username}`}
                      className="font-serif font-bold text-base text-[var(--foreground)] hover:underline"
                    >
                      {creator.displayName}
                    </Link>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      @{creator.username} • {creator.storiesCreated} Stories Planted • {creator.winningParagraphs} Paragraphs Won
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[var(--muted-foreground)] block">
                    Author Score
                  </span>
                  <span className="font-mono font-bold text-sm text-amber-700">
                    {creator.score}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
