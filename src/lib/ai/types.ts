/**
 * StoryRemix Private Server-Side AI Abstraction Types
 *
 * Privacy Guarantees:
 * - This layer is exclusively server-side.
 * - Absolutely NO client-side exposure.
 * - Absolutely NO user story or contribution text is transmitted externally unless explicitly enabled.
 * - Defaults to DisabledAIProvider (zero network requests).
 */

export interface StoryModerationRequest {
  text: string;
  language: string;
  context?: string;
}

export interface StoryModerationResult {
  isSafe: boolean;
  flaggedCategories: string[];
  confidence: number;
  reason?: string;
}

export interface ContinuationInspirationRequest {
  genre: string;
  premise: string;
  previousSegments: string[];
}

export interface ContinuationSuggestion {
  promptIdea: string;
  themes: string[];
}

export interface AIProvider {
  readonly name: string;
  readonly isEnabled: boolean;

  /**
   * Evaluates text safety for severe policy violations (hate speech, self-harm, explicit illegal content).
   */
  moderateText(request: StoryModerationRequest): Promise<StoryModerationResult>;

  /**
   * Generates optional creative writing prompts or themes for writers experiencing writer's block.
   */
  generateInspiration(request: ContinuationInspirationRequest): Promise<ContinuationSuggestion | null>;
}
