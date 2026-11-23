"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/language-context";
import { BookOpen, ArrowRight } from "lucide-react";

export function HomeCompletedBanner() {
  const { t, direction } = useLanguage();
  const isRtl = direction === "rtl";

  return (
    <section className="p-8 sm:p-10 rounded-3xl border border-[var(--border)] bg-gradient-to-r from-emerald-500/10 via-[var(--card)] to-transparent flex flex-col sm:flex-row items-center justify-between gap-6 text-start">
      <div className="space-y-2">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[var(--foreground)]">
          {t("home.completedBannerTitle")}
        </h3>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-xl">
          {t("home.completedBannerDesc")}
        </p>
      </div>

      <Link
        href="/completed"
        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md flex items-center gap-2 whitespace-nowrap transition-colors"
      >
        <BookOpen className="w-4 h-4" />
        <span>{t("home.viewCompletedAnthology")}</span>
        <ArrowRight className={`w-4 h-4 transition-transform ${isRtl ? "rotate-180" : ""}`} />
      </Link>
    </section>
  );
}
