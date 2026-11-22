"use client";

import React, { useState, useTransition } from "react";
import { updateCreativePathAction } from "@/app/actions/gamification-actions";
import { CreativePathType } from "@/types/database";
import { CREATIVE_PATHS } from "@/lib/gamification";
import { Feather, PenTool, Compass, ThumbsUp, GitFork, Heart, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ICONS = {
  Feather,
  PenTool,
  Compass,
  ThumbsUp,
  GitFork,
  Heart,
};

export function CreativePathCard({
  currentPath,
  isOwner,
}: {
  currentPath: CreativePathType;
  isOwner: boolean;
}) {
  const [selectedPath, setSelectedPath] = useState<CreativePathType>(currentPath);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (path: CreativePathType) => {
    setSelectedPath(path);
    startTransition(async () => {
      const res = await updateCreativePathAction(path);
      if (res.success) {
        toast.success(`Creative Path updated to ${CREATIVE_PATHS[path].name}!`);
        setIsEditing(false);
      } else {
        toast.error(res.error || "Failed to update Creative Path.");
      }
    });
  };

  const currentInfo = CREATIVE_PATHS[selectedPath] || CREATIVE_PATHS.storyteller;
  const CurrentIcon = ICONS[currentInfo.icon as keyof typeof ICONS] || Feather;

  return (
    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CurrentIcon className="w-4 h-4 text-amber-700" />
          <h3 className="font-semibold text-xs text-[var(--foreground)] uppercase tracking-wider">
            Creative Path
          </h3>
        </div>
        {isOwner && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-[11px] font-semibold text-amber-700 hover:underline cursor-pointer"
          >
            {isEditing ? "Done" : "Change Path"}
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-1">
          <span className="font-serif font-bold text-base text-[var(--foreground)] block">
            {currentInfo.name}
          </span>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            {currentInfo.description}
          </p>
          <span className="text-[11px] italic text-amber-800 dark:text-amber-300 block pt-1">
            &ldquo;{currentInfo.motivation}&rdquo;
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in">
          {(Object.keys(CREATIVE_PATHS) as CreativePathType[]).map((pathKey) => {
            const p = CREATIVE_PATHS[pathKey];
            const PathIcon = ICONS[p.icon as keyof typeof ICONS] || Feather;
            const isSelected = selectedPath === pathKey;

            return (
              <button
                key={pathKey}
                type="button"
                onClick={() => handleSelect(pathKey)}
                disabled={isPending}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                  isSelected
                    ? "border-amber-700 bg-amber-700/10 font-bold"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-amber-700/30"
                }`}
              >
                <PathIcon className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-xs text-[var(--foreground)] block">{p.name}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)] line-clamp-2">
                    {p.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
