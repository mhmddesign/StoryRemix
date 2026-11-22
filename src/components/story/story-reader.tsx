"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
}

export function StoryReader({
  segments,
  storyTitle,
  isCompleted,
  totalParagraphs,
}: StoryReaderProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyParagraph = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success(`Paragraph ${index} copied to clipboard!`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Paragraphs Sequence */}
      <div className="space-y-6">
        {segments.map((segment) => {
          const isGenesis = segment.paragraph_index === 1;

          return (
            <article
              key={segment.id}
              className="group relative p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-amber-700/30 transition-all shadow-sm"
            >
              {/* Header Attribution Line */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center">
                    {segment.paragraph_index}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--muted-foreground)]">By</span>
                    <Link
                      href={`/profile/${segment.author.username}`}
                      className="font-semibold text-[var(--foreground)] hover:text-amber-700 hover:underline flex items-center gap-1.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-amber-700/15 text-[10px] font-bold flex items-center justify-center">
                        {segment.author.display_name?.charAt(0).toUpperCase() || "A"}
                      </div>
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
                </div>

                {/* Copy Paragraph Action */}
                <button
                  onClick={() => handleCopyParagraph(segment.body, segment.paragraph_index)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-opacity"
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
              <p className="story-font text-base sm:text-lg text-[var(--foreground)] leading-relaxed">
                {segment.body}
              </p>
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
    </div>
  );
}
