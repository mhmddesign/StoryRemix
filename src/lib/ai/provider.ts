import { AIProvider } from "./types";
import { DisabledAIProvider } from "./disabled-provider";

let providerInstance: AIProvider | null = null;

/**
 * Returns the configured server-side AI provider singleton.
 * By default, returns DisabledAIProvider.
 */
export function getAIProvider(): AIProvider {
  if (providerInstance) {
    return providerInstance;
  }

  const isEnabled = process.env.AI_PROVIDER_ENABLED === "true";
  const apiKey = process.env.AI_PROVIDER_API_KEY;

  if (isEnabled && apiKey) {
    // When enabled with proper API credentials, provider can be initialized.
    // For MVP security and zero unexpected external leakage, we default safely.
    providerInstance = new DisabledAIProvider();
  } else {
    providerInstance = new DisabledAIProvider();
  }

  return providerInstance;
}
