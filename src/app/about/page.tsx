import React from "react";
import { Feather, Users, Sparkles, BookOpen, GitFork } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <Feather className="w-3.5 h-3.5" />
          <span>Our Vision</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)]">
          Stories Are Better When We Write Them Together
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
          The philosophy, mechanism, and origins of StoryRemix.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed story-font text-[var(--foreground)]">
        <p>
          Throughout human history, storytelling was never an isolated act. Folktales, myths, and oral epics were remixed around campfires across generations—each teller adding nuance, sharpening suspense, and adapting characters to the spirit of the listener.
        </p>
        <p>
          StoryRemix brings this timeless collaborative instinct into the modern digital age. Rather than a solitary author laboring in a room, StoryRemix transforms writing into an interactive communal journey where one person plants the seed, and the community votes on each branch of the growing tree.
        </p>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-3 my-4 not-italic font-sans">
          <h3 className="font-serif text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <GitFork className="w-5 h-5 text-amber-700" /> The Defining Principle: Story Remixing
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            A story never has to end at one conclusion. When a story finishes, any reader can branch from any paragraph into an alternative timeline—creating an evolving multiverse of fiction where original authors are perpetually credited.
          </p>
        </div>
      </div>
    </div>
  );
}
