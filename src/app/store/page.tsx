"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Coins,
  Gift,
  Heart,
  Award,
  Check,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Info,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { PAYMENT_PACKAGES, executeSandboxCheckoutAction } from "@/app/actions/payment-actions";

const STORE_GIFTS = [
  {
    code: "ink_feather",
    name: "Ink Feather",
    symbol: "🪶",
    cost: 25,
    currency: "earned_points" as const,
    category: "appreciation",
    tagline: "Graceful Prose",
    description: "Awarded to writers for fluent sentence rhythm, evocative phrasing, and clean literary style.",
  },
  {
    code: "literary_rose",
    name: "Literary Rose",
    symbol: "🌹",
    cost: 50,
    currency: "earned_points" as const,
    category: "appreciation",
    tagline: "Emotional Resonance",
    description: "For poignant, emotionally charged scenes, romance, and evocative dialogue.",
  },
  {
    code: "ancient_scroll",
    name: "Ancient Scroll",
    symbol: "📜",
    cost: 100,
    currency: "earned_points" as const,
    category: "appreciation",
    tagline: "Profound Lore",
    description: "Celebrates intricate worldbuilding, historical depth, and complex speculative myths.",
  },
  {
    code: "burning_star",
    name: "Burning Star",
    symbol: "⭐",
    cost: 200,
    currency: "earned_points" as const,
    category: "appreciation",
    tagline: "Literary Brilliance",
    description: "A spotlight award for standout paragraphs and climactic round victories.",
  },
  {
    code: "super_like",
    name: "Super Like",
    symbol: "💖",
    cost: 50,
    currency: "earned_points" as const,
    category: "prestige",
    tagline: "Golden Glow",
    description: "Adds an enduring subtle warm amber glow around the appreciated paragraph for all readers.",
  },
  {
    code: "golden_lyre",
    name: "Golden Lyre",
    symbol: "🎵",
    cost: 350,
    currency: "earned_points" as const,
    category: "prestige",
    tagline: "Poetic Majesty",
    description: "Honors lyrical prose, poetic meters, and legendary storytelling cadences.",
  },
  {
    code: "crown_of_words",
    name: "Crown of Words",
    symbol: "👑",
    cost: 10,
    currency: "purchased_credits" as const,
    category: "prestige",
    tagline: "Scribe Masterclass",
    description: "Premium recognition for masterpiece stories and unforgettable plot twists.",
  },
  {
    code: "community_spotlight",
    name: "Community Spotlight",
    symbol: "🏆",
    cost: 20,
    currency: "purchased_credits" as const,
    category: "prestige",
    tagline: "Featured Tribute",
    description: "Boosts author visibility and pins this tribute to the story reader highlight section.",
  },
];

export default function StorePage() {
  const { user, wallet, refreshWallet } = useAuth();
  const [activeTab, setActiveTab] = useState<"gifts" | "credits">("gifts");
  const [purchasingPkgId, setPurchasingPkgId] = useState<string | null>(null);

  const currentPoints = wallet?.earned_points ?? 150;
  const currentCredits = wallet?.purchased_credits ?? 10;

  const handleBuyCredits = async (packageId: string) => {
    if (!user) {
      toast.error("Please sign in to purchase credits.");
      return;
    }

    setPurchasingPkgId(packageId);
    try {
      const res = await executeSandboxCheckoutAction(packageId);
      if (res.success) {
        toast.success(res.message);
        refreshWallet();
      } else {
        toast.error(res.error || "Payment checkout failed.");
      }
    } catch {
      toast.error("An unexpected error occurred during checkout.");
    } finally {
      setPurchasingPkgId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-amber-900/10 via-[var(--card)] to-amber-600/5 p-8 md:p-12 shadow-sm">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-600/10 text-amber-700 dark:text-amber-400 border border-amber-600/20">
            <Gift className="w-3.5 h-3.5" />
            <span>StoryRemix Gift Emporium & Virtual Economy</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight">
            Appreciate Authors. Celebrate Words.
          </h1>
          <p className="text-sm md:text-base text-[var(--muted-foreground)] leading-relaxed">
            Support the collaborative writers crafting stories you love. Send literary appreciation gifts directly to stories or individual paragraphs using <strong>Earned Points</strong> or <strong>Purchased Credits</strong>.
          </p>
        </div>
      </div>

      {/* Wallet Balance Strip */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <div className="text-xs text-[var(--muted-foreground)] font-medium">Your Earned Points</div>
            <div className="text-2xl font-bold font-serif flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
              <span>{currentPoints} pts</span>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-[var(--border)] hidden sm:block" />
          <div className="space-y-1">
            <div className="text-xs text-[var(--muted-foreground)] font-medium">Your Purchased Credits</div>
            <div className="text-2xl font-bold font-serif flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Coins className="w-5 h-5" />
              <span>{currentCredits} cr</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/referrals"
            className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] text-xs font-semibold text-[var(--foreground)] transition-colors"
          >
            Earn Free Points (+100)
          </Link>
          <button
            onClick={() => setActiveTab("credits")}
            className="px-5 py-2 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            Top Up Credits
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] gap-8 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("gifts")}
          className={`pb-3 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "gifts"
              ? "border-b-2 border-amber-700 text-amber-800 dark:text-amber-400"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Virtual Gifts Catalog ({STORE_GIFTS.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("credits")}
          className={`pb-3 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "credits"
              ? "border-b-2 border-amber-700 text-amber-800 dark:text-amber-400"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Credit Packages ({PAYMENT_PACKAGES.length})</span>
        </button>
      </div>

      {/* Tab 1: Virtual Gifts Catalog */}
      {activeTab === "gifts" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {STORE_GIFTS.map((gift) => (
              <div
                key={gift.code}
                className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-amber-600/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl p-2 rounded-xl bg-[var(--muted)]/50">{gift.symbol}</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        gift.currency === "earned_points"
                          ? "bg-amber-700/10 text-amber-800 dark:text-amber-300"
                          : "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {gift.cost} {gift.currency === "earned_points" ? "pts" : "cr"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[var(--foreground)]">{gift.name}</h3>
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">{gift.tagline}</div>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{gift.description}</p>
                </div>

                <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--muted-foreground)]">Direct 70% author credit</span>
                  <Link
                    href="/explore"
                    className="font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Use in Story</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] text-xs text-[var(--muted-foreground)] flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Where to gift:</strong> You can gift entire stories or individual paragraphs! Look for the <strong>Gift Author</strong> button beneath any paragraph in the story reader.
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: Credit Packages */}
      {activeTab === "credits" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PAYMENT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="relative p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-amber-600/50 shadow-sm flex flex-col justify-between space-y-6"
              >
                {pkg.badge && (
                  <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-700 text-white shadow-sm uppercase tracking-wider">
                    {pkg.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-xl text-[var(--foreground)]">{pkg.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)] leading-snug">{pkg.description}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl font-bold font-serif text-[var(--foreground)]">{pkg.priceFormatted}</div>
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {pkg.credits} Purchased Credits
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    {pkg.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[var(--foreground)]">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleBuyCredits(pkg.id)}
                  disabled={purchasingPkgId === pkg.id}
                  className="w-full py-2.5 rounded-xl bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {purchasingPkgId === pkg.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Coins className="w-3.5 h-3.5" />
                      <span>Buy in Sandbox ({pkg.priceFormatted})</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Regional Payment Feasibility & Sandbox Notice */}
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-amber-500/5 space-y-3 text-xs leading-relaxed">
            <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-400 text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Production Payment & Regional Feasibility Architecture</span>
            </div>
            <p className="text-[var(--muted-foreground)]">
              StoryRemix uses a server-side payment architecture. For international and regional creator economies (such as Morocco and MENA), international cards are processed via Stripe / LemonSqueezy, with architectural readiness for local Moroccan interbank rails (CMI / Moroccan Dirham dotation e-commerce).
            </p>
            <p className="text-[var(--muted-foreground)]">
              In this preview environment, checkout runs in <strong>Deterministic Sandbox Mode</strong>: clicking &quot;Buy in Sandbox&quot; simulates a verified payment webhook, registers an order in the database, and credits your wallet immediately without real billing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
