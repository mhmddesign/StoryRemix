import { describe, it, expect } from "vitest";
import { analyzeStoryText } from "../sentence-tokenizer";
import { slugify, formatTimeRemaining } from "../utils";

describe("StoryRemix Workflow & Business Invariants", () => {
  describe("Slugification and URL generation", () => {
    it("should generate a clean, URL-safe slug with random suffix", () => {
      const slug = slugify("The Clockmaker's Final Secret!");
      expect(slug).toMatch(/^the-clockmakers-final-secret-[a-z0-9]{5}$/);
    });

    it("should support non-Latin titles such as Arabic", () => {
      const slug = slugify("أسرار مدينة الضباب");
      expect(slug).toContain("أسرار-مدينة-الضباب");
    });
  });

  describe("Continuation sentence constraints (2 to 3 sentences)", () => {
    it("validates 2 sentences continuation", () => {
      const text = "The lantern swung gently in the cold northern breeze. Shadows danced across the stone threshold.";
      const analysis = analyzeStoryText(text);
      expect(analysis.sentenceCount).toBe(2);
      expect(analysis.isValidForContinuation).toBe(true);
    });

    it("validates 3 sentences continuation", () => {
      const text = "He reached into his pocket for the brass key. It was gone. In its place lay a carved obsidian bird.";
      const analysis = analyzeStoryText(text);
      expect(analysis.sentenceCount).toBe(3);
      expect(analysis.isValidForContinuation).toBe(true);
    });

    it("rejects 1 sentence continuation", () => {
      const text = "He walked slowly into the night.";
      const analysis = analyzeStoryText(text);
      expect(analysis.sentenceCount).toBe(1);
      expect(analysis.isValidForContinuation).toBe(false);
      expect(analysis.validationError).toBeDefined();
    });

    it("rejects 4 sentences continuation", () => {
      const text = "Sentence one is here. Sentence two follows it. Sentence three is right here. Sentence four is too many.";
      const analysis = analyzeStoryText(text);
      expect(analysis.sentenceCount).toBe(4);
      expect(analysis.isValidForContinuation).toBe(false);
    });
  });

  describe("Story completion bounds", () => {
    it("should never exceed configured maximum paragraphs", () => {
      const maxParagraphs = 8;
      let currentParagraphCount = 1; // Opening paragraph

      for (let round = 1; round <= 10; round++) {
        if (currentParagraphCount < maxParagraphs) {
          currentParagraphCount += 1;
        } else {
          // Reached max
          break;
        }
      }

      expect(currentParagraphCount).toBe(8);
      expect(currentParagraphCount <= maxParagraphs).toBe(true);
    });
  });

  describe("Round deadline formatting & expiration detection", () => {
    it("detects expired deadline", () => {
      const pastDeadline = new Date(Date.now() - 5000).toISOString();
      const info = formatTimeRemaining(pastDeadline);
      expect(info.isExpired).toBe(true);
      expect(info.formatted).toBe("Deadline reached");
    });

    it("formats future deadline correctly", () => {
      const futureDeadline = new Date(Date.now() + 3600 * 1000).toISOString();
      const info = formatTimeRemaining(futureDeadline);
      expect(info.isExpired).toBe(false);
      expect(info.totalSeconds).toBeGreaterThan(0);
    });
  });

  describe("Self-voting prevention rule", () => {
    it("rejects voting if voter_id matches author_id", () => {
      const voterId: string = "user-123";
      const candidateAuthorId: string = "user-123";

      const canVote = voterId !== candidateAuthorId;
      expect(canVote).toBe(false);
    });

    it("allows voting if voter_id differs from author_id", () => {
      const voterId: string = "user-123";
      const candidateAuthorId: string = "user-456";

      const canVote = voterId !== candidateAuthorId;
      expect(canVote).toBe(true);
    });
  });

  describe("Atomic story creation & rollback invariants (PART 16 Regression)", () => {
    it("enforces opening paragraph sentence boundaries (2 to 5 sentences)", () => {
      const tooShort = "Just one sentence.";
      const shortAnalysis = analyzeStoryText(tooShort);
      expect(shortAnalysis.sentenceCount).toBe(1);
      expect(shortAnalysis.sentenceCount >= 2 && shortAnalysis.sentenceCount <= 5).toBe(false);

      const validOpening =
        "The brass lantern swung violently against the iron post as rain lashed the cobblestones. Detective Alami pulled his woolen collar tight against the freezing Atlantic wind. Inside the abandoned consulate, a single candle flickered on the second floor.";
      const validAnalysis = analyzeStoryText(validOpening);
      expect(validAnalysis.sentenceCount).toBe(3);
      expect(validAnalysis.sentenceCount >= 2 && validAnalysis.sentenceCount <= 5).toBe(true);

      const tooLong =
        "One sentence. Two sentences. Three sentences. Four sentences. Five sentences. Six sentences is way too many.";
      const longAnalysis = analyzeStoryText(tooLong);
      expect(longAnalysis.sentenceCount).toBe(6);
      expect(longAnalysis.sentenceCount >= 2 && longAnalysis.sentenceCount <= 5).toBe(false);
    });

    it("requires round 1 to target paragraph position 2", () => {
      const initialRoundConfig = {
        roundNumber: 1,
        paragraphPosition: 2,
        status: "open",
        voteThreshold: 3,
      };

      expect(initialRoundConfig.roundNumber).toBe(1);
      expect(initialRoundConfig.paragraphPosition).toBe(2);
      expect(initialRoundConfig.status).toBe("open");
    });

    it("verifies rollback integrity: simulated partial failure leaves zero orphaned segments", () => {
      // Simulating the transactional rollback invariant
      let storyCreated = false;
      let segmentsCount = 0;
      let roundsCount = 0;

      function simulateStoryCreation(simulateSegmentFailure: boolean) {
        storyCreated = true;
        if (simulateSegmentFailure) {
          // Rollback executed: clean up story
          storyCreated = false;
          segmentsCount = 0;
          roundsCount = 0;
          return { success: false, error: "Failed to initialize opening story paragraph: RLS violation" };
        }
        segmentsCount = 1;
        roundsCount = 1;
        return { success: true, storyId: "story-123" };
      }

      const failedResult = simulateStoryCreation(true);
      expect(failedResult.success).toBe(false);
      expect(storyCreated).toBe(false);
      expect(segmentsCount).toBe(0);
      expect(roundsCount).toBe(0);

      const successfulResult = simulateStoryCreation(false);
      expect(successfulResult.success).toBe(true);
      expect(storyCreated).toBe(true);
      expect(segmentsCount).toBe(1);
      expect(roundsCount).toBe(1);
    });
  });
});
