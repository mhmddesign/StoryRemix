"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Feather, Sparkles, ArrowRight, BookOpen, Vote, CheckCircle2 } from "lucide-react";
import { trackReferralClickAction } from "@/app/actions/referral-actions";

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const refCode = searchParams.get("ref") || "";
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (refCode && !tracked) {
      trackReferralClickAction(refCode);
      setTracked(true);
      // Persist referral code in localStorage so registration picks it up even if user navigates around
      try {
        localStorage.setItem("storyremix_ref", refCode);
      } catch {}
    }
  }, [refCode, tracked]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-16 text-center space-y-8">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-600/10 text-amber-700 dark:text-amber-400 border border-amber-600/20 shadow-sm">
        <Sparkles className="w-4 h-4" />
        <span>Personal Literary Invitation</span>
      </div>

      {/* Main Title */}
      <div className="space-y-4">
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight">
          You&apos;ve Been Invited to Co-Author Stories
        </h1>
        <p className="text-base md:text-lg text-[var(--muted-foreground)] leading-relaxed max-w-xl mx-auto">
          A fellow writer has invited you to join <strong>StoryRemix</strong> — where stories unfold paragraph by paragraph through community imagination and democratic votes.
        </p>
      </div>

      {/* Referral Perks Card */}
      <div className="p-6 md:p-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-lg space-y-6 text-left">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <Feather className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <span className="font-serif font-bold text-base">Your Welcome Package</span>
          </div>
          {refCode && (
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[var(--muted)] text-[var(--foreground)] font-semibold">
              Code: {refCode}
            </span>
          )}
        </div>

        <div className="space-y-3.5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm">
              <strong>25 Free Welcome Points</strong> credited automatically upon registration.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm">
              <strong>Genesis & Round Voting Rights</strong>: vote in ongoing active rounds right away.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm">
              <strong>Immutable Attribution</strong>: permanent moral and creative credit on every accepted paragraph.
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Link
            href={`/register?ref=${encodeURIComponent(refCode)}`}
            className="flex-1 px-6 py-3.5 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <span>Accept Invitation & Register</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/explore"
            className="px-6 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 hover:bg-[var(--muted)] text-sm font-semibold flex items-center justify-center gap-2 transition-all text-[var(--foreground)]"
          >
            <BookOpen className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span>Browse First</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-[var(--muted-foreground)]">Loading invitation...</div>}>
      <JoinContent />
    </Suspense>
  );
}
