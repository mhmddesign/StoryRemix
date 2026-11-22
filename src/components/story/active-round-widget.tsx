"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import {
  submitContinuationAction,
  castVoteAction,
  finalizeRoundAction,
  resolveUnqualifiedRoundAction,
} from "@/app/actions/story-actions";
import { analyzeStoryText } from "@/lib/sentence-tokenizer";
import { formatTimeRemaining } from "@/lib/utils";
import {
  Clock,
  ThumbsUp,
  Feather,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Sparkles,
  Flame,
  RotateCcw,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export interface CandidateContribution {
  id: string;
  round_id: string;
  author_id: string;
  body: string;
  sentence_count: number;
  word_count: number;
  vote_count: number;
  status: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface StoryRoundData {
  id: string;
  story_id: string;
  round_number: number;
  paragraph_position: number;
  vote_threshold: number;
  deadline_at: string;
  status: "open" | "evaluating" | "awaiting_creator_resolution" | "resolved" | "cancelled";
  candidates: CandidateContribution[];
  userVotedContributionId: string | null;
  storyOwnerId: string;
}

interface ActiveRoundWidgetProps {
  round: StoryRoundData;
  storyId: string;
}

export function ActiveRoundWidget({ round, storyId }: ActiveRoundWidgetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  // Submission state
  const [submissionText, setSubmissionText] = useState("");
  const analysis = analyzeStoryText(submissionText);
  const isSubmissionValid = analysis.isValidForContinuation;

  // Countdown timer state
  const [timeInfo, setTimeInfo] = useState(() => formatTimeRemaining(round.deadline_at));

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = formatTimeRemaining(round.deadline_at);
      setTimeInfo(updated);
      // Auto-trigger round evaluation if expired and still open
      if (updated.isExpired && round.status === "open") {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [round.deadline_at, round.status]);

  const isStoryCreator = user?.id === round.storyOwnerId;
  const userHasSubmitted = round.candidates.some(
    (c) => c.author_id === user?.id && c.status === "active"
  );

  // Voting handler
  const handleVote = (candidateId: string, candidateAuthorId: string) => {
    if (!user) {
      toast.error("Please sign in to vote.");
      router.push("/login");
      return;
    }

    if (user.id === candidateAuthorId) {
      toast.error("You cannot vote for your own contribution.");
      return;
    }

    if (round.status !== "open" || timeInfo.isExpired) {
      toast.error("Voting deadline has passed.");
      return;
    }

    startTransition(async () => {
      const res = await castVoteAction(round.id, candidateId);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to record vote.");
      }
    });
  };

  // Submission handler
  const handleSubmitContinuation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to contribute.");
      router.push("/login");
      return;
    }

    if (!isSubmissionValid) {
      toast.error(analysis.validationError || "Continuation must be 2 to 3 sentences.");
      return;
    }

    startTransition(async () => {
      const res = await submitContinuationAction(storyId, round.id, submissionText);
      if (res.success) {
        toast.success(res.message);
        setSubmissionText("");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to submit continuation.");
      }
    });
  };

  // Round finalization trigger (when deadline passes)
  const handleFinalizeRound = () => {
    startTransition(async () => {
      const res = await finalizeRoundAction(round.id);
      if (res.success) {
        toast.success("Round finalized!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to finalize round.");
      }
    });
  };

  // Creator resolution handlers
  const handleCreatorResolution = (
    action: "extend" | "select_highest" | "cancel_and_reopen",
    selectedCandidateId?: string
  ) => {
    startTransition(async () => {
      const res = await resolveUnqualifiedRoundAction(round.id, action, selectedCandidateId);
      if (res.success) {
        toast.success("Decision recorded!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to apply decision.");
      }
    });
  };

  return (
    <div className="space-y-6 pt-6">
      {/* Round Header / Status Card */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600" /> Round {round.round_number}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                Filling Paragraph {round.paragraph_position}
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--foreground)]">
              Competing Continuations
            </h2>
          </div>

          {/* Countdown & Threshold */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)] flex items-center gap-2 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{timeInfo.formatted}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)] flex items-center gap-1.5 text-xs">
              <ThumbsUp className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-semibold text-amber-700">{round.vote_threshold}</span>
              <span className="text-[var(--muted-foreground)]">votes required</span>
            </div>
          </div>
        </div>

        {/* Deadline passed banner */}
        {timeInfo.isExpired && round.status === "open" && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Voting period has closed. The system can now tally votes and determine the winner.</span>
            </div>
            <button
              onClick={handleFinalizeRound}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shrink-0 cursor-pointer"
            >
              Tally & Conclude Round
            </button>
          </div>
        )}

        {/* Awaiting Creator Resolution Banner */}
        {round.status === "awaiting_creator_resolution" && (
          <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm text-[var(--foreground)]">
                Awaiting Story Creator Decision
              </h3>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              This round did not meet the {round.vote_threshold}-vote requirement or ended in a tie. The story creator can choose how to proceed:
            </p>

            {isStoryCreator ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleCreatorResolution("extend")}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" /> Extend by 24 Hours
                </button>
                <button
                  onClick={() => handleCreatorResolution("select_highest")}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Accept Highest Ranked Candidate
                </button>
                <button
                  onClick={() => handleCreatorResolution("cancel_and_reopen")}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen Round for New Submissions
                </button>
              </div>
            ) : (
              <p className="text-xs italic text-[var(--muted-foreground)]">
                Waiting for the story creator to break the tie or choose next steps...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {round.candidates.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-[var(--border)] text-center space-y-2">
            <Feather className="w-8 h-8 text-[var(--muted-foreground)] mx-auto opacity-50" />
            <h4 className="font-semibold text-sm text-[var(--foreground)]">
              No continuations submitted yet
            </h4>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
              Be the first writer to submit a 2-to-3 sentence continuation for Paragraph {round.paragraph_position}!
            </p>
          </div>
        ) : (
          round.candidates.map((candidate) => {
            const isUserAuthor = candidate.author_id === user?.id;
            const hasUserVotedForThis = round.userVotedContributionId === candidate.id;

            return (
              <div
                key={candidate.id}
                className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                  hasUserVotedForThis
                    ? "border-amber-700 bg-amber-700/5 shadow-md"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-amber-700/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    {/* Author & Sentence Badge */}
                    <div className="flex items-center gap-2 text-xs">
                      <Link
                        href={`/profile/${candidate.author.username}`}
                        className="font-semibold text-[var(--foreground)] hover:underline flex items-center gap-1.5"
                      >
                        <div className="w-5 h-5 rounded-full bg-amber-700/15 text-[10px] font-bold flex items-center justify-center">
                          {candidate.author.display_name?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <span>{candidate.author.display_name}</span>
                      </Link>
                      <span className="text-[var(--muted-foreground)]">•</span>
                      <span className="text-[11px] text-[var(--muted-foreground)]">
                        {candidate.sentence_count} sentences ({candidate.word_count} words)
                      </span>
                      {isUserAuthor && (
                        <span className="px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-700 font-medium text-[10px]">
                          Your Submission
                        </span>
                      )}
                    </div>

                    {/* Candidate Text */}
                    <p className="story-font text-base text-[var(--foreground)] leading-relaxed">
                      {candidate.body}
                    </p>
                  </div>

                  {/* Vote Action Button */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleVote(candidate.id, candidate.author_id)}
                      disabled={isPending || isUserAuthor || round.status !== "open" || timeInfo.isExpired}
                      title={
                        isUserAuthor
                          ? "You cannot vote for your own contribution"
                          : hasUserVotedForThis
                          ? "You voted for this candidate"
                          : "Vote for this continuation"
                      }
                      className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                        hasUserVotedForThis
                          ? "bg-amber-800 text-white shadow-sm"
                          : isUserAuthor
                          ? "opacity-50 cursor-not-allowed bg-[var(--accent)] text-[var(--muted-foreground)]"
                          : "border border-[var(--border)] hover:bg-[var(--accent)] text-[var(--foreground)]"
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasUserVotedForThis ? "fill-white" : ""}`} />
                      <span>{candidate.vote_count}</span>
                    </button>
                    {hasUserVotedForThis && (
                      <span className="text-[10px] text-amber-700 font-semibold">Voted</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submission Form (Only if round is open & user hasn't submitted yet) */}
      {round.status === "open" && !timeInfo.isExpired && (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <Feather className="w-4 h-4 text-amber-700" />
              Submit Your Continuation
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] flex items-center gap-1 ${
                  isSubmissionValid
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                }`}
              >
                {isSubmissionValid ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {analysis.sentenceCount} of 2–3 sentences
              </span>
              <span className="text-[var(--muted-foreground)]">
                {analysis.wordCount} words
              </span>
            </div>
          </div>

          {userHasSubmitted ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
              You have already submitted an active continuation for this round. To keep voting fair, each author has one active submission per round.
            </div>
          ) : (
            <form onSubmit={handleSubmitContinuation} className="space-y-3">
              <textarea
                rows={4}
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Write exactly 2 to 3 sentences continuing the plot. English, French, or Arabic punctuation supported..."
                className="w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] story-font text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/30 resize-none leading-relaxed"
              />

              {submissionText.length > 0 && !isSubmissionValid && (
                <p className="text-xs text-amber-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {analysis.validationError}
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Once submitted, the community will vote on your paragraph.
                </span>
                <button
                  type="submit"
                  disabled={isPending || !isSubmissionValid}
                  className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-semibold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Feather className="w-3.5 h-3.5" />
                      <span>Submit Continuation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
