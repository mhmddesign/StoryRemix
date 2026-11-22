import { describe, it, expect } from "vitest";
import {
  calculateLevel,
  LEVELS,
  XP_CONFIG,
  evaluateCommunityArchetype,
} from "@/lib/gamification";
import {
  calculateGiftSplit,
  calculateAuthorAllocations,
  RevenuePolicyConfig,
} from "@/lib/revenue-sharing";
import {
  calculateHotScore,
  calculateTrendingScore,
  getPeriodBoundaries,
} from "@/lib/leaderboards";

describe("Gamification System", () => {
  describe("calculateLevel", () => {
    it("assigns Level 1 (Newcomer) for 0 XP", () => {
      const result = calculateLevel(0);
      expect(result.level).toBe(1);
      expect(result.title).toBe("Newcomer");
      expect(result.nextLevelXp).toBe(100);
      expect(result.progressPercent).toBe(0);
    });

    it("calculates correct intermediate progress within a level", () => {
      // Level 2 starts at 100 XP, Level 3 starts at 250 XP (span = 150)
      // At 175 XP, gained = 75 => 75 / 150 = 50%
      const result = calculateLevel(175);
      expect(result.level).toBe(2);
      expect(result.title).toBe("Scribbler");
      expect(result.nextLevelXp).toBe(250);
      expect(result.progressPercent).toBe(50);
    });

    it("reaches Level 10 (Living Legend) at 7200 XP and caps at 100%", () => {
      const result = calculateLevel(7200);
      expect(result.level).toBe(10);
      expect(result.title).toBe("Living Legend");
      expect(result.nextLevelXp).toBeNull();
      expect(result.progressPercent).toBe(100);

      // Above 7200 XP remains Level 10
      const overflow = calculateLevel(15000);
      expect(overflow.level).toBe(10);
      expect(overflow.progressPercent).toBe(100);
    });

    it("has 10 monotonic level thresholds", () => {
      expect(LEVELS).toHaveLength(10);
      for (let i = 1; i < LEVELS.length; i++) {
        expect(LEVELS[i].xpRequired).toBeGreaterThan(LEVELS[i - 1].xpRequired);
        expect(LEVELS[i].level).toBe(LEVELS[i - 1].level + 1);
      }
    });
  });

  describe("evaluateCommunityArchetype", () => {
    it("identifies Master Architect when original stories dominate", () => {
      const archetype = evaluateCommunityArchetype({
        storiesCreated: 15,
        continuationsSubmitted: 3,
        votesCast: 2,
        remixesCreated: 0,
      });
      expect(archetype).toBe("Master Architect");
    });

    it("identifies Ensemble Virtuoso when continuations dominate", () => {
      const archetype = evaluateCommunityArchetype({
        storiesCreated: 1,
        continuationsSubmitted: 25,
        votesCast: 5,
        remixesCreated: 0,
      });
      expect(archetype).toBe("Ensemble Virtuoso");
    });

    it("identifies Discerning Critic when votes dominate", () => {
      const archetype = evaluateCommunityArchetype({
        storiesCreated: 0,
        continuationsSubmitted: 1,
        votesCast: 40,
        remixesCreated: 0,
      });
      expect(archetype).toBe("Discerning Critic");
    });

    it("identifies Multiverse Weaver when remixes are prominent", () => {
      const archetype = evaluateCommunityArchetype({
        storiesCreated: 1,
        continuationsSubmitted: 2,
        votesCast: 5,
        remixesCreated: 4,
      });
      expect(archetype).toBe("Multiverse Weaver");
    });

    it("defaults to Emerging Scribe for beginning accounts", () => {
      const archetype = evaluateCommunityArchetype({
        storiesCreated: 0,
        continuationsSubmitted: 0,
        votesCast: 1,
        remixesCreated: 0,
      });
      expect(archetype).toBe("Emerging Scribe");
    });
  });
});

describe("Creator Economy & Revenue Sharing", () => {
  describe("calculateGiftSplit", () => {
    it("correctly splits gross cents with 75% creator pool and 25% platform fee", () => {
      const split100 = calculateGiftSplit(100); // $1.00
      expect(split100.creatorPoolCents).toBe(75);
      expect(split100.platformFeeCents).toBe(25);
      expect(split100.creatorPoolCents + split100.platformFeeCents).toBe(100);

      // Odd amounts: 499 cents ($4.99)
      const split499 = calculateGiftSplit(499);
      // Math.floor(499 * 0.75) = Math.floor(374.25) = 374
      expect(split499.creatorPoolCents).toBe(374);
      expect(split499.platformFeeCents).toBe(125);
      expect(split499.creatorPoolCents + split499.platformFeeCents).toBe(499);

      // Micro amount: 50 cents
      const split50 = calculateGiftSplit(50);
      expect(split50.creatorPoolCents + split50.platformFeeCents).toBe(50);
    });
  });

  describe("calculateAuthorAllocations - Invariant: Sum of Allocations equals Pool", () => {
    const authors = ["user-creator", "user-writer-1", "user-writer-2"];

    it("Policy A (Equal Collaborators): splits integer cents with residual distribution", () => {
      const policy: RevenuePolicyConfig = { policyType: "equal_collaborators" };
      const poolCents = 1000; // $10.00 split among 3 unique authors
      const segments = [
        { authorId: "user-creator", paragraphIndex: 1 },
        { authorId: "user-writer-1", paragraphIndex: 2 },
        { authorId: "user-writer-2", paragraphIndex: 3 },
      ];

      const allocations = calculateAuthorAllocations(poolCents, "user-creator", segments, policy);
      expect(allocations).toHaveLength(3);

      const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedCents, 0);
      expect(totalAllocated).toBe(poolCents);

      // 1000 / 3 = 333 remainder 1 => first author gets 334, others get 333
      expect(allocations[0].allocatedCents).toBe(334);
      expect(allocations[1].allocatedCents).toBe(333);
      expect(allocations[2].allocatedCents).toBe(333);
    });

    it("Policy B (Contribution-Weighted): splits proportionally to paragraph count", () => {
      const policy: RevenuePolicyConfig = { policyType: "contribution_weighted" };
      const poolCents = 1000; // $10.00
      // 5 paragraphs: author A wrote 3 (60%), author B wrote 2 (40%)
      const segments = [
        { authorId: "user-creator", paragraphIndex: 1 },
        { authorId: "user-creator", paragraphIndex: 2 },
        { authorId: "user-creator", paragraphIndex: 3 },
        { authorId: "user-writer-1", paragraphIndex: 4 },
        { authorId: "user-writer-1", paragraphIndex: 5 },
      ];

      const allocations = calculateAuthorAllocations(poolCents, "user-creator", segments, policy);
      const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedCents, 0);
      expect(totalAllocated).toBe(poolCents);

      const creator = allocations.find((a) => a.authorId === "user-creator")!;
      const writer = allocations.find((a) => a.authorId === "user-writer-1")!;

      expect(creator.allocatedCents).toBe(600);
      expect(writer.allocatedCents).toBe(400);
    });

    it("Policy C (Creator Reserved + Collaborators Pool): guarantees creator baseline plus collaboration shares", () => {
      const policy: RevenuePolicyConfig = {
        policyType: "creator_and_collaborators",
        creatorReservedPercentage: 30, // 30% reserved for original creator
      };
      const poolCents = 1000; // $10.00
      // Paragraph 1: creator
      // Paragraph 2: writer-1
      // Paragraph 3: writer-2
      const segments = [
        { authorId: "user-creator", paragraphIndex: 1 },
        { authorId: "user-writer-1", paragraphIndex: 2 },
        { authorId: "user-writer-2", paragraphIndex: 3 },
      ];

      const allocations = calculateAuthorAllocations(poolCents, "user-creator", segments, policy);
      const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedCents, 0);
      expect(totalAllocated).toBe(poolCents);

      // Creator gets 300 cents reserved
      // Remaining 700 cents split between 2 continuations: 350 each
      const creator = allocations.find((a) => a.authorId === "user-creator")!;
      const writer1 = allocations.find((a) => a.authorId === "user-writer-1")!;
      const writer2 = allocations.find((a) => a.authorId === "user-writer-2")!;

      expect(creator.allocatedCents).toBe(300);
      expect(writer1.allocatedCents).toBe(350);
      expect(writer2.allocatedCents).toBe(350);
    });

    it("Policy D (Weighted Roles): weights genesis (2x), middle (1x), and climax (2x)", () => {
      const policy: RevenuePolicyConfig = {
        policyType: "weighted_roles",
        openingParagraphWeight: 2,
        continuationParagraphWeight: 1,
        finalParagraphWeight: 2,
      };
      const poolCents = 1000;
      // 3 paragraphs: P1 (weight 2), P2 (weight 1), P3 (weight 2, final)
      // Total weight = 5.
      // Creator: 2/5 * 1000 = 400
      // Writer-1: 1/5 * 1000 = 200
      // Writer-2: 2/5 * 1000 = 400
      const segments = [
        { authorId: "user-creator", paragraphIndex: 1 },
        { authorId: "user-writer-1", paragraphIndex: 2 },
        { authorId: "user-writer-2", paragraphIndex: 3 },
      ];

      const allocations = calculateAuthorAllocations(poolCents, "user-creator", segments, policy, 3);
      const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedCents, 0);
      expect(totalAllocated).toBe(poolCents);

      const creator = allocations.find((a) => a.authorId === "user-creator")!;
      const writer1 = allocations.find((a) => a.authorId === "user-writer-1")!;
      const writer2 = allocations.find((a) => a.authorId === "user-writer-2")!;

      expect(creator.allocatedCents).toBe(400);
      expect(writer1.allocatedCents).toBe(200);
      expect(writer2.allocatedCents).toBe(400);
    });

    it("returns empty array when poolCents is 0 or segments is empty", () => {
      const policy: RevenuePolicyConfig = { policyType: "equal_collaborators" };
      expect(calculateAuthorAllocations(0, "creator", [], policy)).toEqual([]);
      expect(calculateAuthorAllocations(100, "creator", [], policy)).toEqual([]);
    });
  });
});

describe("Leaderboards & Anti-Pay-to-Win Boundary", () => {
  describe("calculateHotScore", () => {
    it("decays over time via gravity formula", () => {
      const now = new Date();
      const freshScore = calculateHotScore(10, 3, 5, now);

      const fourHoursAgo = new Date(Date.now() - 4 * 3600 * 1000);
      const decayedScore = calculateHotScore(10, 3, 5, fourHoursAgo);

      expect(freshScore).toBeGreaterThan(decayedScore);
    });
  });

  describe("calculateTrendingScore", () => {
    it("weights recent votes and unique contributors heavily", () => {
      const highMomentum = calculateTrendingScore(20, 10, 5);
      const lowMomentum = calculateTrendingScore(2, 1, 0);
      expect(highMomentum).toBeGreaterThan(lowMomentum);
    });
  });

  describe("getPeriodBoundaries", () => {
    it("produces valid UTC ISO strings for periods", () => {
      const today = getPeriodBoundaries("today");
      expect(new Date(today.periodStart).getTime()).toBeLessThan(new Date(today.periodEnd).getTime());

      const week = getPeriodBoundaries("week");
      expect(new Date(week.periodStart).getTime()).toBeLessThan(new Date(week.periodEnd).getTime());

      const month = getPeriodBoundaries("month");
      expect(new Date(month.periodStart).getTime()).toBeLessThan(new Date(month.periodEnd).getTime());
    });
  });
});
