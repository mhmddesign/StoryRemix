"use client";

import React from "react";
import Link from "next/link";
import { Feather, Heart } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-context";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--background)] py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-700/10 border border-amber-700/20 flex items-center justify-center text-amber-700 dark:text-amber-400">
                <Feather className="w-4 h-4" />
              </div>
              <span className="font-serif font-bold text-lg text-[var(--foreground)]">StoryRemix</span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm italic font-serif">
              &ldquo;{t("tagline")}&rdquo;
            </p>
            <p className="text-xs text-[var(--muted-foreground)] max-w-md">
              A collaborative social platform where writers and readers co-create narrative worlds, one community-curated paragraph at a time.
            </p>
          </div>

          {/* Platform Links */}
          <div className="space-y-3 text-xs">
            <h4 className="font-semibold text-[var(--foreground)] uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-[var(--muted-foreground)]">
              <li>
                <Link href="/explore" className="hover:text-[var(--foreground)] transition-colors">
                  All Stories
                </Link>
              </li>
              <li>
                <Link href="/rounds" className="hover:text-[var(--foreground)] transition-colors">
                  Open Voting Rounds
                </Link>
              </li>
              <li>
                <Link href="/completed" className="hover:text-[var(--foreground)] transition-colors">
                  Completed Anthology
                </Link>
              </li>
              <li>
                <Link href="/stories/new" className="hover:text-[var(--foreground)] transition-colors">
                  Start a Story
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Community */}
          <div className="space-y-3 text-xs">
            <h4 className="font-semibold text-[var(--foreground)] uppercase tracking-wider">Community & Trust</h4>
            <ul className="space-y-2 text-[var(--muted-foreground)]">
              <li>
                <Link href="/guidelines" className="hover:text-[var(--foreground)] transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[var(--foreground)] transition-colors">
                  About the Project
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--foreground)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--foreground)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--muted-foreground)] gap-4">
          <p>© {new Date().getFullYear()} StoryRemix. All collaborative rights preserved to attributed authors.</p>
          <p className="flex items-center gap-1">
            Crafted for creative minds with <Heart className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
          </p>
        </div>
      </div>
    </footer>
  );
}
