"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { createStoryAction } from "@/app/actions/story-actions";
import { analyzeStoryText } from "@/lib/sentence-tokenizer";
import {
  Feather,
  Sparkles,
  BookOpen,
  Clock,
  ThumbsUp,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Mystery & Detective",
  "Thriller & Suspense",
  "Historical Fiction",
  "Horror & Supernatural",
  "Literary Fiction",
  "Romance",
  "Adventure",
  "Satire & Comedy",
  "Cyberpunk",
  "Magical Realism",
];

const DURATION_PRESETS = [
  { label: "1 Hour (Speed Round)", seconds: 3600 },
  { label: "6 Hours (Fast Paced)", seconds: 21600 },
  { label: "12 Hours (Half Day)", seconds: 43200 },
  { label: "24 Hours (Standard)", seconds: 86400 },
  { label: "48 Hours (Weekend)", seconds: 172800 },
  { label: "3 Days (Deliberate)", seconds: 259200 },
];

export default function NewStoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [language, setLanguage] = useState("en");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [maxParagraphs, setMaxParagraphs] = useState(8);
  const [voteThreshold, setVoteThreshold] = useState(3);
  const [roundDuration, setRoundDuration] = useState(86400);
  const [tags, setTags] = useState("");
  const [openingText, setOpeningText] = useState("");

  // Sentence analysis for opening paragraph
  const analysis = analyzeStoryText(openingText);
  const isOpeningValid = analysis.sentenceCount >= 2 && analysis.sentenceCount <= 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to start a story.");
      router.push("/login");
      return;
    }

    if (!title.trim()) {
      toast.error("Story title is required.");
      return;
    }

    if (!isOpeningValid) {
      toast.error(
        `Opening paragraph must contain between 2 and 5 sentences (currently ${analysis.sentenceCount}).`
      );
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("genre", genre);
    formData.append("language", language);
    formData.append("visibility", visibility);
    formData.append("maxParagraphs", maxParagraphs.toString());
    formData.append("defaultVoteThreshold", voteThreshold.toString());
    formData.append("defaultRoundDuration", roundDuration.toString());
    formData.append("tags", tags);
    formData.append("openingText", openingText);

    startTransition(async () => {
      const res = await createStoryAction(formData);
      if (res.success && res.slug) {
        toast.success("Story successfully initiated! Round 1 is now open.");
        router.push(`/stories/${res.slug}`);
      } else {
        toast.error(res.error || "Failed to create story.");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Genesis Paragraph</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)]">
          Plant the Seed of a New Story
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Write the opening hook. The community will vote on each subsequent paragraph to complete your narrative arc.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Info Card */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-700" /> Story Basics
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Story Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Clockmaker's Final Secret"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-serif text-lg focus:outline-none focus:ring-2 focus:ring-amber-700/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Premise / Short Logline (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief teaser to orient competing contributors about your creative vision..."
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-2 focus:ring-amber-700/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)]">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)]">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية (Arabic)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)]">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none"
              >
                <option value="public">Public (Discovery feed)</option>
                <option value="unlisted">Unlisted (Direct link only)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="steampunk, time-travel, mystery, noir"
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Opening Paragraph Card */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
              <Feather className="w-4 h-4 text-amber-700" /> Opening Paragraph (Paragraph 1)
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] flex items-center gap-1 ${
                  isOpeningValid
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                }`}
              >
                {isOpeningValid ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {analysis.sentenceCount} of 2–5 sentences
              </span>
              <span className="text-[var(--muted-foreground)]">
                {analysis.wordCount} words
              </span>
            </div>
          </div>

          <textarea
            rows={5}
            value={openingText}
            onChange={(e) => setOpeningText(e.target.value)}
            placeholder="Write the opening hook (2 to 5 sentences). Set the setting, protagonist, and opening tension..."
            className="w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] story-font text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-amber-700/30 leading-relaxed"
          />

          {openingText.length > 0 && !isOpeningValid && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Opening paragraphs must have between 2 and 5 sentences. Currently detected:{" "}
              {analysis.sentenceCount}.
            </p>
          )}
        </div>

        {/* Story Evolution Rules Card */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700" /> Story Evolution Rules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Max Paragraphs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Total Story Length
                </label>
                <span className="text-xs font-bold text-amber-700">
                  {maxParagraphs} paragraphs
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={30}
                value={maxParagraphs}
                onChange={(e) => setMaxParagraphs(Number(e.target.value))}
                className="w-full accent-amber-700 cursor-pointer"
              />
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Paragraph 1 is yours. Remaining {maxParagraphs - 1} paragraphs will be co-written by the community.
              </p>
            </div>

            {/* Vote Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Vote Threshold
                </label>
                <span className="text-xs font-bold text-amber-700">
                  {voteThreshold} votes
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={25}
                value={voteThreshold}
                onChange={(e) => setVoteThreshold(Number(e.target.value))}
                className="w-full accent-amber-700 cursor-pointer"
              />
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Minimum community votes a candidate needs to automatically win a round.
              </p>
            </div>

            {/* Round Duration */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--foreground)]">
                Round Duration
              </label>
              <select
                value={roundDuration}
                onChange={(e) => setRoundDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none cursor-pointer"
              >
                {DURATION_PRESETS.map((preset) => (
                  <option key={preset.seconds} value={preset.seconds}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Time writers have to submit candidates and vote on each round.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !title.trim() || !isOpeningValid}
            className="px-7 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-semibold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initiating Story...</span>
              </>
            ) : (
              <>
                <Feather className="w-4 h-4" />
                <span>Launch Story & Open Round 1</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
