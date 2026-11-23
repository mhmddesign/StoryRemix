"use client";

import React, { useState } from "react";
import { BookOpen, Sparkles, Feather } from "lucide-react";

interface StoryCoverProps {
  coverUrl?: string | null;
  altText?: string | null;
  title: string;
  genre: string;
  authorName: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const GENRE_THEMES: Record<string, { bg: string; text: string; accent: string; icon: string }> = {
  Fantasy: {
    bg: "from-purple-950 via-indigo-900 to-purple-900",
    text: "text-purple-100",
    accent: "border-purple-400/30 text-purple-300",
    icon: "✨",
  },
  "Science Fiction": {
    bg: "from-sky-950 via-cyan-950 to-blue-950",
    text: "text-sky-100",
    accent: "border-cyan-400/30 text-cyan-300",
    icon: "🚀",
  },
  "Mystery & Detective": {
    bg: "from-slate-950 via-zinc-900 to-amber-950",
    text: "text-amber-100",
    accent: "border-amber-500/30 text-amber-300",
    icon: "🔍",
  },
  "Thriller & Suspense": {
    bg: "from-red-950 via-neutral-900 to-zinc-950",
    text: "text-red-100",
    accent: "border-red-500/30 text-red-300",
    icon: "⚡",
  },
  "Horror & Supernatural": {
    bg: "from-zinc-950 via-stone-900 to-violet-950",
    text: "text-zinc-100",
    accent: "border-violet-500/30 text-violet-300",
    icon: "🌙",
  },
  Romance: {
    bg: "from-rose-950 via-pink-950 to-stone-900",
    text: "text-rose-100",
    accent: "border-rose-400/30 text-rose-300",
    icon: "🌹",
  },
  "Historical Fiction": {
    bg: "from-amber-950 via-yellow-950 to-stone-900",
    text: "text-amber-100",
    accent: "border-yellow-600/30 text-yellow-300",
    icon: "📜",
  },
  "Literary Fiction": {
    bg: "from-stone-900 via-neutral-900 to-amber-950",
    text: "text-amber-50",
    accent: "border-amber-400/30 text-amber-200",
    icon: "🪶",
  },
  Adventure: {
    bg: "from-emerald-950 via-teal-950 to-stone-950",
    text: "text-emerald-100",
    accent: "border-teal-400/30 text-teal-300",
    icon: "🧭",
  },
  "Satire & Comedy": {
    bg: "from-amber-900 via-orange-950 to-stone-900",
    text: "text-amber-100",
    accent: "border-amber-400/30 text-amber-200",
    icon: "🎭",
  },
};

const DEFAULT_THEME = {
  bg: "from-stone-900 via-amber-950 to-zinc-900",
  text: "text-amber-100",
  accent: "border-amber-500/30 text-amber-300",
  icon: "📚",
};

export function StoryCover({
  coverUrl,
  altText,
  title,
  genre,
  authorName,
  className = "",
  size = "md",
}: StoryCoverProps) {
  const [imageError, setImageError] = useState(false);
  const theme = GENRE_THEMES[genre] || DEFAULT_THEME;

  // If valid image provided and not errored, render editorial photo cover
  if (coverUrl && !imageError) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-stone-900 shadow-md aspect-[2/3] ${className}`}
      >
        <img
          src={coverUrl}
          alt={altText || `Cover for ${title}`}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 pointer-events-none" />
      </div>
    );
  }

  // Fallback: Generative Editorial Typography Cover
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${theme.bg} p-4 shadow-md aspect-[2/3] flex flex-col justify-between border border-white/10 group-hover:border-amber-500/40 transition-all ${className}`}
    >
      {/* Top Header: Genre Badge & Literary Symbol */}
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-semibold text-white/70">
        <span className={`px-2 py-0.5 rounded-full border ${theme.accent} bg-black/30 backdrop-blur-xs truncate max-w-[70%]`}>
          {genre}
        </span>
        <span className="text-base select-none">{theme.icon}</span>
      </div>

      {/* Center: Title in Literary Serif */}
      <div className="space-y-1.5 my-auto text-center py-2">
        <h3 className={`font-serif font-bold tracking-tight line-clamp-3 leading-snug ${theme.text} ${
          size === "sm" ? "text-xs" : size === "lg" ? "text-xl sm:text-2xl" : "text-sm sm:text-base"
        }`}>
          {title}
        </h3>
        <div className="w-6 h-0.5 bg-amber-500/50 mx-auto rounded-full" />
      </div>

      {/* Bottom Footer: Author attribution */}
      <div className="text-center pt-2 border-t border-white/10">
        <p className="text-[10px] text-white/60 truncate font-mono">
          by {authorName}
        </p>
      </div>

      {/* Subtle paper grain texture overlay */}
      <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none" />
    </div>
  );
}
