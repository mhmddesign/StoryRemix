import { LeaderboardCategory, LeaderboardPeriodType } from "@/types/database";

export interface RankedStoryItem {
  id: string;
  rank: number;
  title: string;
  slug: string;
  genre: string;
  language: string;
  currentParagraphCount: number;
  maxParagraphs: number;
  status: string;
  owner: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  score: number;
  uniqueContributors: number;
  votesCount: number;
  likesCount: number;
}

export interface RankedCreatorItem {
  id: string;
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  storiesCreated: number;
  winningParagraphs: number;
  uniqueCollaborators: number;
}

/**
 * Calculates time-decay 'Hot' score:
 * (votes * 3 + contributors * 5 + likes * 2) / ((hours + 2)^1.5)
 */
export function calculateHotScore(
  votes: number,
  uniqueContributors: number,
  likes: number,
  latestActivityDate: Date | string
): number {
  const now = Date.now();
  const activityTime = new Date(latestActivityDate).getTime();
  const diffHours = Math.max(0, (now - activityTime) / (1000 * 3600));

  const basePoints = votes * 3 + uniqueContributors * 5 + likes * 2;
  const gravity = Math.pow(diffHours + 2, 1.5);

  return Number((basePoints / gravity).toFixed(4));
}

/**
 * Calculates 'Trending' momentum score:
 * Focuses on velocity of recent contributions and active rounds
 */
export function calculateTrendingScore(
  recentVotes48h: number,
  recentContributors48h: number,
  recentLikes48h: number
): number {
  return Number((recentVotes48h * 4 + recentContributors48h * 6 + recentLikes48h * 2).toFixed(2));
}

/**
 * Determines exact UTC period boundaries
 */
export function getPeriodBoundaries(periodType: LeaderboardPeriodType): {
  periodStart: string;
  periodEnd: string;
} {
  const now = new Date();

  if (periodType === "today") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
    return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
  }

  if (periodType === "week") {
    const day = now.getUTCDay();
    const diff = (day + 6) % 7; // Monday = 0
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff + 6, 23, 59, 59));
    return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
  }

  if (periodType === "month") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
    return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
  }

  if (periodType === "year") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59));
    return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
  }

  // All time
  return {
    periodStart: new Date(Date.UTC(2025, 0, 1, 0, 0, 0)).toISOString(),
    periodEnd: new Date(Date.UTC(2099, 11, 31, 23, 59, 59)).toISOString(),
  };
}
