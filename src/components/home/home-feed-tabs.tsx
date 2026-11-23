"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/language-context";
import {
  Flame,
  Sparkles,
  TrendingUp,
  Clock,
  Award,
  CheckCircle2,
  Bookmark,
} from "lucide-react";

interface HomeFeedTabsProps {
  activeTab: string;
}

export function HomeFeedTabs({ activeTab }: HomeFeedTabsProps) {
  const { t } = useLanguage();

  const tabs = [
    {
      id: "hot",
      label: t("home.tabHot") || "Hot",
      icon: Flame,
      desc: t("home.tabHotDesc") || "Active rounds & voting momentum",
    },
    {
      id: "for-you",
      label: t("home.tabForYou") || "For You",
      icon: Sparkles,
      desc: t("home.tabForYouDesc") || "Personalized literary recommendations",
    },
    {
      id: "trending",
      label: t("home.tabTrending") || "Trending",
      icon: TrendingUp,
      desc: t("home.tabTrendingDesc") || "Fastest-moving story arcs",
    },
    {
      id: "new",
      label: t("home.tabNew") || "New Seeds",
      icon: Clock,
      desc: t("home.tabNewDesc") || "Freshly planted story openings",
    },
    {
      id: "week",
      label: t("home.tabWeek") || "Best of This Week",
      icon: Award,
      desc: t("home.tabWeekDesc") || "Top-voted stories of the current cycle",
    },
    {
      id: "completed",
      label: t("home.tabCompleted") || "Completed",
      icon: CheckCircle2,
      desc: t("home.tabCompletedDesc") || "Finished canonical stories",
    },
    {
      id: "saved",
      label: t("home.tabSaved") || "Saved",
      icon: Bookmark,
      desc: t("home.tabSavedDesc") || "Your personal reading list",
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const CurrentIcon = currentTab.icon;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[var(--border)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={tab.id === "hot" ? "/" : `/?tab=${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-amber-800 text-white shadow-sm"
                  : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-amber-700/30"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-amber-600"}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Tab Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1 text-start">
          <div className="flex items-center gap-2">
            <CurrentIcon className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--foreground)]">
              {currentTab.label}
            </h2>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {currentTab.desc}
          </p>
        </div>
      </div>
    </div>
  );
}
