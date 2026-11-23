"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  X,
  Upload,
  ThumbsUp,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  submitCoverProposalAction,
  voteCoverProposalAction,
  acceptCoverProposalAction,
  rejectCoverProposalAction,
  fetchCoverProposalsAction,
} from "@/app/actions/cover-actions";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";

interface CoverProposalsModalProps {
  storyId: string;
  isCreator: boolean;
  currentCoverUrl?: string | null;
}

export function CoverProposalsModal({
  storyId,
  isCreator,
  currentCoverUrl,
}: CoverProposalsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);

  const { user } = useAuth();

  const loadProposals = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCoverProposalsAction(storyId);
      setProposals(data);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProposals();
    }
  }, [isOpen, storyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rightsConfirmed) {
      toast.error("Please confirm you have the rights to use this image.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("storyId", storyId);
    formData.append("imageUrl", imageUrl);
    formData.append("altText", altText);
    formData.append("rightsConfirmed", "true");

    try {
      const res = await submitCoverProposalAction(formData);
      if (res.success) {
        toast.success(res.message || "Cover proposal submitted!");
        setImageUrl("");
        setAltText("");
        setRightsConfirmed(false);
        setShowSubmitForm(false);
        await loadProposals();
      } else {
        toast.error(res.error || "Failed to submit proposal.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (proposalId: string) => {
    if (!user) {
      toast.error("Sign in to vote on covers.");
      return;
    }

    try {
      const res = await voteCoverProposalAction(proposalId);
      if (res.success) {
        setProposals((prev) =>
          prev.map((p) =>
            p.id === proposalId
              ? { ...p, hasVoted: res.voted, votes_count: res.votesCount }
              : p
          )
        );
      } else {
        toast.error(res.error || "Failed to vote.");
      }
    } catch {
      toast.error("An error occurred while voting.");
    }
  };

  const handleAccept = async (proposalId: string) => {
    try {
      const res = await acceptCoverProposalAction(storyId, proposalId);
      if (res.success) {
        toast.success(res.message || "Cover accepted!");
        setIsOpen(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to accept proposal.");
      }
    } catch {
      toast.error("Failed to accept cover.");
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      const res = await rejectCoverProposalAction(storyId, proposalId);
      if (res.success) {
        toast.success(res.message || "Proposal rejected.");
        await loadProposals();
      } else {
        toast.error(res.error || "Failed to reject proposal.");
      }
    } catch {
      toast.error("Failed to reject proposal.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)] text-xs font-semibold text-[var(--foreground)] transition-colors cursor-pointer"
      >
        <ImageIcon className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
        <span>Covers & Proposals</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="space-y-0.5">
                <h3 className="font-serif text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-700" />
                  <span>Story Cover Collaboration</span>
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Co-authors can propose alternative covers. The story creator decides the official edition.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submit New Proposal Button */}
            {!showSubmitForm && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSubmitForm(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Propose Alternative Cover</span>
                </button>
              </div>
            )}

            {/* Submission Form */}
            {showSubmitForm && (
              <form
                onSubmit={handleSubmit}
                className="p-4 rounded-2xl border border-amber-700/30 bg-amber-700/5 space-y-4 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-[var(--foreground)]">
                    Propose a New Cover Art
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowSubmitForm(false)}
                    className="text-xs text-[var(--muted-foreground)] hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">
                    Image URL (Recommended 2:3 book ratio)
                  </label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/my-cover.jpg"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">
                    Alt Text / Description (Accessibility)
                  </label>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Visual description of the cover art..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/50"
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-[var(--foreground)] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={rightsConfirmed}
                    onChange={(e) => setRightsConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-[var(--border)] text-amber-700 focus:ring-amber-700"
                  />
                  <span className="text-[11px] text-[var(--muted-foreground)] leading-tight">
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                    I confirm that I own or hold valid rights to use this image, and grant StoryRemix permission to display it.
                  </span>
                </label>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !rightsConfirmed || !imageUrl}
                    className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Submit for Consideration</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Proposals List */}
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-sm text-[var(--foreground)]">
                Community Proposals ({proposals.length})
              </h4>

              {isLoading ? (
                <div className="py-12 text-center text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                  <span>Loading cover proposals...</span>
                </div>
              ) : proposals.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
                  No community cover proposals yet. Be the first to suggest an alternative cover!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {proposals.map((p) => (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-2xl border bg-[var(--background)] flex flex-col justify-between gap-3 ${
                        p.status === "approved"
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : p.status === "rejected"
                          ? "border-rose-500/30 opacity-60"
                          : "border-[var(--border)]"
                      }`}
                    >
                      <div className="space-y-2">
                        {/* 2:3 Cover preview */}
                        <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-black/10 border border-[var(--border)]">
                          <img
                            src={p.image_url}
                            alt={p.alt_text || "Proposed cover"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute top-2 right-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.status === "approved"
                                  ? "bg-emerald-600 text-white"
                                  : p.status === "rejected"
                                  ? "bg-rose-600 text-white"
                                  : "bg-black/60 text-white backdrop-blur-xs"
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                          <span>
                            by @{p.proposer?.username || p.proposer?.display_name || "author"}
                          </span>
                          <span className="font-mono">{p.votes_count} votes</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
                        <button
                          onClick={() => handleVote(p.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            p.hasVoted
                              ? "bg-amber-700/10 text-amber-800 dark:text-amber-300 font-bold"
                              : "hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${p.hasVoted ? "fill-amber-700" : ""}`} />
                          <span>{p.hasVoted ? "Voted" : "Vote"}</span>
                        </button>

                        {isCreator && p.status === "pending" && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAccept(p.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              title="Accept as official cover"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Apply</span>
                            </button>
                            <button
                              onClick={() => handleReject(p.id)}
                              className="p-1.5 rounded-lg border border-rose-500/40 text-rose-600 hover:bg-rose-500/10 text-xs cursor-pointer"
                              title="Reject proposal"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
