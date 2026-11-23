/**
 * StoryRemix Creator Economy: Voluntary Donations & Revenue Sharing
 *
 * Core Revenue Rules:
 * - 90% of Net Revenue flows directly into the Story Creator & Collaborator Pool.
 * - 10% Platform Fee sustains infrastructure, storage, and community operations.
 * - Net Revenue = Gross Amount - Payment Processor Fees (standard 2.9% + 30¢).
 * - All calculations are strictly executed in integer cents to eliminate floating-point drift.
 * - Absolute invariant: creatorPoolCents + platformFeeCents === netCents.
 * - Sum of individual contributor allocations === creatorPoolCents.
 */

export interface SplitCalculation {
  grossCents: number;
  processorFeeCents: number;
  netCents: number;
  creatorPoolCents: number;
  platformFeeCents: number;
  platformFeePercentage: number;
  creatorPoolPercentage: number;
}

export interface ContributorWeight {
  userId: string;
  weight: number;
  isOriginalCreator?: boolean;
}

export interface ContributorAllocation {
  userId: string;
  amountCents: number;
  percentage: number;
}

/**
 * Computes payment processor fee and splits net revenue 90% creator / 10% platform.
 * Gross amount must be >= 100 cents ($1.00 USD).
 */
export function calculateDonationSplit(grossCents: number): SplitCalculation {
  if (grossCents < 100) {
    throw new Error("Donation amount must be at least $1.00 (100 cents)");
  }

  // Standard processing fee: 2.9% + 30 cents
  const processorFeeCents = Math.min(
    Math.round(grossCents * 0.029 + 30),
    Math.floor(grossCents * 0.5) // Cap fee at 50% for tiny amounts
  );

  const netCents = Math.max(0, grossCents - processorFeeCents);
  const creatorPoolCents = Math.floor(netCents * 0.9);
  const platformFeeCents = netCents - creatorPoolCents;

  return {
    grossCents,
    processorFeeCents,
    netCents,
    creatorPoolCents,
    platformFeeCents,
    platformFeePercentage: 10,
    creatorPoolPercentage: 90,
  };
}

/**
 * Allocates the creator pool among story contributors according to the policy type.
 * Guarantees that the sum of allocations equals creatorPoolCents down to the exact single cent.
 */
export function allocateCreatorPool(
  creatorPoolCents: number,
  contributors: ContributorWeight[],
  policyType: "equal_collaborators" | "creator_and_collaborators" | "contribution_weighted" | "weighted_roles" = "equal_collaborators",
  creatorReservedPercentage = 30
): ContributorAllocation[] {
  if (contributors.length === 0 || creatorPoolCents <= 0) {
    return [];
  }

  // 1. Equal Collaborators: Divide evenly among all unique contributors
  if (policyType === "equal_collaborators") {
    const count = contributors.length;
    const baseShare = Math.floor(creatorPoolCents / count);
    let remainder = creatorPoolCents - baseShare * count;

    return contributors.map((c) => {
      let allocated = baseShare;
      if (remainder > 0) {
        allocated += 1;
        remainder -= 1;
      }
      return {
        userId: c.userId,
        amountCents: allocated,
        percentage: Number(((allocated / creatorPoolCents) * 100).toFixed(2)),
      };
    });
  }

  // 2. Creator Reserved + Equal Collaborators Pool
  if (policyType === "creator_and_collaborators") {
    const creator = contributors.find((c) => c.isOriginalCreator) || contributors[0];
    const otherContributors = contributors.filter((c) => c.userId !== creator.userId);

    const reservedPct = Math.min(Math.max(creatorReservedPercentage, 0), 100);
    const creatorReservedCents = Math.floor((creatorPoolCents * reservedPct) / 100);
    const poolForOthers = creatorPoolCents - creatorReservedCents;

    if (otherContributors.length === 0) {
      return [{
        userId: creator.userId,
        amountCents: creatorPoolCents,
        percentage: 100,
      }];
    }

    const baseShare = Math.floor(poolForOthers / otherContributors.length);
    let remainder = poolForOthers - baseShare * otherContributors.length;

    const allocations: ContributorAllocation[] = otherContributors.map((c) => {
      let allocated = baseShare;
      if (remainder > 0) {
        allocated += 1;
        remainder -= 1;
      }
      return {
        userId: c.userId,
        amountCents: allocated,
        percentage: Number(((allocated / creatorPoolCents) * 100).toFixed(2)),
      };
    });

    // Creator receives reserved portion
    allocations.unshift({
      userId: creator.userId,
      amountCents: creatorReservedCents,
      percentage: Number(((creatorReservedCents / creatorPoolCents) * 100).toFixed(2)),
    });

    return allocations;
  }

  // 3. Weighted Proportional (contribution_weighted or weighted_roles)
  const totalWeight = contributors.reduce((sum, c) => sum + Math.max(c.weight, 1), 0);
  let allocatedSum = 0;

  const baseAllocations = contributors.map((c) => {
    const effectiveWeight = Math.max(c.weight, 1);
    const share = Math.floor((creatorPoolCents * effectiveWeight) / totalWeight);
    allocatedSum += share;
    return {
      userId: c.userId,
      amountCents: share,
      percentage: Number(((share / creatorPoolCents) * 100).toFixed(2)),
    };
  });

  // Distribute any remainder single cents to contributors with highest weights
  let remainder = creatorPoolCents - allocatedSum;
  let idx = 0;
  while (remainder > 0 && idx < baseAllocations.length) {
    baseAllocations[idx].amountCents += 1;
    baseAllocations[idx].percentage = Number(
      ((baseAllocations[idx].amountCents / creatorPoolCents) * 100).toFixed(2)
    );
    remainder -= 1;
    idx += 1;
  }

  return baseAllocations;
}
