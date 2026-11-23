"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/language-context";
import { Feather, Sparkles, Award, Compass } from "lucide-react";

export function HomeHero() {
  const { t, direction } = useLanguage();
  const isRtl = direction === "rtl";

  return (
    <section className="relative p-8 sm:p-14 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-amber-700/5 via-[var(--card)] to-amber-700/10 shadow-sm text-start overflow-hidden">
      <div className="max-w-2xl space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t("home.heroBadge")}</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[var(--foreground)] tracking-tight leading-[1.15]">
          {t("home.heroTitle")}
        </h1>

        <p className="text-base sm:text-lg text-[var(--muted-foreground)] story-font leading-relaxed max-w-xl">
          {t("home.heroSubtitle")}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/stories/new"
            className="px-6 py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Feather className="w-4 h-4" />
            <span>{t("home.plantSeed")}</span>
          </Link>

          <Link
            href="/explore"
            className="px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] text-[var(--foreground)] font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
          >
            <Compass className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span>{t("home.exploreLibrary")}</span>
          </Link>

          <Link
            href="/leaderboards"
            className="px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-amber-700/50 text-[var(--foreground)] font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>{t("home.rankings")}</span>
          </Link>
        </div>
      </div>

      {/* Decorative literary feather backdrop */}
      <div
        className={`hidden lg:block absolute -bottom-6 text-amber-700/10 pointer-events-none transition-transform ${
          isRtl ? "-left-6 scale-x-[-1]" : "-right-6"
        }`}
        aria-hidden="true"
      >
        <Feather className="w-72 h-72" />
      </div>
    </section>
  );
}
