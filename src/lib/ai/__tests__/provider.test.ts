import { describe, it, expect } from "vitest";
import { getAIProvider } from "../provider";
import { DisabledAIProvider } from "../disabled-provider";

describe("AI Provider Server-Side Abstraction", () => {
  it("defaults to DisabledAIProvider when AI_PROVIDER_ENABLED is not set", () => {
    const provider = getAIProvider();
    expect(provider).toBeInstanceOf(DisabledAIProvider);
    expect(provider.isEnabled).toBe(false);
    expect(provider.name).toBe("disabled");
  });

  it("moderates text safely without throwing or making external calls", async () => {
    const provider = getAIProvider();
    const result = await provider.moderateText({
      text: "The adventurer approached the dark castle.",
      language: "en",
    });

    expect(result.isSafe).toBe(true);
    expect(result.flaggedCategories).toEqual([]);
    expect(result.confidence).toBe(1.0);
  });

  it("returns null for inspiration without throwing", async () => {
    const provider = getAIProvider();
    const suggestion = await provider.generateInspiration({
      genre: "Fantasy",
      premise: "A wizard loses his spellbook.",
      previousSegments: ["It was a quiet Tuesday."],
    });

    expect(suggestion).toBeNull();
  });
});
