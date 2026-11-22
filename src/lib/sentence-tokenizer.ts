/**
 * Multilingual Sentence Tokenizer for StoryRemix
 * Supports English, French, and Arabic sentence boundaries, abbreviations,
 * and punctuation conventions without naive regex period splitting.
 */

const COMMON_ABBREVIATIONS = new Set([
  // English
  "mr.", "mrs.", "ms.", "dr.", "prof.", "sr.", "jr.", "vs.", "etc.", "e.g.", "i.e.",
  "gen.", "rep.", "sen.", "st.", "approx.", "dept.", "est.", "fig.", "inc.", "ltd.", "no.",
  // French
  "m.", "mme.", "mlle.", "prof.", "dr.", "av.", "bd.", "c.-à-d.", "etc.",
  // Arabic transliterations & Latin prefixes
  "p.ex."
]);

export interface SentenceAnalysis {
  sentences: string[];
  sentenceCount: number;
  wordCount: number;
  characterCount: number;
  isValidForContinuation: boolean; // 2 to 3 sentences
  validationError: string | null;
}

export function analyzeStoryText(text: string): SentenceAnalysis {
  const trimmed = text.trim();
  const characterCount = trimmed.length;

  if (characterCount === 0) {
    return {
      sentences: [],
      sentenceCount: 0,
      wordCount: 0,
      characterCount: 0,
      isValidForContinuation: false,
      validationError: "Text cannot be empty.",
    };
  }

  // Tokenize words
  // Match words in Latin, Cyrillic, Arabic (\u0600-\u06FF) and Arabic supplement
  const words = trimmed.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || [];
  const wordCount = words.length;

  // Split into sentences using boundary heuristics
  const rawSentences = segmentSentences(trimmed);
  const sentences = rawSentences.filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;

  let validationError: string | null = null;
  if (sentenceCount < 2) {
    validationError = `Contains ${sentenceCount} sentence. Please write 2 to 3 sentences.`;
  } else if (sentenceCount > 3) {
    validationError = `Contains ${sentenceCount} sentences. Limit is 3 sentences maximum.`;
  } else if (characterCount < 20) {
    validationError = "Text is too brief. Please write at least 20 characters.";
  } else if (characterCount > 1500) {
    validationError = "Text exceeds the 1500 character limit.";
  }

  return {
    sentences,
    sentenceCount,
    wordCount,
    characterCount,
    isValidForContinuation: validationError === null,
    validationError,
  };
}

/**
 * Intelligent boundary segmentation respecting:
 * - English/French punctuation: . ! ?
 * - Arabic punctuation: . ! ؟ (Arabic question mark: \u061F)
 * - Ellipsis: ... or \u2026
 * - Abbreviations (e.g., Dr., Mr., etc.)
 * - Decimal numbers (e.g. 4.5, 10.0)
 * - Quotes & dialogue closers (", », ’, ”)
 */
export function segmentSentences(text: string): string[] {
  if (!text.trim()) return [];

  // Protect abbreviations and decimals with non-breaking placeholders
  let masked = text;

  // 1. Mask decimal numbers: e.g. 3.14 -> 3§§DOT§§14
  masked = masked.replace(/(\d)\.(\d)/g, "$1§§DOT§§$2");

  // 2. Mask known abbreviations
  COMMON_ABBREVIATIONS.forEach(abbr => {
    // Escape regex characters
    const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}`, "gi");
    masked = masked.replace(regex, (match) => match.replace(/\./g, "§§DOT§§"));
  });

  // 3. Mask ellipsis (... or …) so three dots don't count as 3 sentences
  masked = masked.replace(/\.{3}/g, "§§ELLIP§§");
  masked = masked.replace(/\u2026/g, "§§ELLIP§§");

  // 4. Split on sentence boundaries:
  // Terminals: [.!?\u061F] followed by optional closing quotes ["'»”’)] and then whitespace or end of string
  const boundaryRegex = /([.!?\u061F]+["'»”’)]*)\s+/gu;
  
  const result: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boundaryRegex.exec(masked)) !== null) {
    const endOfSentence = match.index + match[1].length;
    const sentence = masked.slice(lastIndex, endOfSentence);
    result.push(restoreMasks(sentence));
    lastIndex = boundaryRegex.lastIndex;
  }

  // Add the remainder
  if (lastIndex < masked.length) {
    const remainder = masked.slice(lastIndex);
    if (remainder.trim()) {
      result.push(restoreMasks(remainder));
    }
  }

  return result.map(s => s.trim()).filter(s => s.length > 0);
}

function restoreMasks(str: string): string {
  return str
    .replace(/§§DOT§§/g, ".")
    .replace(/§§ELLIP§§/g, "...");
}
