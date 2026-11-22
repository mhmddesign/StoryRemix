"use client";

import React from "react";
import { useLanguage, Language } from "./language-context";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)]">
      <Globe className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
      <select
        value={language}
        onChange={handleSelect}
        className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
        aria-label="Select language"
      >
        <option value="en">EN</option>
        <option value="fr">FR</option>
        <option value="ar">العربية</option>
      </select>
    </div>
  );
}
