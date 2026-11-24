"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useLanguage } from "@/components/i18n/language-context";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
  PlusCircle,
  Compass,
  Flame,
  CheckCircle2,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  BookOpen,
  Bookmark,
  ShieldAlert,
  Trophy,
  Award,
  Gift,
  Coins,
  Sparkles,
  Share2,
  ChevronDown,
} from "lucide-react";

export function Navbar() {
  const { user, profile, wallet, signOut } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <BrandLogo size="md" />

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            <Compass className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>{t("explore") || "Explore"}</span>
          </Link>

          <Link
            href="/rounds"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>{t("activeRounds") || "Active Rounds"}</span>
          </Link>

          <Link
            href="/completed"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t("completed") || "Completed"}</span>
          </Link>

          <Link
            href="/leaderboards"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>{t("navigation.rankings") || "Rankings"}</span>
          </Link>

          <Link
            href="/store"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 font-semibold border border-amber-600/20 transition-all"
          >
            <Gift className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>Gift Store</span>
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2.5">
              {/* Dual-Currency Wallet Pill */}
              <Link
                href="/wallet"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] hover:border-amber-600/40 hover:bg-[var(--accent)] text-xs font-semibold shadow-xs transition-all"
                title="Your virtual wallet balance"
              >
                <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{wallet?.earned_points ?? 0}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)] font-normal">pts</span>
                </div>
                <span className="w-px h-3 bg-[var(--border)]" />
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-300">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{wallet?.purchased_credits ?? 0}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)] font-normal">cr</span>
                </div>
              </Link>

              {/* Start a Story Button */}
              <Link
                href="/stories/new"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t("startStory") || "Start Story"}</span>
              </Link>

              {/* Notifications */}
              <Link
                href="/notifications"
                className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] text-[var(--foreground)] relative transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-600/30 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                    {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "W"}
                  </div>
                  <span className="text-xs font-medium text-[var(--foreground)] max-w-[90px] truncate">
                    {profile?.display_name || profile?.username || "Writer"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[var(--muted-foreground)]" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                      <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                        {profile?.display_name || user.email?.split("@")[0] || "Writer"}
                      </p>
                      {profile?.username ? (
                        <p className="text-[11px] text-[var(--muted-foreground)] font-mono truncate">
                          @{profile.username}
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-700 font-medium">Setting up profile...</p>
                      )}
                    </div>

                    <Link
                      href={`/profile/${profile?.username || "me"}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[var(--accent)] text-[var(--foreground)]"
                    >
                      <User className="w-3.5 h-3.5 text-amber-700" />
                      <span>{t("profile") || "My Profile"}</span>
                    </Link>

                    <Link
                      href="/wallet"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[var(--accent)] text-[var(--foreground)] font-medium"
                    >
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      <span>Wallet &amp; Ledger</span>
                    </Link>

                    <Link
                      href="/referrals"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[var(--accent)] text-amber-800 dark:text-amber-300 font-semibold"
                    >
                      <Share2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Invite Friends (Earn Points)</span>
                    </Link>

                    <Link
                      href="/my-stories"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[var(--accent)] text-[var(--foreground)]"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      <span>{t("myStories") || "My Stories"}</span>
                    </Link>

                    <Link
                      href="/bookmarks"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[var(--accent)] text-[var(--foreground)]"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      <span>{t("saved") || "Saved Bookmarks"}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        window.dispatchEvent(new CustomEvent("storyremix:open-onboarding"));
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[var(--accent)] text-[var(--foreground)] cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Platform Guide</span>
                    </button>

                    {profile?.role && ["admin", "moderator"].includes(profile.role) && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[var(--accent)] text-amber-600 font-medium"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{t("adminDashboard") || "Admin Console"}</span>
                      </Link>
                    )}

                    <div className="border-t border-[var(--border)] mt-1 pt-1">
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-rose-500/10 text-rose-600 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t("signOut") || "Sign Out"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] text-xs font-semibold text-[var(--foreground)] transition-colors"
              >
                {t("signIn") || "Sign In"}
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white text-xs font-semibold shadow-xs transition-all"
              >
                {t("getStarted") || "Join Community"}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--border)] bg-[var(--card)] px-4 py-5 space-y-4 animate-in fade-in duration-150">
          {user && (
            <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                  {profile?.display_name?.charAt(0).toUpperCase() || "W"}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground)]">{profile?.display_name || "Writer"}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)] font-mono">@{profile?.username || "writer"}</p>
                </div>
              </div>
              <Link
                href="/wallet"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold text-xs border border-amber-600/30"
              >
                <Sparkles className="w-3 h-3" />
                <span>{wallet?.earned_points ?? 0} pts</span>
              </Link>
            </div>
          )}

          <nav className="flex flex-col space-y-1">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              <Compass className="w-4 h-4 text-amber-700" />
              <span>{t("explore") || "Explore Stories"}</span>
            </Link>

            <Link
              href="/rounds"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              <Flame className="w-4 h-4 text-amber-600" />
              <span>{t("activeRounds") || "Active Rounds"}</span>
            </Link>

            <Link
              href="/completed"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t("completed") || "Completed Anthology"}</span>
            </Link>

            <Link
              href="/leaderboards"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>{t("navigation.rankings") || "Leaderboards"}</span>
            </Link>

            <Link
              href="/store"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-500/10"
            >
              <Gift className="w-4 h-4 text-amber-700" />
              <span>Gift Store &amp; Super Likes</span>
            </Link>

            <Link
              href="/referrals"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              <Share2 className="w-4 h-4 text-amber-700" />
              <span>Invite Friends &amp; Earn Rewards</span>
            </Link>
          </nav>

          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
            <LanguageSwitcher />
            {user ? (
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors"
              >
                {t("signOut") || "Sign Out"}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)]"
                >
                  {t("signIn") || "Sign In"}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-800 text-white"
                >
                  {t("getStarted") || "Join"}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
