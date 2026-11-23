import { describe, it, expect } from "vitest";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import ar from "../../../messages/ar.json";

function getDeepKeys(obj: Record<string, any>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys = keys.concat(getDeepKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe("i18n Message Dictionaries Parity", () => {
  const enKeys = getDeepKeys(en).sort();
  const frKeys = getDeepKeys(fr).sort();
  const arKeys = getDeepKeys(ar).sort();

  it("English dictionary contains all required namespaces", () => {
    const requiredNamespaces = [
      "common",
      "navigation",
      "auth",
      "profile",
      "stories",
      "editor",
      "voting",
      "discovery",
      "gamification",
      "economy",
      "notifications",
      "moderation",
      "validation",
      "errors",
      "legal",
      "accessibility",
    ];
    for (const ns of requiredNamespaces) {
      expect(en).toHaveProperty(ns);
    }
  });

  it("French messages match English keys exactly", () => {
    expect(frKeys).toEqual(enKeys);
  });

  it("Arabic messages match English keys exactly", () => {
    expect(arKeys).toEqual(enKeys);
  });

  it("contains no empty translation values", () => {
    const checkNoEmpty = (obj: any, dictName: string) => {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "object") {
          checkNoEmpty(v, dictName);
        } else {
          expect(
            typeof v === "string" && v.trim().length > 0,
            `Empty key ${k} found in ${dictName}`
          ).toBe(true);
        }
      }
    };
    checkNoEmpty(en, "en");
    checkNoEmpty(fr, "fr");
    checkNoEmpty(ar, "ar");
  });
});
