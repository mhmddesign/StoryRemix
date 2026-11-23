"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/language-context";
import { Bookmark, LogIn } from "lucide-react";

export function HomeSavedPrompt() {
  const { t } = useLanguage();

  return (
    <div className="p-12 rounded-3xl border border-[var(--border)] bg-[var(--card)] text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-700/10 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
        <Bookmark className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
          {t("home.savedAuthPromptTitle")}
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
          {t("home.savedAuthPromptDesc")}
        </p>
      </div>
      <div className="pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>{t("common.signIn") || "Sign In"}</span>
        </Link>
      </div>
    </div>
  );
}
