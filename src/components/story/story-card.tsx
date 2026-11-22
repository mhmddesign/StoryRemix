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
    status: string;
  } | null;
  is_liked?: boolean;
  is_bookmarked?: boolean;
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
    <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-amber-700/40 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
      <Link href={`/stories/${story.slug}`} className="p-6 block space-y-4 flex-1">
        {/* Badges line */}
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
              {story.genre}
            </span>
            <span className="px-2 py-0.5 rounded-full border border-[var(--border)] text-[10px] text-[var(--muted-foreground)] uppercase">
              {story.language}
            </span>
          </div>

          {story.status === "completed" ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          ) : story.active_round ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
              <Flame className="w-3.5 h-3.5" />
              Round {story.active_round.round_number}
            </span>
          ) : null}
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="font-serif text-xl font-bold text-[var(--foreground)] group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
            {story.title}
          </h3>
          {story.description && (
            <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
              {story.description}
            </p>
          )}
        </div>

        {/* Paragraph Progression Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--muted-foreground)] font-medium">Progress</span>
            <span className="font-bold text-[var(--foreground)]">
              {story.current_paragraph_count} / {story.max_paragraphs} Paragraphs
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
            <div
              className="h-full bg-amber-700 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Active round deadline if running */}
        {story.active_round && story.status !== "completed" && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] pt-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Voting for Paragraph {story.active_round.paragraph_position} ends{" "}
              {formatTimeRemaining(story.active_round.deadline_at).formatted}
            </span>
          </div>
        )}
      </Link>

      {/* Card Footer: Author + Like/Bookmark stats */}
      <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--background)]/50 flex items-center justify-between text-xs">
        <Link
          href={`/profile/${story.owner.username}`}
          className="flex items-center gap-2 hover:underline"
        >
          <div className="w-6 h-6 rounded-full bg-amber-700/15 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center">
            {story.owner.display_name?.charAt(0).toUpperCase() || "O"}
          </div>
          <span className="font-medium text-[var(--foreground)] max-w-[120px] truncate">
            {story.owner.display_name}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-colors ${
              isLiked
                ? "text-rose-600 font-semibold"
                : "text-[var(--muted-foreground)] hover:text-rose-600"
            }`}
            title="Like story"
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-600" : ""}`} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={handleBookmark}
            className={`text-xs transition-colors ${
              isBookmarked
                ? "text-amber-700"
                : "text-[var(--muted-foreground)] hover:text-amber-700"
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
