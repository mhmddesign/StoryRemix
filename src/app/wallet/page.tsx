"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Coins,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ShieldCheck,
  CreditCard,
  Gift,
  Share2,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getWalletLedgerAction, WalletTransactionItem } from "@/app/actions/wallet-actions";

export default function WalletPage() {
  const { user, wallet } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [filter, setFilter] = useState<"all" | "earned_points" | "purchased_credits">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getWalletLedgerAction()
      .then((res) => {
        if (res.success) {
          setTransactions(res.transactions);
        }
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  const currentPoints = wallet?.earned_points ?? 150;
  const currentCredits = wallet?.purchased_credits ?? 10;

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true;
    return tx.currency === filter;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--foreground)] tracking-tight">
          Wallet &amp; Transaction Ledger
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Manage your virtual points, purchased credits, and double-entry transaction history.
        </p>
      </div>

      {/* Dual Currency Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Earned Points */}
        <div className="p-6 md:p-8 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-amber-500/10 via-[var(--card)] to-amber-700/5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Earned Points</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-600/10 text-amber-700 dark:text-amber-400 border border-amber-600/20">
              Participation Currency
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-4xl font-serif font-bold text-[var(--foreground)]">
              {currentPoints} <span className="text-xl text-[var(--muted-foreground)] font-sans">pts</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Earned by writing stories, winning rounds, voting, completing daily goals, and referring friends.
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--border)]/60 flex items-center gap-3">
            <Link
              href="/referrals"
              className="px-4 py-2 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Invite Friends (+100 pts)</span>
            </Link>
            <Link
              href="/rounds"
              className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] text-xs font-semibold text-[var(--foreground)] transition-colors"
            >
              Vote &amp; Write
            </Link>
          </div>
        </div>

        {/* Card 2: Purchased Credits */}
        <div className="p-6 md:p-8 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-emerald-500/10 via-[var(--card)] to-emerald-700/5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <Coins className="w-4 h-4" />
              <span>Purchased Credits</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/20">
              Prestige Currency
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-4xl font-serif font-bold text-[var(--foreground)]">
              {currentCredits} <span className="text-xl text-[var(--muted-foreground)] font-sans">cr</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Acquired through checkout to send premium recognition (Super Likes, Golden Quills, Spotlight awards) directly to creators.
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--border)]/60 flex items-center gap-3">
            <Link
              href="/store"
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Top Up in Store</span>
            </Link>
            <Link
              href="/store"
              className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] text-xs font-semibold text-[var(--foreground)] transition-colors"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>

      {/* Principles & Ethical Guarantee */}
      <div className="p-5 rounded-2xl bg-[var(--muted)]/30 border border-[var(--border)] flex items-start gap-3.5 text-xs text-[var(--muted-foreground)] leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-[var(--foreground)]">Transparent Virtual Economy:</strong> StoryRemix virtual points and credits are internal platform utilities designed to celebrate literary co-creation. Points represent recognition and community appreciation; they cannot be redeemed or cashed out for fiat currency.
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-[var(--foreground)]">Transaction History Ledger</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Immutable record of all debits, credits, rewards, and gift disbursements.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)] text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("earned_points")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === "earned_points"
                  ? "bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Points
            </button>
            <button
              onClick={() => setFilter("purchased_credits")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === "purchased_credits"
                  ? "bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Credits
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Currency</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredTransactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[var(--foreground)]">
                        <span className="capitalize">{tx.transaction_type.replace(/_/g, " ")}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--muted-foreground)]">{tx.description}</td>
                      <td className="py-3.5 px-4">
                        {tx.currency === "earned_points" ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                            <Sparkles className="w-3 h-3" /> Points
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <Coins className="w-3 h-3" /> Credits
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold inline-flex items-center gap-1 ${
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                          {isPositive ? `+${tx.amount}` : tx.amount}{" "}
                          {tx.currency === "earned_points" ? "pts" : "cr"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--muted-foreground)]">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-[var(--muted-foreground)] space-y-2">
            <Clock className="w-8 h-8 mx-auto text-[var(--muted-foreground)]/40" />
            <p>No transactions found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
