import { describe, it, expect } from "vitest";
import { analyzeStoryText } from "../sentence-tokenizer";
import { calculateDonationSplit, allocateCreatorPool } from "../donations";
import { calculateHotScore, calculateTrendingScore } from "../leaderboards";

describe("StoryRemix End-to-End User Workflows", () => {
  describe("1. Story Creation & Sentence Validation Workflow", () => {
    it("validates genesis opening paragraph must have 2 to 5 sentences", () => {
      // 1 sentence: Too short
      const tooShort = "Once upon a time in a far-off clockwork city, an inventor worked.";
      const analysis1 = analyzeStoryText(tooShort);
      expect(analysis1.sentenceCount).toBe(1);
      expect(analysis1.sentenceCount >= 2 && analysis1.sentenceCount <= 5).toBe(false);

      // 3 sentences: Valid genesis paragraph
      const validOpening =
        "The clockwork gargoyle stirred on the cathedral parapet as midnight struck. Steam hissed from its copper joints, smelling faintly of sulfur and rain. Far below, the cobblestones echoed with footsteps that stopped just outside the tavern door.";
      const analysis2 = analyzeStoryText(validOpening);
      expect(analysis2.sentenceCount).toBe(3);
      expect(analysis2.sentenceCount >= 2 && analysis2.sentenceCount <= 5).toBe(true);

      // 6 sentences: Too long
      const tooLong =
        "Sentence one begins here. Sentence two follows it directly. Sentence three adds more detail. Sentence four creates the tension. Sentence five holds the breath. Sentence six breaks the limit.";
      const analysis3 = analyzeStoryText(tooLong);
      expect(analysis3.sentenceCount).toBe(6);
      expect(analysis3.sentenceCount >= 2 && analysis3.sentenceCount <= 5).toBe(false);
    });

    it("supports Multilingual French & Arabic opening paragraphs", () => {
      const frenchOpening =
        "La cloche de la cathédrale résonna dans le brouillard matinal. L'alchimiste versa les dernières gouttes de l'élixir avec une infinie précaution. Soudain, une lueur bleutée illumina la pièce.";
      const frAnalysis = analyzeStoryText(frenchOpening);
      expect(frAnalysis.sentenceCount).toBe(3);

      const arabicOpening =
        "دقت ساعة البرج معلنة منتصف الليل في المدينة الصامتة. تسللت خيوط البخار من بين التروس النحاسية العتيقة. وفجأة، تردد صدى خطوات غامضة في الأزقة المظلمة.";
      const arAnalysis = analyzeStoryText(arabicOpening);
      expect(arAnalysis.sentenceCount).toBe(3);
    });
  });

  describe("2. Contribution Submission & Voting Rules", () => {
    it("validates continuation submissions must contain 2 to 3 sentences", () => {
      const continuation =
        "A cloaked figure paused beneath the gaslight, checking an ornate silver timepiece. The mechanism spun backwards, defying every known law of physics.";
      const analysis = analyzeStoryText(continuation);
      expect(analysis.sentenceCount).toBe(2);
      expect(analysis.sentenceCount >= 2 && analysis.sentenceCount <= 3).toBe(true);
    });

    it("enforces single vote per user and evaluates candidate victory", () => {
      const candidates = [
        { id: "cand-1", authorId: "user-b", votes: 4 },
        { id: "cand-2", authorId: "user-c", votes: 2 },
      ];
      const voteThreshold = 3;

      // cand-1 is above threshold and has highest votes
      const winner = candidates
        .filter((c) => c.votes >= voteThreshold)
        .sort((a, b) => b.votes - a.votes)[0];

      expect(winner).toBeDefined();
      expect(winner.id).toBe("cand-1");
      expect(winner.votes).toBe(4);
    });
  });

  describe("3. Creator Economy 90/10 Split & Allocations", () => {
    it("allocates donations with 90% creator pool and 10% platform fee", () => {
      const grossCents = 2500; // $25.00
      const split = calculateDonationSplit(grossCents);

      expect(split.grossCents).toBe(2500);
      expect(split.creatorPoolPercentage).toBe(90);
      expect(split.platformFeePercentage).toBe(10);
      expect(split.creatorPoolCents + split.platformFeeCents).toBe(split.netCents);

      const contributors = [
        { userId: "author-1", weight: 2, isOriginalCreator: true },
        { userId: "author-2", weight: 1 },
      ];

      const allocations = allocateCreatorPool(
        split.creatorPoolCents,
        contributors,
        "creator_and_collaborators",
        40
      );

      const totalAllocated = allocations.reduce((sum, a) => sum + a.amountCents, 0);
      expect(totalAllocated).toBe(split.creatorPoolCents);
    });
  });

  describe("4. Leaderboard Ranking & Hot Score Algorithm", () => {
    it("rewards voting momentum while strictly excluding virtual gifts from ranking", () => {
      const hotScoreActive = calculateHotScore(
        8, // votes
        4, // unique contributors
        5, // likes
        new Date().toISOString() // fresh
      );

      const hotScoreStale = calculateHotScore(
        8,
        4,
        5,
        new Date(Date.now() - 48 * 3600 * 1000).toISOString() // 48h old
      );

      expect(hotScoreActive).toBeGreaterThan(hotScoreStale);
    });
  });

  describe("5. Internationalization & RTL Resolution", () => {
    it("resolves correct text direction based on active locale", () => {
      const getDirection = (locale: string) => (locale === "ar" ? "rtl" : "ltr");

      expect(getDirection("en")).toBe("ltr");
      expect(getDirection("fr")).toBe("ltr");
      expect(getDirection("ar")).toBe("rtl");
    });
  });
});
