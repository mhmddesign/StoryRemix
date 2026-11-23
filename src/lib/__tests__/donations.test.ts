import { describe, it, expect } from "vitest";
import {
  calculateDonationSplit,
  allocateCreatorPool,
  ContributorWeight,
} from "../donations";

describe("Donation System & 90/10 Revenue Split", () => {
  it("calculates exact 90/10 net revenue split with processor fee deduction", () => {
    // $10.00 gross donation
    const result = calculateDonationSplit(1000);

    // Fee: 1000 * 0.029 + 30 = 29 + 30 = 59 cents
    expect(result.grossCents).toBe(1000);
    expect(result.processorFeeCents).toBe(59);
    expect(result.netCents).toBe(941);

    // 90% of 941 = 846.9 -> floor = 846 cents
    expect(result.creatorPoolCents).toBe(846);
    // Platform fee = 941 - 846 = 95 cents
    expect(result.platformFeeCents).toBe(95);

    // Invariant: creatorPool + platformFee === netCents
    expect(result.creatorPoolCents + result.platformFeeCents).toBe(result.netCents);
  });

  it("handles minimum allowed donation ($1.00)", () => {
    const result = calculateDonationSplit(100);
    expect(result.grossCents).toBe(100);
    expect(result.creatorPoolCents + result.platformFeeCents).toBe(result.netCents);
  });

  it("rejects donation below minimum threshold", () => {
    expect(() => calculateDonationSplit(50)).toThrow("at least $1.00");
  });

  it("allocates equal collaborator split without losing single cents", () => {
    const contributors: ContributorWeight[] = [
      { userId: "user-1", weight: 1 },
      { userId: "user-2", weight: 1 },
      { userId: "user-3", weight: 1 },
    ];

    // 845 cents divided among 3 contributors
    // 845 / 3 = 281 with 2 remainder cents
    const allocations = allocateCreatorPool(845, contributors, "equal_collaborators");

    expect(allocations.length).toBe(3);
    expect(allocations[0].amountCents).toBe(282); // Gets 1 remainder cent
    expect(allocations[1].amountCents).toBe(282); // Gets 1 remainder cent
    expect(allocations[2].amountCents).toBe(281);

    const totalAllocated = allocations.reduce((sum, a) => sum + a.amountCents, 0);
    expect(totalAllocated).toBe(845);
  });

  it("allocates creator reserved percentage correctly", () => {
    const contributors: ContributorWeight[] = [
      { userId: "creator-id", weight: 1, isOriginalCreator: true },
      { userId: "coauthor-1", weight: 1 },
      { userId: "coauthor-2", weight: 1 },
    ];

    // 1000 cents creator pool, 30% reserved to creator = 300 cents
    // Remainder 700 cents divided equally among 2 coauthors = 350 each
    const allocations = allocateCreatorPool(
      1000,
      contributors,
      "creator_and_collaborators",
      30
    );

    const creatorAlloc = allocations.find((a) => a.userId === "creator-id");
    expect(creatorAlloc?.amountCents).toBe(300);

    const coauthor1 = allocations.find((a) => a.userId === "coauthor-1");
    const coauthor2 = allocations.find((a) => a.userId === "coauthor-2");
    expect(coauthor1?.amountCents).toBe(350);
    expect(coauthor2?.amountCents).toBe(350);

    const sum = allocations.reduce((s, a) => s + a.amountCents, 0);
    expect(sum).toBe(1000);
  });

  it("allocates contribution weighted split accurately", () => {
    const contributors: ContributorWeight[] = [
      { userId: "prolific-author", weight: 4 },
      { userId: "casual-author", weight: 1 },
    ];

    // Total weight = 5. Total cents = 500. Prolific gets 400, Casual gets 100.
    const allocations = allocateCreatorPool(500, contributors, "contribution_weighted");

    expect(allocations[0].amountCents).toBe(400);
    expect(allocations[1].amountCents).toBe(100);
    expect(allocations[0].amountCents + allocations[1].amountCents).toBe(500);
  });
});
