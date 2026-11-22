import Link from "next/link";
import { fetchCompetitionsAction } from "@/app/actions/competition-actions";
import {
  Trophy,
  Award,
  Calendar,
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  ArrowRight,
} from "lucide-react";

export default async function CompetitionsPage() {
  const competitions = await fetchCompetitionsAction();

  return (
    <div className="space-y-10 py-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Official Literary Awards</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[var(--foreground)] tracking-tight">
          Prize Competitions & Anthology Honors
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
          Monthly and annual community competitions recognizing exceptional collaborative fiction. Winning stories share prizes among all credited co-authors under transparent revenue policies.
        </p>
      </div>

      {/* Featured Current Competitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Competition Card */}
        <div className="p-8 rounded-3xl border border-amber-700/30 bg-gradient-to-br from-amber-700/5 via-[var(--card)] to-amber-700/10 space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Monthly Cup
              </span>
              <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Ends Nov 30, 2026
              </span>
            </div>

            <h2 className="font-serif text-2xl font-bold text-[var(--foreground)]">
              November 2026 Collaborative Anthology Cup
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Awarded to the most engaging collaborative story completed or advancing this month. Evaluated by community votes, co-author diversity, and reader acclaim.
            </p>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-[var(--muted-foreground)] block">Honorary Prize Pool</span>
                <span className="font-mono text-xl font-bold text-amber-700">$500.00 USD</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-600 font-semibold block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Guaranteed Funded
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)]">Platform Sponsored</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <h4 className="text-[11px] font-semibold text-[var(--foreground)] uppercase tracking-wider">
              Eligibility Criteria
            </h4>
            <ul className="text-xs text-[var(--muted-foreground)] space-y-1">
              <li className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" /> At least 2 distinct co-authors credited
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Minimum 4 canonical paragraphs
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> No unresolved moderation strikes
              </li>
            </ul>
          </div>
        </div>

        {/* Annual Grand Anthology Card */}
        <div className="p-8 rounded-3xl border border-amber-600/40 bg-gradient-to-br from-amber-600/10 via-[var(--card)] to-amber-700/15 space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-600/15 text-amber-900 dark:text-amber-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-600" /> Annual Laureate
              </span>
              <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Dec 31, 2026
              </span>
            </div>

            <h2 className="font-serif text-2xl font-bold text-[var(--foreground)]">
              2026 Story of the Year Laureate
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              The premier annual honor celebrating the most profound, imaginative, and widely read community-crafted narrative of the year.
            </p>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-[var(--muted-foreground)] block">Annual Prize Pool</span>
                <span className="font-mono text-xl font-bold text-amber-700">$2,500.00 USD</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-amber-700 font-semibold block flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Permanent Laureate Badge
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)]">Credited to all authors</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <h4 className="text-[11px] font-semibold text-[var(--foreground)] uppercase tracking-wider">
              Prize Allocation Rule
            </h4>
            <p className="text-xs text-[var(--muted-foreground)]">
              Prizes are automatically split among all winning authors based on the story&apos;s creator-configured and community-consented Revenue Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Compliance & Regulatory Transparency */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-3 text-xs">
        <h3 className="font-serif text-base font-bold text-[var(--foreground)] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Prize Compliance & Consumer Protection Standards
        </h3>
        <p className="text-[var(--muted-foreground)] leading-relaxed">
          StoryRemix prize competitions adhere strictly to competitive integrity standards. Entry into competitions is 100% free; participation fees are never charged. Paid gifts, reactions, or XP cannot buy ranking positions, and winners are determined through verified algorithmic participation metrics under administrative fraud review. Real monetary prize disbursements remain paused pending full Moroccan financial and international marketplace compliance approval.
        </p>
      </div>
    </div>
  );
}
