import { RevenuePolicyType } from "@/types/database";

export interface RevenuePolicyConfig {
  policyType: RevenuePolicyType;
  creatorReservedPercentage?: number; // Policy C: e.g. 30
  openingParagraphWeight?: number; // Policy D: e.g. 2
  continuationParagraphWeight?: number; // Policy D: e.g. 1
  finalParagraphWeight?: number; // Policy D: e.g. 2
}

export interface AuthorShareResult {
  authorId: string;
  authorName?: string;
  allocatedCents: number;
  sharePercentage: number;
  paragraphCount?: number;
}

export interface GiftCalculation {
  grossPriceCents: number;
  creatorPoolCents: number;
  platformFeeCents: number;
}

/**
 * Calculate gift breakdown using basis points (integer arithmetic)
 */
export function calculateGiftSplit(
  priceCents: number,
  creatorShareBasisPoints = 7500, // 75.00%
  platformFeeBasisPoints = 2500   // 25.00%
): GiftCalculation {
  const creatorPoolCents = Math.floor((priceCents * creatorShareBasisPoints) / 10000);
  const platformFeeCents = priceCents - creatorPoolCents;

  return {
    grossPriceCents: priceCents,
    creatorPoolCents,
    platformFeeCents,
  };
}

/**
 * Calculates author shares given an integer creator pool and story segments
 */
export function calculateAuthorAllocations(
  poolCents: number,
  storyOwnerId: string,
  segments: { authorId: string; paragraphIndex: number }[],
  policy: RevenuePolicyConfig,
  maxParagraphs?: number
): AuthorShareResult[] {
  if (poolCents <= 0 || segments.length === 0) {
    return [];
  }

  // POLICY A: Equal Collaborators
  if (policy.policyType === "equal_collaborators") {
    const uniqueAuthorIds = Array.from(new Set(segments.map((s) => s.authorId)));
    const count = uniqueAuthorIds.length;
    const baseShare = Math.floor(poolCents / count);
    let remainder = poolCents - baseShare * count;

    return uniqueAuthorIds.map((authorId, index) => {
      // Allocate integer cents with residual distribution
      const allocatedCents = baseShare + (index < remainder ? 1 : 0);
      const sharePercentage = Number(((allocatedCents / poolCents) * 100).toFixed(2));
      return {
        authorId,
        allocatedCents,
        sharePercentage,
      };
    });
  }

  // POLICY B: Contribution Weighted (Proportional to accepted paragraphs)
  if (policy.policyType === "contribution_weighted") {
    const totalSegments = segments.length;
    const authorCounts = new Map<string, number>();

    segments.forEach((s) => {
      authorCounts.set(s.authorId, (authorCounts.get(s.authorId) || 0) + 1);
    });

    const results: AuthorShareResult[] = [];
    let allocatedSum = 0;
    const entries = Array.from(authorCounts.entries());

    entries.forEach(([authorId, count], idx) => {
      let allocatedCents: number;
      if (idx === entries.length - 1) {
        // Last author receives residual to ensure exact 100% sum
        allocatedCents = poolCents - allocatedSum;
      } else {
        allocatedCents = Math.floor((poolCents * count) / totalSegments);
        allocatedSum += allocatedCents;
      }

      results.push({
        authorId,
        allocatedCents,
        sharePercentage: Number(((allocatedCents / poolCents) * 100).toFixed(2)),
        paragraphCount: count,
      });
    });

    return results;
  }

  // POLICY C: Creator Reserved + Collaborators Pool
  if (policy.policyType === "creator_and_collaborators") {
    const reservedPercent = Math.min(100, Math.max(0, policy.creatorReservedPercentage ?? 30));
    const creatorReservedCents = Math.floor((poolCents * reservedPercent) / 100);
    const collaboratorPool = poolCents - creatorReservedCents;

    const continuationSegments = segments.filter((s) => s.paragraphIndex > 1);
    const authorCounts = new Map<string, number>();

    continuationSegments.forEach((s) => {
      authorCounts.set(s.authorId, (authorCounts.get(s.authorId) || 0) + 1);
    });

    // If no continuations yet, creator gets 100%
    if (authorCounts.size === 0) {
      return [
        {
          authorId: storyOwnerId,
          allocatedCents: poolCents,
          sharePercentage: 100,
        },
      ];
    }

    const totalContinuations = continuationSegments.length;
    const results: AuthorShareResult[] = [];
    let collabAllocatedSum = 0;
    const entries = Array.from(authorCounts.entries());

    entries.forEach(([authorId, count], idx) => {
      let collabShare: number;
      if (idx === entries.length - 1) {
        collabShare = collaboratorPool - collabAllocatedSum;
      } else {
        collabShare = Math.floor((collaboratorPool * count) / totalContinuations);
        collabAllocatedSum += collabShare;
      }

      const isOwner = authorId === storyOwnerId;
      const totalAllocated = collabShare + (isOwner ? creatorReservedCents : 0);

      results.push({
        authorId,
        allocatedCents: totalAllocated,
        sharePercentage: Number(((totalAllocated / poolCents) * 100).toFixed(2)),
        paragraphCount: count,
      });
    });

    // If owner didn't author any continuations, add their reserved share
    if (!authorCounts.has(storyOwnerId) && creatorReservedCents > 0) {
      results.unshift({
        authorId: storyOwnerId,
        allocatedCents: creatorReservedCents,
        sharePercentage: Number(((creatorReservedCents / poolCents) * 100).toFixed(2)),
        paragraphCount: 1, // Genesis
      });
    }

    return results;
  }

  // POLICY D: Weighted Paragraph Roles
  const openWeight = policy.openingParagraphWeight ?? 2;
  const contWeight = policy.continuationParagraphWeight ?? 1;
  const finalWeight = policy.finalParagraphWeight ?? 2;
  const lastIndex = maxParagraphs || Math.max(...segments.map((s) => s.paragraphIndex));

  const authorWeights = new Map<string, number>();
  let totalWeight = 0;

  segments.forEach((s) => {
    let w = contWeight;
    if (s.paragraphIndex === 1) w = openWeight;
    else if (s.paragraphIndex === lastIndex) w = finalWeight;

    authorWeights.set(s.authorId, (authorWeights.get(s.authorId) || 0) + w);
    totalWeight += w;
  });

  const results: AuthorShareResult[] = [];
  let allocatedSum = 0;
  const entries = Array.from(authorWeights.entries());

  entries.forEach(([authorId, weight], idx) => {
    let allocatedCents: number;
    if (idx === entries.length - 1) {
      allocatedCents = poolCents - allocatedSum;
    } else {
      allocatedCents = Math.floor((poolCents * weight) / totalWeight);
      allocatedSum += allocatedCents;
    }

    results.push({
      authorId,
      allocatedCents,
      sharePercentage: Number(((allocatedCents / poolCents) * 100).toFixed(2)),
    });
  });

  return results;
}
