"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/language-context";
import { Feather, Compass, Flame, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 sm:py-24">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-700/10 border border-amber-700/20 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center shadow-inner">
          <Feather className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-amber-700 dark:text-amber-400 uppercase">
            Error 404
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight">
            {t("errors.notFoundTitle") || "Lost in the Anthology"}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto leading-relaxed">
            {t("errors.notFoundMessage") || "The chapter or page you are looking for has been moved, unwritten, or does not exist."}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-sm transition-colors inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("common.back") || "Return Home"}</span>
          </Link>
          <Link
            href="/explore"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)] text-xs font-semibold text-[var(--foreground)] transition-colors inline-flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span>{t("navigation.explore") || "Explore Stories"}</span>
          </Link>
          <Link
            href="/rounds"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)] text-xs font-semibold text-[var(--foreground)] transition-colors inline-flex items-center justify-center gap-2"
          >
            <Flame className="w-4 h-4 text-amber-600" />
            <span>{t("navigation.activeRounds") || "Active Rounds"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
