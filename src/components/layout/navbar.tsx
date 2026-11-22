"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useLanguage } from "@/components/i18n/language-context";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import {
  Feather,
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
} from "lucide-react";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-amber-700/10 border border-amber-700/20 flex items-center justify-center text-amber-700 dark:text-amber-400 group-hover:scale-105 transition-transform">
            <Feather className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl tracking-tight text-[var(--foreground)]">
              StoryRemix
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)] tracking-wider uppercase font-medium">
              Collaborative Fiction
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>{t("explore")}</span>
          </Link>
          <Link
            href="/rounds"
            className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <Flame className="w-4 h-4 text-amber-600" />
            <span>{t("activeRounds")}</span>
          </Link>
          <Link
            href="/completed"
            className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t("completed")}</span>
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/stories/new"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t("startStory")}</span>
              </Link>

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
                >
                  <div className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                    {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-medium text-[var(--foreground)] max-w-[100px] truncate">
                    {profile?.display_name || profile?.username || "Writer"}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                      <p className="text-xs font-semibold text-[var(--foreground)]">
                        {profile?.display_name}
                      </p>
                      <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                        @{profile?.username}
                      </p>
                    </div>

                    <Link
                      href={`/profile/${profile?.username || user.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-[var(--accent)] text-[var(--foreground)]"
                    >
                      <User className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      <span>{t("profile")}</span>
                    </Link>

                    <Link
                      href="/my-stories"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-[var(--accent)] text-[var(--foreground)]"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      <span>{t("myStories")}</span>
                    </Link>

                    <Link
                      href="/bookmarks"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-[var(--accent)] text-[var(--foreground)]"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      <span>{t("saved")}</span>
                    </Link>

                    {profile?.role && ["admin", "moderator"].includes(profile.role) && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-[var(--accent)] text-amber-600 font-medium"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{t("adminDashboard")}</span>
                      </Link>
                    )}

                    <div className="border-t border-[var(--border)] mt-1 pt-1">
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-rose-500/10 text-rose-600 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t("signOut")}</span>
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
                className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] text-xs font-semibold text-[var(--foreground)] transition-colors"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {t("signUp")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--foreground)]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)] px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--accent)] text-sm font-medium"
            >
              <Compass className="w-4 h-4" />
              <span>{t("explore")}</span>
            </Link>
            <Link
              href="/rounds"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--accent)] text-sm font-medium"
            >
              <Flame className="w-4 h-4 text-amber-600" />
              <span>{t("activeRounds")}</span>
            </Link>
            <Link
              href="/completed"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--accent)] text-sm font-medium"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t("completed")}</span>
            </Link>
          </nav>

          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">Language</span>
            <LanguageSwitcher />
          </div>

          <div className="pt-2 border-t border-[var(--border)]">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/stories/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-amber-800 text-white text-sm font-semibold"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t("startStory")}</span>
                </Link>
                <Link
                  href={`/profile/${profile?.username || user.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--accent)] text-sm"
                >
                  <User className="w-4 h-4" />
                  <span>{t("profile")}</span>
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-rose-500/10 text-rose-600 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t("signOut")}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-center rounded-lg border border-[var(--border)] text-sm font-semibold"
                >
                  {t("signIn")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-center rounded-lg bg-amber-800 text-white text-sm font-semibold"
                >
                  {t("signUp")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
