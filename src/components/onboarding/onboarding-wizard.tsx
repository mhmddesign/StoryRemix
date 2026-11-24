"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Feather,
  BookOpen,
  Vote,
  Sparkles,
  Coins,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Copy,
  Check,
  Share2,
  Globe,
  Compass,
  Bookmark,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { saveOnboardingStepAction, completeOnboardingAction } from "@/app/actions/onboarding-actions";
import { getOrCreateReferralCode } from "@/app/actions/referral-actions";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
  initialInterests?: string[];
  initialLanguage?: string;
}

const AVAILABLE_GENRES = [
  { id: "fantasy", label: "Fantasy", icon: "🐉" },
  { id: "sci-fi", label: "Science Fiction", icon: "🚀" },
  { id: "mystery", label: "Mystery & Detective", icon: "🔍" },
  { id: "literary", label: "Literary Fiction", icon: "📖" },
  { id: "thriller", label: "Psychological Thriller", icon: "⚡" },
  { id: "horror", label: "Gothic & Horror", icon: "🕯️" },
  { id: "romance", label: "Romance & Drama", icon: "🌹" },
  { id: "historical", label: "Historical Fiction", icon: "🏛️" },
  { id: "adventure", label: "Adventure & Myth", icon: "🧭" },
  { id: "philosophy", label: "Philosophical & Speculative", icon: "✨" },
];

const FEATURED_CREATORS = [
  {
    name: "Dr. Maya Lin",
    username: "mayalin_cyber",
    genre: "Science Fiction",
    followers: "1.4k",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Alexandre Dumas",
    username: "alexandre_dumas",
    genre: "Historical Fiction",
    followers: "2.1k",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Amina Al-Mansoor",
    username: "amina_mansoor",
    genre: "Speculative Fiction",
    followers: "980",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80",
  },
];

export function OnboardingWizard({
  isOpen,
  onClose,
  initialStep = 1,
  initialInterests = [],
  initialLanguage = "en",
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(Math.max(1, Math.min(initialStep, 7)));
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialInterests);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLanguage);
  const [referralLink, setReferralLink] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followedWriters, setFollowedWriters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      getOrCreateReferralCode().then((res) => {
        if (res.success) {
          setReferralLink(res.referralUrl);
          setReferralCode(res.code);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleFollow = (username: string) => {
    setFollowedWriters((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
    toast.success(
      !followedWriters[username]
        ? `Following @${username}`
        : `Unfollowed @${username}`
    );
  };

  const handleNext = async () => {
    if (currentStep < 7) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await saveOnboardingStepAction(nextStep, selectedInterests, selectedLanguage);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    if (currentStep < 7) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await saveOnboardingStepAction(nextStep, selectedInterests, selectedLanguage);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const res = await completeOnboardingAction(selectedInterests, selectedLanguage);
      if (res.success) {
        toast.success("Welcome aboard! 50 bonus points added to your wallet ✨");
        onClose();
        router.refresh();
      } else {
        toast.error("Could not complete onboarding. Please try again.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReferral = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative w-full max-w-2xl bg-[var(--card)] text-[var(--foreground)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
      >
        {/* Progress Bar & Header */}
        <div className="border-b border-[var(--border)] bg-[var(--muted)]/20 px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>StoryRemix Guide · Step {currentStep} of 7</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close guide"
              className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Progress track */}
          <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-600 to-amber-700 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: WELCOME & THE CONCEPT */}
          {currentStep === 1 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center shadow-inner">
                <Feather className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 id="onboarding-title" className="font-serif text-3xl font-bold tracking-tight">
                  One Story. Many Minds. Endless Possibilities.
                </h2>
                <p className="text-sm md:text-base text-[var(--muted-foreground)] max-w-lg mx-auto leading-relaxed">
                  Welcome to StoryRemix — an elegant literary ecosystem where authors and readers co-create living narratives, one paragraph at a time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2">
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="font-semibold text-sm">Plant the Genesis</h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    A writer crafts the opening chapter and sets the story rules.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="font-semibold text-sm">Compete in Rounds</h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    Writers submit the next 2-to-3 sentences in timed democratic rounds.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="font-semibold text-sm">Community Chooses</h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    Readers vote, the winning paragraph locks in, and the saga grows.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE INTERESTS */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 id="onboarding-title" className="font-serif text-2xl font-bold">
                  What Worlds Captivate You?
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Select your favorite genres to personalize your feed and round recommendations.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_GENRES.map((genre) => {
                  const isSelected = selectedInterests.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleInterest(genre.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-amber-700 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold shadow-sm"
                          : "border-[var(--border)] bg-[var(--card)] hover:border-amber-600/50 text-[var(--foreground)]"
                      }`}
                    >
                      <span className="text-xl">{genre.icon}</span>
                      <span className="text-xs md:text-sm">{genre.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-[var(--muted-foreground)] flex items-center justify-between">
                <span>{selectedInterests.length} genres selected</span>
                <span>You can adjust this anytime in your profile settings.</span>
              </div>
            </div>
          )}

          {/* STEP 3: LANGUAGE PREFERENCES */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 id="onboarding-title" className="font-serif text-2xl font-bold flex items-center gap-2">
                  <Globe className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                  Select Your Primary Literary Language
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  StoryRemix features full trilingual support with right-to-left layout optimization for Arabic.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { id: "en", name: "English", desc: "Original collaborative stories and worldwide rounds" },
                  { id: "fr", name: "Français", desc: "Littérature collaborative, salons d'écriture et récits francophones" },
                  { id: "ar", name: "العربية", desc: "سرد تعاوني متكامل مع خطوط أدبية وتنسيق أصيل من اليمين إلى اليسار" },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      selectedLanguage === lang.id
                        ? "border-amber-700 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold ring-1 ring-amber-700"
                        : "border-[var(--border)] bg-[var(--card)] hover:border-amber-600/50 text-[var(--foreground)]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold">{lang.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{lang.desc}</div>
                    </div>
                    {selectedLanguage === lang.id && (
                      <CheckCircle2 className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: DISCOVER COMMUNITY */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 id="onboarding-title" className="font-serif text-2xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                  Meet Fellow Scribes
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Connect with prominent writers and curators in the StoryRemix community.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {FEATURED_CREATORS.map((creator) => (
                  <div
                    key={creator.username}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={creator.avatar}
                        alt={creator.name}
                        className="w-11 h-11 rounded-full object-cover border border-[var(--border)]"
                      />
                      <div>
                        <div className="text-sm font-semibold">{creator.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          @{creator.username} · <span className="text-amber-700 dark:text-amber-400">{creator.genre}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFollow(creator.username)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        followedWriters[creator.username]
                          ? "bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]"
                          : "bg-amber-700 text-white hover:bg-amber-800"
                      }`}
                    >
                      {followedWriters[creator.username] ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: FIRST MEANINGFUL ACTION */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 id="onboarding-title" className="font-serif text-2xl font-bold flex items-center gap-2">
                  <Compass className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                  Your Creative Journey Begins
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  There are many ways to leave your mark. What would you like to explore first?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link
                  href="/rounds"
                  onClick={onClose}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-amber-700 hover:bg-amber-500/5 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                      <Vote className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-sm group-hover:text-amber-700 transition-colors">
                      Vote in Active Rounds
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      Cast your vote on competing candidate paragraphs to shape living stories.
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 pt-3 flex items-center gap-1">
                    Enter Rounds <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>

                <Link
                  href="/completed"
                  onClick={onClose}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-amber-700 hover:bg-amber-500/5 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-sm group-hover:text-emerald-700 transition-colors">
                      Read Completed Anthologies
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      Immerse yourself in fully finished novels created collaboratively by the community.
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 pt-3 flex items-center gap-1">
                    Explore Anthologies <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>

                <Link
                  href="/explore"
                  onClick={onClose}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-amber-700 hover:bg-amber-500/5 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                      <Bookmark className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-sm group-hover:text-purple-700 transition-colors">
                      Browse & Bookmark
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      Filter stories by genre and bookmark your favorite narratives for later reading.
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-purple-700 dark:text-purple-400 pt-3 flex items-center gap-1">
                    Discover Stories <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>

                <Link
                  href="/stories/new"
                  onClick={onClose}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-amber-700 hover:bg-amber-500/5 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-600/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                      <Feather className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-sm group-hover:text-amber-700 transition-colors">
                      Plant a New Genesis
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      Start your own collaborative saga by writing an opening chapter.
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 pt-3 flex items-center gap-1">
                    Start Writing <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* STEP 6: VIRTUAL ECONOMY EXPLAINER */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 id="onboarding-title" className="font-serif text-2xl font-bold flex items-center gap-2">
                  <Coins className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                  Virtual Points & Appreciation Economy
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Understand how appreciation, gifts, and community rewards work on StoryRemix.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-xl border border-[var(--border)] bg-amber-500/5 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-sm text-amber-700 dark:text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Earned Points (✨ pts)</span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    Earned entirely through platform contributions: writing paragraphs, winning rounds, voting fairly, completing daily goals, and referring fellow writers.
                  </p>
                  <div className="text-xs text-[var(--foreground)] font-medium pt-2 border-t border-[var(--border)]">
                    Used for: Unlocking literary badges, sending community appreciation gifts, and climbing creator leaderboards.
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-[var(--border)] bg-amber-500/5 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-sm text-amber-700 dark:text-amber-400">
                    <Coins className="w-4 h-4" />
                    <span>Purchased Credits (🪙 cr)</span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    Acquired through the Gift Store to send premium recognition (Super Likes, Golden Quills, Spotlight awards) directly to stories and individual paragraphs.
                  </p>
                  <div className="text-xs text-[var(--foreground)] font-medium pt-2 border-t border-[var(--border)]">
                    Direct Impact: Paragraph-level gifts directly recognize the specific author who penned that segment!
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)] text-xs text-[var(--muted-foreground)] flex items-start gap-2.5">
                <Award className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Ethical Guarantee:</strong> Points and credits are internal platform virtual currencies designed for recognition and fun. They cannot be redeemed for fiat cash.
                </span>
              </div>
            </div>
          )}

          {/* STEP 7: REFERRAL PROGRAM & WELCOME BONUS */}
          {currentStep === 7 && (
            <div className="space-y-6 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-600/10 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-600/20">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 id="onboarding-title" className="font-serif text-2xl font-bold">
                  Invite Writers. Earn Rewards.
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
                  Every friend who joins using your link and casts their first vote or writes a paragraph earns you <strong>100 Points</strong>!
                </p>
              </div>

              {/* Referral code card */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 max-w-md mx-auto space-y-3 text-left">
                <div className="text-xs font-semibold text-[var(--muted-foreground)]">Your Exclusive Invitation Link</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={referralLink || "https://storyremix-green.vercel.app/join?ref=SR-..."}
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={copyReferral}
                    className="px-3 py-2 rounded-lg bg-amber-700 text-white hover:bg-amber-800 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 max-w-md mx-auto flex items-center justify-center gap-2 text-xs font-semibold">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>You will receive 50 Welcome Points immediately upon completion!</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[var(--border)] bg-[var(--muted)]/20 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 7 && currentStep > 1 && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors px-2 py-1"
              >
                Skip for now
              </button>
            )}

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-700 text-white hover:bg-amber-800 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-amber-700 text-white hover:bg-amber-800 flex items-center gap-2 shadow-md transition-all cursor-pointer font-sans"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? "Finishing..." : "Claim 50 Pts & Begin"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
