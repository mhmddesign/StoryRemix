"use client";

import React from "react";
import { calculateLevel } from "@/lib/gamification";
import { Sparkles, Trophy, Zap, Award } from "lucide-react";

export function LevelProgressCard({ lifetimeXp }: { lifetimeXp: number }) {
  const levelInfo = calculateLevel(lifetimeXp);

  return (
    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-700" />
          <h3 className="font-semibold text-xs text-[var(--foreground)] uppercase tracking-wider">
            Writer Progression
          </h3>
        </div>
        <span className="font-mono text-xs font-bold text-amber-700">
          {lifetimeXp.toLocaleString()} Lifetime XP
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-700/10 text-amber-800 dark:text-amber-300 font-bold text-base flex items-center justify-center border border-amber-700/20">
            {levelInfo.level}
          </div>
          <div>
            <span className="font-serif font-bold text-lg text-[var(--foreground)] block">
              Level {levelInfo.level}: {levelInfo.title}
            </span>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              {levelInfo.nextLevelXp
                ? `${levelInfo.nextLevelXp - lifetimeXp} XP to Level ${levelInfo.level + 1}`
                : "Maximum Level Reached"}
            </span>
          </div>
        </div>

        <span className="font-mono text-xs font-bold text-[var(--foreground)]">
          {levelInfo.progressPercent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-[var(--muted)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-700 to-amber-500 rounded-full transition-all duration-700"
          style={{ width: `${levelInfo.progressPercent}%` }}
        />
      </div>
    </div>
  );
}
