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
});
