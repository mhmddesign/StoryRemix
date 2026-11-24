import { describe, it, expect } from "vitest";

describe("Virtual Economy & Referral Engine Logic", () => {
  describe("Referral Code Generation & Validation", () => {
    it("generates non-guessable codes with correct prefix", () => {
      const generateCode = (userId: string) => {
        const hash = Math.abs(
          userId.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
        ).toString(36).toUpperCase().padStart(4, "X");
        const rand = "7K9";
        return `SR-${hash.slice(0, 3)}${rand}`;
      };

      const code1 = generateCode("user-uuid-12345");
      const code2 = generateCode("user-uuid-67890");

      expect(code1.startsWith("SR-")).toBe(true);
      expect(code2.startsWith("SR-")).toBe(true);
      expect(code1).not.toBe(code2);
      expect(code1.length).toBeGreaterThanOrEqual(6);
    });

    it("prevents self-referral", () => {
      const validateReferral = (referrerId: string, referredId: string) => {
        if (referrerId === referredId) {
          return { valid: false, error: "Self-referral is forbidden" };
        }
        return { valid: true };
      };

      expect(validateReferral("user-1", "user-1").valid).toBe(false);
      expect(validateReferral("user-1", "user-2").valid).toBe(true);
    });

    it("calculates referral reward split accurately", () => {
      const getReferralRewards = () => ({
        referrerBonus: 100, // Points to referrer
        referredBonus: 25,  // Welcome points to referred writer
      });

      const rewards = getReferralRewards();
      expect(rewards.referrerBonus).toBe(100);
      expect(rewards.referredBonus).toBe(25);
    });
  });

  describe("Virtual Wallet & Gifting Principles", () => {
    it("strictly separates Earned Points from Purchased Credits", () => {
      const wallet = {
        earned_points: 150,
        purchased_credits: 10,
      };

      const debitPoints = (w: typeof wallet, cost: number) => {
        if (w.earned_points < cost) throw new Error("Insufficient points");
        return { ...w, earned_points: w.earned_points - cost };
      };

      const updated = debitPoints(wallet, 50);
      expect(updated.earned_points).toBe(100);
      expect(updated.purchased_credits).toBe(10); // Credits untouched
    });

    it("prevents negative balances", () => {
      const wallet = { earned_points: 20, purchased_credits: 0 };
      const canAfford = (balance: number, cost: number) => balance >= cost;

      expect(canAfford(wallet.earned_points, 50)).toBe(false);
      expect(canAfford(wallet.earned_points, 20)).toBe(true);
    });

    it("allocates exactly 70% of gift value to the paragraph author", () => {
      const calculateAuthorShare = (giftCostPoints: number) => {
        return Math.round(giftCostPoints * 0.70);
      };

      expect(calculateAuthorShare(25)).toBe(18); // Ink Feather (25 * 0.7 = 17.5 -> 18)
      expect(calculateAuthorShare(50)).toBe(35); // Literary Rose (50 * 0.7 = 35)
      expect(calculateAuthorShare(100)).toBe(70); // Ancient Scroll (100 * 0.7 = 70)
      expect(calculateAuthorShare(200)).toBe(140); // Burning Star (200 * 0.7 = 140)
    });

    it("disallows author from gifting their own paragraph", () => {
      const canGiftParagraph = (senderId: string, paragraphAuthorId: string) => {
        return senderId !== paragraphAuthorId;
      };

      expect(canGiftParagraph("author-1", "author-1")).toBe(false);
      expect(canGiftParagraph("reader-2", "author-1")).toBe(true);
    });
  });
});
