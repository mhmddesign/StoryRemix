"use client";

import React, { useState } from "react";
import { Sparkles, Coins, X, Check, Heart, Feather, Award, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { sendParagraphGiftAction } from "@/app/actions/wallet-actions";

export interface ParagraphGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  segmentId: string;
  paragraphIndex: number;
  author: {
    id: string;
    display_name: string;
    username: string;
  };
  onGiftSent?: (giftSymbol: string) => void;
}

const GIFTS_CATALOG = [
  {
    code: "ink_feather",
    name: "Ink Feather",
    symbol: "🪶",
    currency: "earned_points" as const,
    cost: 25,
    tagline: "Graceful prose",
    description: "Appreciate elegant phrasing and vivid sentence construction.",
  },
  {
    code: "literary_rose",
    name: "Literary Rose",
    symbol: "🌹",
    currency: "earned_points" as const,
    cost: 50,
    tagline: "Emotional resonance",
    description: "For paragraphs that stir deep emotion or romantic intrigue.",
  },
  {
    code: "ancient_scroll",
    name: "Ancient Scroll",
    symbol: "📜",
    currency: "earned_points" as const,
    cost: 100,
    tagline: "Profound lore",
    description: "Honoring immersive worldbuilding and deep narrative depth.",
  },
  {
    code: "burning_star",
    name: "Burning Star",
    symbol: "⭐",
    currency: "earned_points" as const,
    cost: 200,
    tagline: "Literary brilliance",
    description: "Spotlight on a breathtaking continuation that elevated the story.",
  },
  {
    code: "crown_of_words",
    name: "Crown of Words",
    symbol: "👑",
    currency: "purchased_credits" as const,
    cost: 10,
    tagline: "Scribe Masterclass",
    description: "Premium recognition for an unforgettable climax or twist.",
  },
  {
    code: "super_like",
    name: "Super Like",
    symbol: "💖",
    currency: "earned_points" as const,
    cost: 50,
    isSuperLike: true,
    tagline: "Warm highlight glow",
    description: "Super Likes highlight this paragraph with a golden glow for all readers.",
  },
];

export function ParagraphGiftModal({
  isOpen,
  onClose,
  storyId,
  segmentId,
  paragraphIndex,
  author,
  onGiftSent,
}: ParagraphGiftModalProps) {
  const { user, wallet, refreshWallet } = useAuth();
  const [selectedGift, setSelectedGift] = useState(GIFTS_CATALOG[0]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentPoints = wallet?.earned_points ?? 150;
  const currentCredits = wallet?.purchased_credits ?? 10;

  const canAfford =
    selectedGift.currency === "earned_points"
      ? currentPoints >= selectedGift.cost
      : currentCredits >= selectedGift.cost;

  const handleSend = async () => {
    if (!user) {
      toast.error("Please sign in to send appreciation gifts.");
      return;
    }

    if (user.id === author.id) {
      toast.error("You cannot gift your own paragraph.");
      return;
    }

    if (!canAfford) {
      toast.error(
        `Insufficient ${
          selectedGift.currency === "earned_points" ? "Points" : "Credits"
        }. Visit the Store or participate in rounds to earn more!`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendParagraphGiftAction({
        storyId,
        segmentId,
        recipientId: author.id,
        giftCode: selectedGift.code,
        giftName: selectedGift.name,
        currency: selectedGift.currency,
        cost: selectedGift.cost,
        isSuperLike: selectedGift.isSuperLike,
        message: message.trim(),
      });

      if (res.success) {
        toast.success(res.message);
        onGiftSent?.(selectedGift.symbol);
        refreshWallet();
        onClose();
      } else {
        toast.error(res.error || "Failed to send appreciation.");
      }
    } catch {
      toast.error("An error occurred while sending appreciation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-title"
        className="relative w-full max-w-lg bg-[var(--card)] text-[var(--foreground)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
      >
        {/* Header */}
        <div className="border-b border-[var(--border)] bg-[var(--muted)]/20 px-6 py-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Paragraph Appreciation</span>
            </div>
            <h2 id="gift-title" className="font-serif text-lg font-bold">
              Gift Paragraph {paragraphIndex}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Penned by <strong className="text-[var(--foreground)]">{author.display_name}</strong> (@{author.username})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Status */}
        <div className="bg-[var(--muted)]/40 px-6 py-2.5 border-b border-[var(--border)] flex items-center justify-between text-xs">
          <span className="text-[var(--muted-foreground)]">Your Balances:</span>
          <div className="flex items-center gap-4 font-semibold">
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" /> {currentPoints} pts
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Coins className="w-3.5 h-3.5" /> {currentCredits} cr
            </span>
          </div>
        </div>

        {/* Gift Selection Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Choose an Appreciation Gift
          </div>

          <div className="grid grid-cols-2 gap-3">
            {GIFTS_CATALOG.map((gift) => {
              const isSelected = selectedGift.code === gift.code;
              return (
                <button
                  key={gift.code}
                  type="button"
                  onClick={() => setSelectedGift(gift)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "border-amber-700 bg-amber-500/10 ring-1 ring-amber-700"
                      : "border-[var(--border)] bg-[var(--card)] hover:border-amber-600/40"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{gift.symbol}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          gift.currency === "earned_points"
                            ? "bg-amber-700/10 text-amber-800 dark:text-amber-300"
                            : "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {gift.cost} {gift.currency === "earned_points" ? "pts" : "cr"}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-[var(--foreground)]">{gift.name}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)] leading-tight">{gift.tagline}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Note Input */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Personal Note to Author (Optional)
            </label>
            <input
              type="text"
              maxLength={150}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Your description of the lantern was sublime!"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/30"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[11px] text-[var(--muted-foreground)] flex items-start gap-2">
            <Award className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Direct Attribution:</strong> 70% of the virtual points value is credited directly to <strong>{author.display_name}</strong> to recognize their contribution!
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] bg-[var(--muted)]/20 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSubmitting || !canAfford}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? "Sending..."
                : !canAfford
                ? "Insufficient Balance"
                : `Send ${selectedGift.name} (${selectedGift.cost} ${
                    selectedGift.currency === "earned_points" ? "pts" : "cr"
                  })`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
