"use client";

import React, { useState } from "react";
import { consentToRevenuePolicyAction } from "@/app/actions/economy-actions";
import { ShieldCheck, Scale, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ContributorConsentModalProps {
  storyId: string;
  policyId?: string;
  policyTypeTitle: string;
  policyDescription: string;
  onConsented: () => void;
  onCancel: () => void;
}

export function ContributorConsentModal({
  storyId,
  policyId,
  policyTypeTitle,
  policyDescription,
  onConsented,
  onCancel,
}: ContributorConsentModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!agreed) {
      toast.error("Please confirm acceptance of the revenue-sharing terms.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (policyId) {
        await consentToRevenuePolicyAction(storyId, policyId);
      }
      onConsented();
    } catch {
      toast.error("Failed to record policy consent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl space-y-4 text-xs animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-700" />
            <h3 className="font-serif text-base font-bold text-[var(--foreground)]">
              Co-Author Terms & Revenue Policy
            </h3>
          </div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-[var(--accent)]">
            <X className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>

        <p className="text-[var(--muted-foreground)] leading-relaxed">
          Before submitting your continuation, please review the revenue-sharing policy established for this story. If this story receives community support or competition awards, monetary proceeds are distributed according to these terms:
        </p>

        <div className="p-3.5 rounded-xl border border-amber-700/20 bg-amber-700/5 space-y-1">
          <span className="font-bold text-[var(--foreground)] block">
            {policyTypeTitle}
          </span>
          <span className="text-[11px] text-[var(--muted-foreground)] block">
            {policyDescription}
          </span>
        </div>

        <label className="flex items-start gap-2 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-amber-700"
          />
          <span className="text-[11px] text-[var(--foreground)] leading-tight">
            I understand and accept this story&apos;s revenue-sharing distribution and agree that my continuation will be credited permanently under these terms.
          </span>
        </label>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[var(--border)] font-semibold text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!agreed || isSubmitting}
            className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Accept & Proceed</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
