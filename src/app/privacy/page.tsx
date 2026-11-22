import React from "react";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Data Protection</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)]">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
          Last revised: November 2026
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-[var(--foreground)]">
        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold">1. Information We Collect</h2>
          <p className="text-[var(--muted-foreground)]">
            We collect only the information necessary to provide the storytelling service: your email address for authentication, your public username, display name, and avatar. We never sell your personal data to data brokers or third-party advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold">2. Analytics & Cookies</h2>
          <p className="text-[var(--muted-foreground)]">
            We use strictly necessary session cookies managed through Supabase Auth. Any product metrics recorded (e.g. story views or votes cast) are pseudonymized to understand platform growth under the AARRR framework without tracking individual browsing behavior across the web.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-base font-bold">3. Data Deletion & Export</h2>
          <p className="text-[var(--muted-foreground)]">
            You may request complete deletion of your account and personal profile at any time. When an account is deleted, personal profile data is purged, while published collaborative story paragraphs are retained anonymously to maintain narrative continuity for other co-authors.
          </p>
        </section>
      </div>
    </div>
  );
}
