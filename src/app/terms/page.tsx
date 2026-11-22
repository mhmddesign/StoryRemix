import React from "react";
import { Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <Scale className="w-3.5 h-3.5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)]">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
          Last revised: November 2026
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-[var(--foreground)]">
        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold">1. Collaborative Authorship & Licensing</h2>
          <p className="text-[var(--muted-foreground)]">
            By submitting an opening paragraph or continuation to StoryRemix, you grant StoryRemix and its users an irrevocable, non-exclusive license to publish, display, distribute, and remix your contribution as part of the collaborative story. You retain personal moral attribution for every paragraph authored.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold">2. Voting Integrity & Fair Play</h2>
          <p className="text-[var(--muted-foreground)]">
            Users agree not to attempt to circumvent voting limits, engage in vote buying, or employ automated bots. Any manipulation of round outcomes will result in revocation of account privileges and deletion of disqualified submissions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold">3. Account Responsibility</h2>
          <p className="text-[var(--muted-foreground)]">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your username.
          </p>
        </section>
      </div>
    </div>
  );
}
