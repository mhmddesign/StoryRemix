"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import enMessages from "../../../messages/en.json";
import frMessages from "../../../messages/fr.json";
import arMessages from "../../../messages/ar.json";

export type Language = "en" | "fr" | "ar";

const DICTIONARIES: Record<Language, any> = {
  en: enMessages,
  fr: frMessages,
  ar: arMessages,
};

// Backward-compatibility mapping for existing flat keys
const LEGACY_MAP: Record<string, string> = {
  appName: "common.appName",
  tagline: "common.tagline",
  explore: "navigation.explore",
  trending: "discovery.feedTrending",
  activeRounds: "navigation.activeRounds",
  completed: "navigation.completedStories",
  startStory: "navigation.startStory",
  signIn: "navigation.signIn",
  signUp: "navigation.signUp",
  signOut: "navigation.signOut",
  profile: "navigation.profile",
  myStories: "navigation.myStories",
  saved: "navigation.savedStories",
  adminDashboard: "navigation.adminDashboard",
  searchPlaceholder: "common.search",
  writeContinuation: "editor.submitContinuation",
  vote: "voting.voteForCandidate",
  voted: "voting.voted",
  paragraphsCount: "stories.paragraphs",
  contributorsCount: "stories.contributors",
  remixThisStory: "stories.remixStory",
};

interface LanguageContextType {
  language: Language;
  direction: "ltr" | "rtl";
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  direction: "ltr",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("storyremix_lang", lang);
      document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
  };

  useEffect(() => {
    // 1. Check cookie or localStorage
    const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
    const cookieLocale = match ? decodeURIComponent(match[1]) : null;
    const saved = (cookieLocale || localStorage.getItem("storyremix_lang")) as Language;

    if (saved && (saved === "en" || saved === "fr" || saved === "ar")) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const resolvedPath = LEGACY_MAP[key] || key;
    const parts = resolvedPath.split(".");

    let current: any = DICTIONARIES[language];
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        current = null;
        break;
      }
    }

    // Fallback to English if missing in target locale
    if (typeof current !== "string") {
      let fallback: any = DICTIONARIES.en;
      for (const part of parts) {
        if (fallback && typeof fallback === "object" && part in fallback) {
          fallback = fallback[part];
        } else {
          fallback = null;
          break;
        }
      }
      current = typeof fallback === "string" ? fallback : key;
    }

    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        current = current.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
      }
    }

    return current;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction: language === "ar" ? "rtl" : "ltr",
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
