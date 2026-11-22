import React from "react";
import { ShieldCheck, Feather, Heart, Sparkles, AlertTriangle } from "lucide-react";

export default function GuidelinesPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Platform Standards</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)]">
          Community & Writing Guidelines
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
          StoryRemix is a shared garden of narrative imagination. Here is how we ensure creativity thrives respectfully.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2">
          <h2 className="font-serif text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <Feather className="w-4 h-4 text-amber-700" /> 1. Respect the Established Plot
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Every continuation should build authentically upon the preceding paragraphs. Competing continuations are encouraged, but destructive trolling or abruptly violating established narrative logic ruins the collective experience.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2">
          <h2 className="font-serif text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700" /> 2. Fair & Honest Voting
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Voting should reward creativity, literary craft, and plot advancement. Voting for your own submission is disabled at the database level. Attempting to manipulate votes via sockpuppet accounts or coordinated brigading results in immediate suspension.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2">
          <h2 className="font-serif text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <Heart className="w-4 h-4 text-amber-700" /> 3. Human Dignity & Zero Harassment
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            We maintain zero tolerance for hate speech, harassment, discrimination, non-consensual personal information sharing, or sexually abusive content. Stories containing mature fiction must use appropriate tags.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2">
          <h2 className="font-serif text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" /> 4. Original Content & Attribution
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Only submit text you wrote. Do not paste copyrighted excerpts from commercial books or third-party authors without clear fair-use transformation. All final stories credit each contributor permanently.
          </p>
        </div>
      </div>
    </div>
  );
}
