import {
  AIProvider,
  StoryModerationRequest,
  StoryModerationResult,
  ContinuationInspirationRequest,
  ContinuationSuggestion,
} from "./types";

/**
 * DisabledAIProvider
 *
 * Default implementation of AIProvider.
 * Makes zero external requests, transmits zero user data, and requires zero API keys.
 */
export class DisabledAIProvider implements AIProvider {
  public readonly name = "disabled";
  public readonly isEnabled = false;

  public async moderateText(
    _request: StoryModerationRequest
  ): Promise<StoryModerationResult> {
    // Default safe response without external API invocation
    return {
      isSafe: true,
      flaggedCategories: [],
      confidence: 1.0,
      reason: "Automated AI moderation is disabled; deferred to community reporting & rules engine.",
    };
  }

  public async generateInspiration(
    _request: ContinuationInspirationRequest
  ): Promise<ContinuationSuggestion | null> {
    return null;
  }
}
