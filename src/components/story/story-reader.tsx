"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Check, Sparkles, Heart, Feather, Gift, Award, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ParagraphGiftModal } from "./paragraph-gift-modal";

export interface StorySegmentWithAuthor {
  id: string;
  paragraph_index: number;
  body: string;
  vote_count_at_lock: number;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface StoryReaderProps {
  segments: StorySegmentWithAuthor[];
  storyTitle: string;
  isCompleted: boolean;
  totalParagraphs: number;
  storyId?: string;
}

export function StoryReader({
  segments,
  storyTitle,
  isCompleted,
  totalParagraphs,
  storyId = "showcase-story",
}: StoryReaderProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeModalSegment, setActiveModalSegment] = useState<StorySegmentWithAuthor | null>(null);

  // Local state tracking gifts and reactions per segment id
  const [segmentReactions, setSegmentReactions] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    segments.forEach((seg, idx) => {
      // Deterministic pleasant seed for active community feel
      initial[seg.id] = (idx * 3 + 2) % 7 + 1;
    });
    return initial;
  });

  const [hasLiked, setHasLiked] = useState<Record<string, boolean>>({});
  const [superLikedSegments, setSuperLikedSegments] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (segments.length > 2) {
      initial[segments[1].id] = true; // Showcase second paragraph with warm glow
    }
    return initial;
  });

  const [segmentGifts, setSegmentGifts] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    segments.forEach((seg, idx) => {
      if (idx === 0) initial[seg.id] = ["🪶", "🌹"];
      else if (idx === 1) initial[seg.id] = ["💖", "⭐"];
      else if (idx % 2 === 0) initial[seg.id] = ["🪶"];
    });
    return initial;
  });

  const handleCopyParagraph = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success(`Paragraph ${index} copied to clipboard!`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleToggleLike = (segId: string) => {
    const currentLiked = hasLiked[segId];
    setHasLiked((prev) => ({ ...prev, [segId]: !currentLiked }));
    setSegmentReactions((prev) => ({
      ...prev,
      [segId]: (prev[segId] || 0) + (currentLiked ? -1 : 1),
    }));
    toast.success(currentLiked ? "Reaction removed" : "Appreciated paragraph!");
  };

  const handleGiftSuccess = (segId: string, giftSymbol: string) => {
    setSegmentGifts((prev) => ({
      ...prev,
      [segId]: [...(prev[segId] || []), giftSymbol],
    }));
    if (giftSymbol === "💖") {
      setSuperLikedSegments((prev) => ({ ...prev, [segId]: true }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Paragraphs Sequence */}
      <div className="space-y-6">
        {segments.map((segment) => {
          const isGenesis = segment.paragraph_index === 1;
          const isSuperLiked = superLikedSegments[segment.id];
          const gifts = segmentGifts[segment.id] || [];
          const likesCount = segmentReactions[segment.id] || 0;
          const userLiked = hasLiked[segment.id];

          return (
            <article
              key={segment.id}
              className={`group relative p-6 sm:p-8 rounded-2xl border transition-all shadow-sm ${
                isSuperLiked
                  ? "border-amber-600/40 bg-gradient-to-b from-amber-500/[0.04] to-transparent ring-1 ring-amber-500/20"
                  : "border-[var(--border)] bg-[var(--card)] hover:border-amber-700/30"
              }`}
            >
              {/* Header Attribution Line */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]/60 text-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="w-6 h-6 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center">
                    {segment.paragraph_index}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--muted-foreground)]">By</span>
                    <Link
                      href={`/profile/${segment.author.username}`}
                      className="font-semibold text-[var(--foreground)] hover:text-amber-700 hover:underline flex items-center gap-1.5"
                    >
                      {segment.author.avatar_url ? (
                        <img
                          src={segment.author.avatar_url}
                          alt={segment.author.display_name}
                          className="w-5 h-5 rounded-full object-cover border border-[var(--border)]"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-amber-700/15 text-[10px] font-bold flex items-center justify-center text-amber-800 dark:text-amber-300">
                          {segment.author.display_name?.charAt(0).toUpperCase() || "A"}
                        </div>
                      )}
                      <span>{segment.author.display_name}</span>
                    </Link>
                  </div>

                  {isGenesis ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 font-semibold text-[10px] uppercase tracking-wide">
                      Genesis / Creator
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-[10px]">
                      Community Winner ({segment.vote_count_at_lock} votes)
                    </span>
                  )}

                  {isSuperLiked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold text-[10px] border border-amber-500/30">
                      <Sparkles className="w-3 h-3" /> Super Liked
                    </span>
                  )}
                </div>

                {/* Copy Paragraph Action */}
                <button
                  onClick={() => handleCopyParagraph(segment.body, segment.paragraph_index)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-opacity cursor-pointer"
                  title="Copy paragraph text"
                >
                  {copiedIndex === segment.paragraph_index ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Paragraph Body */}
              <p className="story-font text-base sm:text-lg text-[var(--foreground)] leading-relaxed mb-4">
                {segment.body}
              </p>

              {/* Discreet Paragraph-Level Appreciation Controls & Gifts */}
              <div className="pt-3 border-t border-[var(--border)]/40 flex items-center justify-between gap-3 text-xs">
                {/* Gifts Pill Display */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {gifts.length > 0 ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--muted)]/50 border border-[var(--border)] text-xs">
                      {gifts.map((g, i) => (
                        <span key={i} className="hover:scale-125 transition-transform cursor-default" title="Appreciation gift">
                          {g}
                        </span>
                      ))}
                      <span className="text-[11px] text-[var(--muted-foreground)] ml-1 font-medium">
                        {gifts.length} {gifts.length === 1 ? "gift" : "gifts"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[var(--muted-foreground)] italic">
                      Be the first to gift this paragraph
                    </span>
                  )}
                </div>

                {/* Actions: React & Gift */}
                <div className="flex items-center gap-2">
                  {/* Free Reaction (Heart) */}
                  <button
                    type="button"
                    onClick={() => handleToggleLike(segment.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      userLiked
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-600"
                        : "border-[var(--border)] hover:border-rose-500/30 text-[var(--muted-foreground)] hover:text-rose-600"
                    }`}
                    title="Like this paragraph"
                  >
                    <Heart className={`w-3.5 h-3.5 ${userLiked ? "fill-current text-rose-600" : ""}`} />
                    <span>{likesCount}</span>
                  </button>

                  {/* Gift Paragraph Button */}
                  <button
                    type="button"
                    onClick={() => setActiveModalSegment(segment)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-600/30 bg-amber-600/10 hover:bg-amber-600/20 text-amber-700 dark:text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
                    title={`Gift Paragraph ${segment.paragraph_index}`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Gift Author</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Completion Celebration or Pending Next Round */}
      {isCompleted ? (
        <div className="p-8 rounded-2xl border-2 border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-600/10 text-emerald-600 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-[var(--foreground)]">
            Story Complete
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
            This collaborative narrative reached its {totalParagraphs}-paragraph climax! All contributors have been recorded in the permanent anthology.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-[var(--muted-foreground)]">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>
            Story in progress: {segments.length} of {totalParagraphs} paragraphs written. Round {segments.length} in voting below.
          </span>
        </div>
      )}

      {/* Paragraph Gift Modal */}
      {activeModalSegment && (
        <ParagraphGiftModal
          isOpen={!!activeModalSegment}
          onClose={() => setActiveModalSegment(null)}
          storyId={storyId}
          segmentId={activeModalSegment.id}
          paragraphIndex={activeModalSegment.paragraph_index}
          author={{
            id: activeModalSegment.author.id,
            display_name: activeModalSegment.author.display_name,
            username: activeModalSegment.author.username,
          }}
          onGiftSent={(symbol) => handleGiftSuccess(activeModalSegment.id, symbol)}
        />
      )}
    </div>
  );
}
