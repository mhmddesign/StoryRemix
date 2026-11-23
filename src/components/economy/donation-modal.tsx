"use client";

import React, { useState } from "react";
import {
  Heart,
  DollarSign,
  X,
  Sparkles,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Users,
} from "lucide-react";
import { calculateDonationSplit } from "@/lib/donations";
import { processDonationAction } from "@/app/actions/donation-actions";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";

interface DonationModalProps {
  storyId: string;
  storyTitle: string;
  contributorsCount: number;
}

const PRESET_AMOUNTS = [3, 5, 10, 25];

export function DonationModal({
  storyId,
  storyTitle,
  contributorsCount,
}: DonationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDollars, setSelectedDollars] = useState<number>(5);
  const [customDollars, setCustomDollars] = useState<string>("");
  const [donorMessage, setDonorMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedResult, setCompletedResult] = useState<any>(null);

  const { user } = useAuth();

  const currentAmountDollars =
    customDollars && Number(customDollars) > 0
      ? Number(customDollars)
      : selectedDollars;

  const currentGrossCents = Math.round(currentAmountDollars * 100);

  let split = null;
  try {
    if (currentGrossCents >= 100) {
      split = calculateDonationSplit(currentGrossCents);
    }
  } catch {
    // Ignore invalid range for split preview
  }

  const handleSelectPreset = (amount: number) => {
    setSelectedDollars(amount);
    setCustomDollars("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomDollars(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentGrossCents < 100) {
      toast.error("Minimum donation is $1.00 USD.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await processDonationAction({
        storyId,
        grossCents: currentGrossCents,
        donorMessage: donorMessage.trim() || undefined,
        isAnonymous,
      });

      if (res.success) {
        setCompletedResult(res);
        toast.success("Thank you! Your donation was successfully allocated to the creators.");
      } else {
        toast.error(res.error || "Failed to process donation.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCompletedResult(null);
    setSelectedDollars(5);
    setCustomDollars("");
    setDonorMessage("");
    setIsAnonymous(false);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
        title="Tip or donate to story co-authors"
      >
        <Heart className="w-3.5 h-3.5 fill-white/80" />
        <span>Support Writers</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] font-semibold mb-1">
                  <Heart className="w-3 h-3 fill-current" />
                  <span>90% Creator Revenue Pool</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[var(--foreground)]">
                  Support &ldquo;{storyTitle}&rdquo;
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Reward {contributorsCount} collaborator{contributorsCount !== 1 ? "s" : ""} who
                  co-wrote this story.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {completedResult ? (
              /* Success Confirmation Screen */
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--foreground)]">
                    Donation Succeeded!
                  </h4>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    ${(currentGrossCents / 100).toFixed(2)} USD allocated with 90% going straight to
                    the story co-authors.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Creator Pool (90% Net):</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      ${(completedResult.split.creatorPoolCents / 100).toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Platform Fee (10% Net):</span>
                    <span>${(completedResult.split.platformFeeCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[var(--muted-foreground)] pt-1 border-t border-[var(--border)]">
                    <span>Payment Processing (Stripe/Card):</span>
                    <span>${(completedResult.split.processorFeeCents / 100).toFixed(2)}</span>
                  </div>
                </div>

                {user && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>+20 XP awarded for patronizing writers!</span>
                  </div>
                )}

                <button
                  onClick={handleReset}
                  className="w-full py-2.5 rounded-xl bg-amber-700 text-white font-medium text-xs hover:bg-amber-800 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Donation Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Preset Amount Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--foreground)]">
                    Choose Amount (USD)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map((amt) => {
                      const isSelected = !customDollars && selectedDollars === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleSelectPreset(amt)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-700 text-white border-amber-700 shadow-xs"
                              : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-amber-700/50"
                          }`}
                        >
                          ${amt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">
                    Or Enter Custom Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--muted-foreground)]">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={customDollars}
                      onChange={handleCustomChange}
                      placeholder="e.g. 15.00"
                      className="w-full pl-8 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-2 focus:ring-amber-700/30"
                    />
                  </div>
                </div>

                {/* Transparent 90/10 Breakdown Preview */}
                {split && (
                  <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--muted-foreground)]">Gross Contribution:</span>
                      <span className="font-semibold text-[var(--foreground)]">
                        ${(split.grossCents / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-[var(--muted-foreground)]">
                      <span>Est. Card Processing Fee:</span>
                      <span>-${(split.processorFeeCents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-[var(--border)] font-semibold">
                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <span>Writers Pool (90%):</span>
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400">
                        ${(split.creatorPoolCents / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-[var(--muted-foreground)]">
                      <span>Platform Maintenance (10%):</span>
                      <span>${(split.platformFeeCents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Optional Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">
                    Words of Appreciation (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={140}
                    value={donorMessage}
                    onChange={(e) => setDonorMessage(e.target.value)}
                    placeholder="Brilliant plot twist! Keep writing!"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none"
                  />
                </div>

                {/* Anonymous Checkbox */}
                <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-[var(--border)] text-amber-700 focus:ring-0"
                  />
                  <span>Donate anonymously (hide my username)</span>
                </label>

                {/* Sandbox Notice */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sandbox Mode:</strong> This simulation uses test credentials. Real
                    allocations will be credited to author ledger balances without billing real
                    cards.
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || currentGrossCents < 100}
                  className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Allocating to Authors...</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 fill-white" />
                      <span>Send ${(currentGrossCents / 100).toFixed(2)} Support</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
