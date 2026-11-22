"use client";

import React, { useState, useTransition } from "react";
import { sendGiftAction } from "@/app/actions/economy-actions";
import { Gift, Sparkles, X, Check, Loader2, ShieldCheck, Heart } from "lucide-react";
import { toast } from "sonner";

const GIFTS = [
  { code: "rose", name: "Literary Rose", symbol: "🌹", priceCents: 100, creatorShare: "70%" },
  { code: "golden_quill", name: "Golden Quill", symbol: "🪶", priceCents: 300, creatorShare: "75%" },
  { code: "book_stack", name: "Bibliophile Stack", symbol: "📚", priceCents: 500, creatorShare: "75%" },
  { code: "spotlight", name: "Community Spotlight", symbol: "⭐", priceCents: 1000, creatorShare: "80%" },
  { code: "trophy", name: "Narrative Trophy", symbol: "🏆", priceCents: 2000, creatorShare: "80%" },
  { code: "crown", name: "Storytelling Crown", symbol: "👑", priceCents: 5000, creatorShare: "85%" },
];

export function GiftModal({
  storyId,
  storyTitle,
  uniqueAuthorsCount = 1,
}: {
  storyId: string;
  storyTitle: string;
  uniqueAuthorsCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState(GIFTS[0]);
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    startTransition(async () => {
      const res = await sendGiftAction(storyId, selectedGift.code);
      if (res.success) {
        toast.success(res.message);
        setIsOpen(false);
      } else {
        toast.error(res.error || "Failed to send gift.");
      }
    });
  };

  const dollars = (selectedGift.priceCents / 100).toFixed(2);
  const poolDollars = (
    (selectedGift.priceCents * parseInt(selectedGift.creatorShare)) /
    10000
  ).toFixed(2);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-xl border border-amber-700/30 bg-amber-700/5 hover:bg-amber-700/10 text-amber-800 dark:text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <Gift className="w-3.5 h-3.5" />
        <span>Award Gift</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
                  Support Authors of &ldquo;{storyTitle}&rdquo;
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Mode Disclaimer */}
            <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Sandbox Test Mode:</strong> Gifts demonstrate the creator economy and revenue-sharing ledger without real monetary debit.
              </span>
            </div>

            {/* Gift Catalog Grid */}
            <div className="grid grid-cols-3 gap-3">
              {GIFTS.map((g) => {
                const isSelected = selectedGift.code === g.code;
                return (
                  <button
                    key={g.code}
                    type="button"
                    onClick={() => setSelectedGift(g)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                      isSelected
                        ? "border-amber-700 bg-amber-700/10 shadow-sm"
                        : "border-[var(--border)] bg-[var(--background)] hover:border-amber-700/40"
                    }`}
                  >
                    <span className="text-2xl">{g.symbol}</span>
                    <span className="font-bold text-[11px] text-[var(--foreground)] block">
                      {g.name}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold block">
                      ${(g.priceCents / 100).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Price & Allocation Breakdown */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2">
              <h4 className="font-semibold text-[var(--foreground)] flex items-center justify-between">
                <span>Payment & Co-Author Distribution</span>
                <span className="font-mono text-amber-700 font-bold">${dollars} USD</span>
              </h4>
              <div className="space-y-1 text-[11px] text-[var(--muted-foreground)]">
                <div className="flex justify-between">
                  <span>Author Revenue Pool ({selectedGift.creatorShare}):</span>
                  <span className="font-semibold text-emerald-600">${poolDollars}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Operations Fee:</span>
                  <span>${((selectedGift.priceCents * (100 - parseInt(selectedGift.creatorShare))) / 10000).toFixed(2)}</span>
                </div>
                <div className="pt-1 border-t border-[var(--border)] flex justify-between text-xs font-semibold text-[var(--foreground)]">
                  <span>Distributed Among:</span>
                  <span>{uniqueAuthorsCount} Credited Co-Authors</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] font-semibold text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Send Gift ({selectedGift.symbol})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
