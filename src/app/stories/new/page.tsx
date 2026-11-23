"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useLanguage } from "@/components/i18n/language-context";
import { createStoryAction } from "@/app/actions/story-actions";
import { analyzeStoryText } from "@/lib/sentence-tokenizer";
import { RevenuePolicySelector } from "@/components/story/revenue-policy-selector";
import { RevenuePolicyType } from "@/types/database";
import { StoryCover } from "@/components/story/story-cover";
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
  DollarSign,
  Image as ImageIcon,
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
  const { t, language: currentLang } = useLanguage();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [language, setLanguage] = useState<string>(currentLang || "en");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [maxParagraphs, setMaxParagraphs] = useState(8);
  const [voteThreshold, setVoteThreshold] = useState(3);
  const [roundDuration, setRoundDuration] = useState(86400);
  const [tags, setTags] = useState("");
  const [openingText, setOpeningText] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverAltText, setCoverAltText] = useState("");

  // Sync default language with current UI locale
  useEffect(() => {
    if (currentLang) {
      setLanguage(currentLang);
    }
  }, [currentLang]);

  // Co-author revenue sharing policy state
  const [policyType, setPolicyType] = useState<RevenuePolicyType>("equal_collaborators");
  const [creatorReserved, setCreatorReserved] = useState(30);
  const [openingWeight, setOpeningWeight] = useState(2);
  const [continuationWeight, setContinuationWeight] = useState(1);
  const [finalWeight, setFinalWeight] = useState(2);

  // Sentence analysis for opening paragraph
  const analysis = analyzeStoryText(openingText);
  const isOpeningValid = analysis.sentenceCount >= 2 && analysis.sentenceCount <= 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t("createStory.errors.signInRequired") || "Please sign in to start a story.");
      router.push("/login");
      return;
    }

    if (!title.trim()) {
      toast.error(t("createStory.errors.titleRequired") || "Story title is required.");
      return;
    }

    if (!isOpeningValid) {
      toast.error(
        t("createStory.errors.openingInvalid", { count: analysis.sentenceCount }) ||
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
    formData.append("coverImageUrl", coverImageUrl);
    formData.append("coverAltText", coverAltText);
    formData.append("openingText", openingText);
    formData.append("revenuePolicyType", policyType);
    formData.append("creatorReservedPercentage", creatorReserved.toString());
    formData.append("openingParagraphWeight", openingWeight.toString());
    formData.append("continuationParagraphWeight", continuationWeight.toString());
    formData.append("finalParagraphWeight", finalWeight.toString());

    startTransition(async () => {
      const res = await createStoryAction(formData);
      if (res.success && res.slug) {
        toast.success("Story successfully initiated! Round 1 is now open.");
        router.push(`/stories/${res.slug}`);
      } else {
        toast.error(res.error || t("createStory.errors.launchFailed") || "Failed to create story.");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8 space-y-2 text-start">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t("createStory.openingSectionTitle") || "Genesis Paragraph"}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)]">
          {t("createStory.heading") || "Plant the Seed of a New Story"}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t("createStory.subheading") ||
            "Craft the foundational opening paragraph. The community will compete round-by-round to weave the next chapters."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 text-start">
        {/* Core Info Card */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-700" /> {t("createStory.basicsTitle") || "Story Basics"}
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              {t("createStory.titleLabel") || "Story Title"} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("createStory.titlePlaceholder") || "e.g. The Clockmaker's Final Secret"}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-serif text-lg focus:outline-none focus:ring-2 focus:ring-amber-700/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              {t("createStory.loglineLabel") || "Premise / Short Logline (Optional)"}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("createStory.loglinePlaceholder") || "A brief teaser to orient competing contributors..."}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-2 focus:ring-amber-700/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)]">
                {t("createStory.genreLabel") || "Genre"}
              </label>
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
              <label className="text-xs font-semibold text-[var(--foreground)]">
                {t("createStory.languageLabel") || "Language"}
              </label>
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
              <label className="text-xs font-semibold text-[var(--foreground)]">
                {t("createStory.visibilityLabel") || "Visibility"}
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none"
              >
                <option value="public">{t("createStory.visibilityPublic") || "Public (Discovery feed)"}</option>
                <option value="unlisted">{t("createStory.visibilityUnlisted") || "Unlisted (Direct link only)"}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              {t("createStory.tagsLabel") || "Tags (Comma separated)"}
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t("createStory.tagsPlaceholder") || "steampunk, time-travel, mystery, noir"}
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Cover Artwork (2:3 Aspect Ratio) */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-700" /> {t("createStory.coverSectionTitle") || "Story Book Cover (Optional)"}
            </h2>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              {t("createStory.coverRatioBadge") || "Standard 2:3 Aspect Ratio"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  {t("createStory.coverUrlLabel") || "Cover Image URL"}
                </label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or Supabase storage link"
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-2 focus:ring-amber-700/30"
                />
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  {t("createStory.coverUrlHelper") ||
                    "Provide an HTTPS image link. Recommended size: 600×900px or 800×1200px."}
                </p>
              </div>

              {coverImageUrl && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">
                    {t("createStory.coverAltLabel") || "Accessibility Alt Text"}
                  </label>
                  <input
                    type="text"
                    value={coverAltText}
                    onChange={(e) => setCoverAltText(e.target.value)}
                    placeholder={t("createStory.coverAltPlaceholder") || "e.g. A silhouette of a clock tower"}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center">
              <p className="text-[11px] font-semibold text-[var(--muted-foreground)] mb-2 uppercase tracking-wider">
                Live Preview
              </p>
              <div className="w-36 sm:w-44 shadow-lg rounded-xl overflow-hidden border border-[var(--border)]">
                <StoryCover
                  coverUrl={coverImageUrl}
                  altText={coverAltText}
                  title={title.trim() || "Your Story Title"}
                  genre={genre}
                  authorName={user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Author"}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Opening Paragraph Card */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
              <Feather className="w-4 h-4 text-amber-700" /> {t("createStory.openingSectionTitle") || "Opening Paragraph"}
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
                {isOpeningValid
                  ? t("createStory.openingStatusValid", { count: analysis.sentenceCount })
                  : t("createStory.openingStatusInvalid", { count: analysis.sentenceCount })}
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
            placeholder={
              t("createStory.openingPlaceholder") ||
              "Write the opening hook (2 to 5 sentences). Set the setting, protagonist, and opening tension..."
            }
            className="w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] story-font text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-amber-700/30 leading-relaxed"
          />

          {openingText.length > 0 && !isOpeningValid && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {t("createStory.openingStatusInvalid", { count: analysis.sentenceCount })}
            </p>
          )}
        </div>

        {/* Story Evolution Rules Card */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700" /> {t("createStory.governanceSectionTitle") || "Story Evolution Rules"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Max Paragraphs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  {t("createStory.maxParagraphsLabel") || "Total Story Length"}
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
                {t("createStory.maxParagraphsHelper") || "Paragraph 1 is yours. Remaining paragraphs will be co-written by the community."}
              </p>
            </div>

            {/* Vote Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  {t("createStory.voteThresholdLabel") || "Vote Threshold"}
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
                {t("createStory.voteThresholdHelper") || "Minimum community votes a candidate needs to automatically win a round."}
              </p>
            </div>

            {/* Round Duration */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--foreground)]">
                {t("createStory.roundDurationLabel") || "Round Duration"}
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
                {t("createStory.roundDurationHelper") || "Time writers have to submit candidates and vote on each round."}
              </p>
            </div>
          </div>
        </div>

        {/* Co-author Revenue-Sharing Policy Card */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-700" /> {t("createStory.revenueSharingSectionTitle") || "Co-Author Revenue Sharing Policy"}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Choose how monetary appreciation (virtual gifts and competition prizes) will be distributed among you and future co-authors. Contributors must accept these terms before submitting.
            </p>
          </div>

          <RevenuePolicySelector
            policyType={policyType}
            onChangePolicyType={setPolicyType}
            creatorReserved={creatorReserved}
            onChangeCreatorReserved={setCreatorReserved}
            openingWeight={openingWeight}
            onChangeOpeningWeight={setOpeningWeight}
            continuationWeight={continuationWeight}
            onChangeContinuationWeight={setContinuationWeight}
            finalWeight={finalWeight}
            onChangeFinalWeight={setFinalWeight}
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
          >
            {t("common.cancel") || "Cancel"}
          </button>
          <button
            type="submit"
            disabled={isPending || !title.trim() || !isOpeningValid}
            className="px-7 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-semibold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("createStory.launchingButton") || "Planting Seed..."}</span>
              </>
            ) : (
              <>
                <Feather className="w-4 h-4" />
                <span>{t("createStory.launchStoryButton") || "Launch Story Seed"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
