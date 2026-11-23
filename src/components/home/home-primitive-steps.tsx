"use client";

import React from "react";
import { useLanguage } from "@/components/i18n/language-context";

export function HomePrimitiveSteps() {
  const { t } = useLanguage();

  const steps = [
    {
      num: t("home.step1Number") || "01",
      title: t("home.step1Title") || "Read & Discover",
      desc: t("home.step1Desc") || "Follow stories in progress. Read what other minds have contributed and immerse yourself in evolving plotlines.",
    },
    {
      num: t("home.step2Number") || "02",
      title: t("home.step2Title") || "Write 2–3 Sentences",
      desc: t("home.step2Desc") || "Accessible participation. You don't need to write a whole chapter—just submit a concise, punchy 2-to-3 sentence continuation.",
    },
    {
      num: t("home.step3Number") || "03",
      title: t("home.step3Title") || "Vote & Immortalize",
      desc: t("home.step3Desc") || "One vote per round. Support your favorite continuation before the timer expires and decide what becomes canon.",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-start">
      {steps.map((s, idx) => (
        <div
          key={idx}
          className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2.5 transition-all hover:border-amber-700/30"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-700/10 text-amber-700 dark:text-amber-400 font-mono font-bold flex items-center justify-center text-sm">
            {s.num}
          </div>
          <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
            {s.title}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            {s.desc}
          </p>
        </div>
      ))}
    </section>
  );
}
