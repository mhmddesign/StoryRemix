import { describe, it, expect } from "vitest";
import { analyzeStoryText, segmentSentences } from "../sentence-tokenizer";

describe("Multilingual Sentence Tokenizer", () => {
  describe("English sentences and abbreviations", () => {
    it("should correctly identify two simple sentences", () => {
      const text = "The rain was falling heavily upon the cobblestones. She pulled her woolen cloak tighter.";
      const res = analyzeStoryText(text);

      expect(res.sentenceCount).toBe(2);
      expect(res.isValidForContinuation).toBe(true);
      expect(res.validationError).toBeNull();
    });

    it("should correctly identify three sentences", () => {
      const text = "He knocked three times on the weathered oak door. Silence answered from within. With trembling hands, he turned the brass handle.";
      const res = analyzeStoryText(text);

      expect(res.sentenceCount).toBe(3);
      expect(res.isValidForContinuation).toBe(true);
      expect(res.validationError).toBeNull();
    });

    it("should NOT split on abbreviations like Dr. or Mr.", () => {
      const text = "Dr. Watson examined the peculiar artifact on Mr. Holmes' desk. Neither man spoke for several long moments.";
      const sentences = segmentSentences(text);

      expect(sentences.length).toBe(2);
      expect(sentences[0]).toContain("Dr. Watson");
      expect(sentences[0]).toContain("Mr. Holmes");
      
      const analysis = analyzeStoryText(text);
      expect(analysis.sentenceCount).toBe(2);
      expect(analysis.isValidForContinuation).toBe(true);
    });

    it("should handle ellipsis without false splits", () => {
      const text = "He paused to listen... nothing moved. Then the candle flickered out.";
      const sentences = segmentSentences(text);

      expect(sentences.length).toBe(2);
    });

    it("should not split decimal numbers", () => {
      const text = "The gauge indicated 98.6 degrees in the chamber. She knew they had only minutes left.";
      const sentences = segmentSentences(text);

      expect(sentences.length).toBe(2);
      expect(sentences[0]).toContain("98.6");
    });
  });

  describe("French sentences and punctuation", () => {
    it("should parse French sentences with dialogue quotes", () => {
      const text = "« Nous ne pouvons plus attendre », murmura M. Dupont avec anxiété. La cloche de la cathédrale sonna minuit.";
      const res = analyzeStoryText(text);

      expect(res.sentenceCount).toBe(2);
      expect(res.isValidForContinuation).toBe(true);
    });
  });

  describe("Arabic sentences and Arabic punctuation", () => {
    it("should parse Arabic sentences with Arabic question marks (؟) and periods", () => {
      const text = "هل كان هذا هو الطريق المؤدي إلى المكتبة القديمة؟ توقف طارق ونظر حوله بتردد. ثم قرر المضي قدماً نحو الباب الخشبي.";
      const res = analyzeStoryText(text);

      expect(res.sentenceCount).toBe(3);
      expect(res.isValidForContinuation).toBe(true);
      expect(res.validationError).toBeNull();
    });
  });

  describe("Continuation rule validation (2 to 3 sentences)", () => {
    it("should reject 1 sentence as insufficient for a continuation", () => {
      const text = "Only a single sentence was written here.";
      const res = analyzeStoryText(text);

      expect(res.sentenceCount).toBe(1);
      expect(res.isValidForContinuation).toBe(false);
      expect(res.validationError).toContain("Contains 1 sentence. Please write 2 to 3 sentences.");
    });

    it("should reject 4 sentences as exceeding limit", () => {
      const text = "First sentence is here. Second sentence follows. Third sentence goes here. Fourth sentence is one too many!";
      const res = analyzeStoryText(text);

      expect(res.sentenceCount).toBe(4);
      expect(res.isValidForContinuation).toBe(false);
      expect(res.validationError).toContain("Limit is 3 sentences maximum");
    });
  });
});
