"use client";

import React, { useState } from "react";
import { Heart, Bookmark, Share2, Check } from "lucide-react";
import { toggleStoryLikeAction, toggleBookmarkAction } from "@/app/actions/story-actions";
import { toast } from "sonner";

interface StoryInteractionBarProps {
  storyId: string;
  initialLikes: number;
  initialIsLiked: boolean;
  initialIsBookmarked: boolean;
  storyTitle: string;
}

export function StoryInteractionBar({
  storyId,
  initialLikes,
  initialIsLiked,
  initialIsBookmarked,
  storyTitle,
}: StoryInteractionBarProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [copied, setCopied] = useState(false);

  const handleLike = async () => {
    const res = await toggleStoryLikeAction(storyId);
    if (res.success && res.liked !== undefined) {
      setIsLiked(res.liked);
      setLikes((prev) => (res.liked ? prev + 1 : Math.max(0, prev - 1)));
    } else if (res.error) {
      toast.error(res.error);
    }
  };

  const handleBookmark = async () => {
    const res = await toggleBookmarkAction(storyId);
    if (res.success && res.bookmarked !== undefined) {
      setIsBookmarked(res.bookmarked);
      toast.success(res.bookmarked ? "Story bookmarked!" : "Removed from bookmarks.");
    } else if (res.error) {
      toast.error(res.error);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Shareable link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLike}
        className={`px-3 py-1.5 rounded-xl border border-[var(--border)] flex items-center gap-1.5 transition-colors cursor-pointer text-xs ${
          isLiked
            ? "border-rose-500/30 bg-rose-500/10 text-rose-600 font-semibold"
            : "hover:bg-[var(--accent)] text-[var(--foreground)]"
        }`}
        title="Like story"
      >
        <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-600 text-rose-600" : ""}`} />
        <span>{likes}</span>
      </button>

      <button
        onClick={handleBookmark}
        className={`p-1.5 rounded-xl border border-[var(--border)] transition-colors cursor-pointer ${
          isBookmarked
            ? "border-amber-700/30 bg-amber-700/10 text-amber-700"
            : "hover:bg-[var(--accent)] text-[var(--foreground)]"
        }`}
        title="Save to bookmarks"
      >
        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-700" : ""}`} />
      </button>

      <button
        onClick={handleShare}
        className="px-3 py-1.5 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)] text-[var(--foreground)] flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors"
        title="Share story link"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
        <span>{copied ? "Copied" : "Share"}</span>
      </button>
    </div>
  );
}
