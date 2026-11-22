"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "fr" | "ar";

interface Translations {
  [key: string]: {
    en: string;
    fr: string;
    ar: string;
  };
}

export const UI_STRINGS: Translations = {
  appName: {
    en: "StoryRemix",
    fr: "StoryRemix",
    ar: "ستوري ريمكس",
  },
  tagline: {
    en: "One story. Many minds. Endless possibilities.",
    fr: "Une histoire. Plusieurs esprits. Des possibilités infinies.",
    ar: "قصة واحدة. عقول متعددة. إمكانيات لا تنتهي.",
  },
  explore: {
    en: "Explore",
    fr: "Explorer",
    ar: "استكشف",
  },
  trending: {
    en: "Trending",
    fr: "Tendances",
    ar: "الرائج",
  },
  activeRounds: {
    en: "Active Rounds",
    fr: "Rounds Actifs",
    ar: "جولات نشطة",
  },
  completed: {
    en: "Completed Stories",
    fr: "Histoires Terminées",
    ar: "قصص مكتملة",
  },
  startStory: {
    en: "Start a Story",
    fr: "Créer une histoire",
    ar: "ابدأ قصة",
  },
  signIn: {
    en: "Sign In",
    fr: "Connexion",
    ar: "تسجيل الدخول",
  },
  signUp: {
    en: "Sign Up",
    fr: "S'inscrire",
    ar: "إنشاء حساب",
  },
  signOut: {
    en: "Sign Out",
    fr: "Déconnexion",
    ar: "تسجيل الخروج",
  },
  profile: {
    en: "Profile",
    fr: "Profil",
    ar: "الملف الشخصي",
  },
  myStories: {
    en: "My Stories",
    fr: "Mes Histoires",
    ar: "قصصي",
  },
  myContributions: {
    en: "My Contributions",
    fr: "Mes Contributions",
    ar: "مساهماتي",
  },
  saved: {
    en: "Saved Stories",
    fr: "Histoires Enregistrées",
    ar: "المحفوظات",
  },
  adminDashboard: {
    en: "Moderation & Admin",
    fr: "Modération & Admin",
    ar: "لوحة الإشراف",
  },
  searchPlaceholder: {
    en: "Search stories by title, genre, or premise...",
    fr: "Rechercher par titre, genre ou prémisse...",
    ar: "ابحث عن القصص بالعنوان، النوع، أو الفكرة...",
  },
  writeContinuation: {
    en: "Submit Continuation",
    fr: "Soumettre une suite",
    ar: "أضف تكملة",
  },
  vote: {
    en: "Vote",
    fr: "Voter",
    ar: "تصويت",
  },
  voted: {
    en: "Voted",
    fr: "Voté",
    ar: "تم التصويت",
  },
  paragraphsCount: {
    en: "Paragraphs",
    fr: "Paragraphes",
    ar: "فقرات",
  },
  contributorsCount: {
    en: "Contributors",
    fr: "Contributeurs",
    ar: "مساهمين",
  },
  remixThisStory: {
    en: "Remix This Story",
    fr: "Remixer cette histoire",
    ar: "إعادة صياغة القصة (ريمكس)",
  },
};

interface LanguageContextType {
  language: Language;
  direction: "ltr" | "rtl";
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof UI_STRINGS) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  direction: "ltr",
  setLanguage: () => {},
  t: (key) => UI_STRINGS[key]?.en || String(key),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("storyremix_lang", lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("storyremix_lang") as Language;
    if (saved && (saved === "en" || saved === "fr" || saved === "ar")) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const t = (key: keyof typeof UI_STRINGS) => {
    return UI_STRINGS[key]?.[language] || UI_STRINGS[key]?.en || String(key);
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
