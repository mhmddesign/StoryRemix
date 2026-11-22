"use client";

import React, { useState } from "react";
import { toggleStoryReactionAction } from "@/app/actions/economy-actions";
import { toast } from "sonner";

interface ReactionCount {
  reaction: string;
  count: number;
  userReacted: boolean;
}

const AVAILABLE_REACTIONS = ["❤️", "🔥", "✨", "😂", "😮", "📚", "🪶", "👏"];

export function StoryReactionBar({
  storyId,
  initialReactions = [],
}: {
  storyId: string;
  initialReactions?: { reaction: string; count: number; userReacted: boolean }[];
}) {
  const [reactions, setReactions] = useState<Map<string, { count: number; userReacted: boolean }>>(() => {
    const map = new Map<string, { count: number; userReacted: boolean }>();
    initialReactions.forEach((r) => map.set(r.reaction, { count: r.count, userReacted: r.userReacted }));
    return map;
  });

  const handleToggle = async (reaction: string) => {
    const current = reactions.get(reaction) || { count: 0, userReacted: false };
    const nextReacted = !current.userReacted;
    const nextCount = nextReacted ? current.count + 1 : Math.max(0, current.count - 1);

    // Optimistic update
    setReactions((prev) => {
      const updated = new Map(prev);
      updated.set(reaction, { count: nextCount, userReacted: nextReacted });
      return updated;
    });

    const res = await toggleStoryReactionAction(storyId, reaction);
    if (!res.success) {
      toast.error(res.error || "Failed to toggle reaction.");
      // Rollback
      setReactions((prev) => {
        const updated = new Map(prev);
        updated.set(reaction, current);
        return updated;
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2">
      <span className="text-[11px] text-[var(--muted-foreground)] mr-1">Reactions:</span>
      {AVAILABLE_REACTIONS.map((r) => {
        const data = reactions.get(r) || { count: 0, userReacted: false };
        const hasCount = data.count > 0;

        return (
          <button
            key={r}
            onClick={() => handleToggle(r)}
            className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer ${
              data.userReacted
                ? "border border-amber-700/50 bg-amber-700/10 font-bold scale-105"
                : hasCount
                ? "border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)]"
                : "border border-dashed border-[var(--border)] opacity-60 hover:opacity-100 hover:bg-[var(--accent)]"
            }`}
            title={`React with ${r}`}
          >
            <span>{r}</span>
            {hasCount && <span className="text-[10px] text-[var(--foreground)]">{data.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
