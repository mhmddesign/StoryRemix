"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Flame,
  CheckCircle2,
  Clock,
  Heart,
  Bookmark,
  Share2,
} from "lucide-react";
import { StoryCover } from "./story-cover";
import { formatTimeRemaining } from "@/lib/utils";
import { toggleStoryLikeAction, toggleBookmarkAction } from "@/app/actions/story-actions";
import { toast } from "sonner";

export interface StoryCardData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  genre: string;
  language: string;
  status: "draft" | "active" | "completed" | "archived";
  max_paragraphs: number;
  current_paragraph_count: number;
  cover_image_url?: string | null;
  cover_alt_text?: string | null;
  owner: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  likes_count?: number;
  contributors_count?: number;
  active_round?: {
    round_number: number;
    paragraph_position: number;
    deadline_at: string;
    status?: string;
    candidates_count?: number;
    top_vote_count?: number;
  } | null;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  is_demo?: boolean;
}

export function StoryCard({ story }: { story: StoryCardData }) {
  const [likesCount, setLikesCount] = useState(story.likes_count || 0);
  const [isLiked, setIsLiked] = useState(story.is_liked || false);
  const [isBookmarked, setIsBookmarked] = useState(story.is_bookmarked || false);

  const progressPercent = Math.min(
    100,
    Math.round((story.current_paragraph_count / story.max_paragraphs) * 100)
  );

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const res = await toggleStoryLikeAction(story.id);
    if (res.success && res.liked !== undefined) {
      setIsLiked(res.liked);
      setLikesCount((prev) => (res.liked ? prev + 1 : Math.max(0, prev - 1)));
    } else if (res.error) {
      toast.error(res.error);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const res = await toggleBookmarkAction(story.id);
    if (res.success && res.bookmarked !== undefined) {
      setIsBookmarked(res.bookmarked);
      toast.success(res.bookmarked ? "Story saved to bookmarks!" : "Removed from bookmarks.");
    } else if (res.error) {
      toast.error(res.error);
    }
  };

  return (
    <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-amber-700/40 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden">
      <Link href={`/stories/${story.slug}`} className="block flex-1">
        {/* Cover Art in 2:3 ratio */}
        <div className="relative p-3 bg-[var(--background)]/50">
          <StoryCover
            coverUrl={story.cover_image_url}
            altText={story.cover_alt_text}
            title={story.title}
            genre={story.genre}
            authorName={story.owner?.display_name || story.owner?.username || "Original Author"}
          />

          {/* Floating Round/Status Pill */}
          <div className="absolute top-5 end-5">
            {story.status === "completed" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold backdrop-blur-xs shadow">
                <CheckCircle2 className="w-3 h-3" />
                <span>Finished</span>
              </span>
            ) : story.active_round ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-400/30 text-amber-300 text-[10px] font-semibold backdrop-blur-xs shadow">
                <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Round {story.active_round.round_number}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-800 dark:text-amber-400">
                {story.genre}
              </span>
              {story.is_demo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[9px] font-bold border border-amber-600/25">
                  Showcase
                </span>
              )}
            </div>
            <h3 className="font-serif text-base font-bold text-[var(--foreground)] group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors line-clamp-1">
              {story.title}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
              {story.description || "A collective narrative unfolding paragraph by paragraph through community voting."}
            </p>
          </div>

          {/* Progress Bar & Paragraph Tracker */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] font-mono">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                <span>
                  {story.current_paragraph_count} / {story.max_paragraphs} paras
                </span>
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full bg-amber-700 dark:bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </Link>

      {/* Card Footer Actions */}
      <div className="px-4 py-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)] bg-[var(--background)]/30">
        {story.active_round && story.status !== "completed" ? (
          <span className="flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            <span>{formatTimeRemaining(story.active_round.deadline_at).formatted}</span>
          </span>
        ) : (
          <span className="text-[11px] text-[var(--muted-foreground)] font-mono uppercase">
            {story.language}
          </span>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              isLiked
                ? "text-rose-600 bg-rose-500/10"
                : "hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
            }`}
            title="Like story"
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-600" : ""}`} />
            {likesCount > 0 && <span className="text-[11px] font-medium">{likesCount}</span>}
          </button>

          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isBookmarked
                ? "text-amber-700 bg-amber-700/10"
                : "hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
            }`}
            title="Bookmark story"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-700" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
