"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { createRemixAction } from "@/app/actions/remix-actions";
import { StorySegmentWithAuthor } from "./story-reader";
import { GitFork, Sparkles, X, ArrowRight, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface RemixModalTriggerProps {
  storyId: string;
  storyTitle: string;
  segments: StorySegmentWithAuthor[];
}

export function RemixModalTrigger({
  storyId,
  storyTitle,
  segments,
}: RemixModalTriggerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [remixTitle, setRemixTitle] = useState(`${storyTitle} (Remix)`);
  const [remixDescription, setRemixDescription] = useState("");
  const [branchIndex, setBranchIndex] = useState(Math.max(1, segments.length - 1));
  const [maxParagraphs, setMaxParagraphs] = useState(Math.max(8, segments.length + 3));

  const handleRemix = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to remix this story.");
      router.push("/login");
      return;
    }

    if (!remixTitle.trim()) {
      toast.error("Title is required for your remix.");
      return;
    }

    startTransition(async () => {
      const res = await createRemixAction(
        storyId,
        remixTitle,
        remixDescription,
        branchIndex,
        maxParagraphs
      );

      if (res.success && res.slug) {
        toast.success("Remix created! Round 1 is open for your new narrative branch.");
        router.push(`/stories/${res.slug}`);
      } else {
        toast.error(res.error || "Failed to create remix.");
      }
    });
  };

  return (
    <>
      {/* Visual Callout Card */}
      <div className="p-8 rounded-2xl border-2 border-amber-700/20 bg-amber-500/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 font-semibold text-xs">
            <GitFork className="w-3.5 h-3.5" />
            <span>Defining Platform Feature</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-[var(--foreground)]">
            Explore an Alternative Universe
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-lg">
            What if the protagonist took a different choice? Fork this story at any paragraph to spin off a new collaborative timeline while honoring the original authors.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-6 py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-colors shrink-0"
        >
          <GitFork className="w-4 h-4" />
          <span>Remix This Story</span>
        </button>
      </div>

      {/* Remix Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
                  Remix & Branch Story
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRemix} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[var(--foreground)]">
                  Remix Title
                </label>
                <input
                  type="text"
                  value={remixTitle}
                  onChange={(e) => setRemixTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-serif text-base focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[var(--foreground)]">
                  Branch Point (Keep paragraphs up to:)
                </label>
                <select
                  value={branchIndex}
                  onChange={(e) => setBranchIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none cursor-pointer"
                >
                  {segments.map((seg) => (
                    <option key={seg.paragraph_index} value={seg.paragraph_index}>
                      Paragraph {seg.paragraph_index}: &ldquo;{seg.body.slice(0, 45)}...&rdquo;
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Paragraphs 1 through {branchIndex} will be inherited with credit. Paragraph {branchIndex + 1} will become the new open round.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[var(--foreground)]">
                  New Plot Premise (Optional)
                </label>
                <textarea
                  rows={2}
                  value={remixDescription}
                  onChange={(e) => setRemixDescription(e.target.value)}
                  placeholder="Explain how this alternate timeline diverges..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[var(--foreground)]">
                    Target Total Paragraphs
                  </label>
                  <span className="font-bold text-amber-700">{maxParagraphs}</span>
                </div>
                <input
                  type="range"
                  min={branchIndex + 1}
                  max={30}
                  value={maxParagraphs}
                  onChange={(e) => setMaxParagraphs(Number(e.target.value))}
                  className="w-full accent-amber-700 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] font-semibold text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Launch Remix</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
