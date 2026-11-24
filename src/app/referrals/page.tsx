"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Copy,
  Check,
  Share2,
  Sparkles,
  Award,
  ArrowRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  MessageCircle,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { getReferralDashboardData, ReferralStats } from "@/app/actions/referral-actions";
import { useAuth } from "@/components/auth/auth-provider";

export default function ReferralDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getReferralDashboardData()
      .then((data) => setStats(data))
      .finally(() => setIsLoading(false));
  }, [user]);

  const copyToClipboard = () => {
    if (!stats?.referralUrl) return;
    navigator.clipboard.writeText(stats.referralUrl);
    setCopied(true);
    toast.success("Referral invitation link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!stats?.referralUrl) return;
    const text = encodeURIComponent(
      `Join me on StoryRemix to co-author stories and vote on living narratives! Use my invitation link: ${stats.referralUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const shareTwitter = () => {
    if (!stats?.referralUrl) return;
    const text = encodeURIComponent(
      `I'm co-authoring collaborative literature on @StoryRemix. Join me and shape the next chapter: ${stats.referralUrl}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareEmail = () => {
    if (!stats?.referralUrl) return;
    const subject = encodeURIComponent("Join me on StoryRemix - Collaborative Fiction");
    const body = encodeURIComponent(
      `Hi,\n\nI wanted to invite you to StoryRemix, a collaborative storytelling platform where writers and readers co-author stories one paragraph at a time.\n\nSign up using my link: ${stats.referralUrl}\n\nHope to write with you there!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-amber-900/10 via-[var(--card)] to-amber-600/5 p-8 md:p-12 shadow-sm">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-600/10 text-amber-700 dark:text-amber-400 border border-amber-600/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>StoryRemix Creator Growth Engine</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight">
            Invite Writers. Grow the Circle.
          </h1>
          <p className="text-sm md:text-base text-[var(--muted-foreground)] leading-relaxed">
            Storytelling thrives on multiple voices. Invite fellow novelists, poets, and avid readers to StoryRemix. You will receive <strong>100 Earned Points</strong> for each friend who completes their first literary round, and they get <strong>25 Welcome Points</strong>.
          </p>
        </div>
      </div>

      {/* Referral Link & Social Sharing Bar */}
      <div className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-6">
        <div>
          <h2 className="font-serif text-xl font-bold text-[var(--foreground)]">Your Personal Invitation Link</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Share this link across social channels, group chats, or directly via email.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              readOnly
              value={stats?.referralUrl || "https://storyremix-green.vercel.app/join?ref=..."}
              className="w-full text-sm font-mono px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] select-all focus:outline-none"
            />
          </div>
          <button
            onClick={copyToClipboard}
            className="px-6 py-3 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied to Clipboard" : "Copy Link"}</span>
          </button>
        </div>

        {/* 1-Click Social Sharing */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <span className="text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">
            Share via:
          </span>
          <button
            onClick={shareWhatsApp}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/20 text-xs font-semibold transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          <button
            onClick={shareTwitter}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-sky-600/30 bg-sky-600/10 text-sky-700 dark:text-sky-400 hover:bg-sky-600/20 text-xs font-semibold transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>X / Twitter</span>
          </button>
          <button
            onClick={shareEmail}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 text-[var(--foreground)] hover:bg-[var(--muted)] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" /> Email
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2">
          <div className="text-xs font-medium text-[var(--muted-foreground)]">Link Clicks</div>
          <div className="text-3xl font-bold font-serif text-[var(--foreground)]">
            {isLoading ? "..." : stats?.clicksCount || 0}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)]">Total invitation link visits</div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2">
          <div className="text-xs font-medium text-[var(--muted-foreground)]">Registered Scribes</div>
          <div className="text-3xl font-bold font-serif text-[var(--foreground)]">
            {isLoading ? "..." : stats?.registeredCount || 0}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)]">Accounts created via your link</div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2">
          <div className="text-xs font-medium text-[var(--muted-foreground)]">Qualified Referrals</div>
          <div className="text-3xl font-bold font-serif text-amber-700 dark:text-amber-400">
            {isLoading ? "..." : stats?.qualifiedCount || 0}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)]">Completed onboarding & round action</div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2">
          <div className="text-xs font-medium text-[var(--muted-foreground)]">Points Earned</div>
          <div className="text-3xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
            {isLoading ? "..." : `${stats?.totalPointsEarned || 0} ✨`}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)]">Credited directly to your wallet</div>
        </div>
      </div>

      {/* How Qualification Works */}
      <div className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-6">
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-bold text-[var(--foreground)]">How Referral Qualification Works</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            To maintain an authentic literary environment, rewards are triggered only when invited users become real participants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-semibold text-sm">Friend Joins</h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Your friend signs up using your exclusive link and confirms their profile.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-semibold text-sm">First Meaningful Action</h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              They finish onboarding, cast a democratic vote on an active round, or submit a continuation sentence.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-semibold text-sm">Rewards Disbursed</h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              You automatically receive 100 Earned Points, and your friend gets 25 Welcome Points.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] flex items-start gap-3 text-xs text-[var(--muted-foreground)]">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Anti-Abuse Standards:</strong> Self-referral, fake identities, and automated bots are filtered automatically. Points earned from referrals are internal platform currencies with no cash redemption claims.
          </span>
        </div>
      </div>

      {/* Recent Referral Activity Table */}
      <div className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
        <h2 className="font-serif text-xl font-bold text-[var(--foreground)]">Recent Referral Activity</h2>
        {stats?.recentReferrals && stats.recentReferrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Activity</th>
                  <th className="py-3 px-4 font-semibold">Reward</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {stats.recentReferrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[var(--foreground)]">
                      {ref.username}
                    </td>
                    <td className="py-3.5 px-4">
                      {ref.status === "rewarded" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/20">
                          <Check className="w-3 h-3" /> Rewarded
                        </span>
                      ) : ref.status === "qualified" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-600/10 text-amber-700 dark:text-amber-400 border border-amber-600/20">
                          <Clock className="w-3 h-3" /> Qualified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600/10 text-blue-700 dark:text-blue-400 border border-blue-600/20">
                          <Clock className="w-3 h-3" /> Pending Action
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--muted-foreground)]">
                      {ref.qualifyingAction || "Awaiting first round action"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      +{ref.rewardPoints} pts
                    </td>
                    <td className="py-3.5 px-4 text-[var(--muted-foreground)]">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-[var(--muted-foreground)]">
            No referral invitations recorded yet. Share your invitation link above to get started!
          </div>
        )}
      </div>
    </div>
  );
}
