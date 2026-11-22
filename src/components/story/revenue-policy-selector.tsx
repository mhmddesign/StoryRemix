"use client";

import React, { useState } from "react";
import { RevenuePolicyType } from "@/types/database";
import { calculateAuthorAllocations } from "@/lib/revenue-sharing";
import { DollarSign, PieChart, Users, HelpCircle } from "lucide-react";

interface RevenuePolicySelectorProps {
  policyType: RevenuePolicyType;
  onChangePolicyType: (type: RevenuePolicyType) => void;
  creatorReserved: number;
  onChangeCreatorReserved: (val: number) => void;
  openingWeight: number;
  onChangeOpeningWeight: (val: number) => void;
  continuationWeight: number;
  onChangeContinuationWeight: (val: number) => void;
  finalWeight: number;
  onChangeFinalWeight: (val: number) => void;
}

export function RevenuePolicySelector({
  policyType,
  onChangePolicyType,
  creatorReserved,
  onChangeCreatorReserved,
  openingWeight,
  onChangeOpeningWeight,
  continuationWeight,
  onChangeContinuationWeight,
  finalWeight,
  onChangeFinalWeight,
}: RevenuePolicySelectorProps) {
  // Mock hypothetical 4-paragraph story for live preview:
  // Par 1 (Owner), Par 2 (Author B), Par 3 (Author C), Par 4 (Owner)
  const sampleSegments = [
    { authorId: "owner", paragraphIndex: 1 },
    { authorId: "author_b", paragraphIndex: 2 },
    { authorId: "author_c", paragraphIndex: 3 },
    { authorId: "owner", paragraphIndex: 4 },
  ];

  const samplePoolCents = 1000; // $10.00 USD
  const previewAllocations = calculateAuthorAllocations(
    samplePoolCents,
    "owner",
    sampleSegments,
    {
      policyType,
      creatorReservedPercentage: creatorReserved,
      openingParagraphWeight: openingWeight,
      continuationParagraphWeight: continuationWeight,
      finalParagraphWeight: finalWeight,
    },
    4
  );

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Policy A */}
        <label
          className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all ${
            policyType === "equal_collaborators"
              ? "border-amber-700 bg-amber-700/5 shadow-sm"
              : "border-[var(--border)] bg-[var(--background)] hover:border-amber-700/40"
          }`}
        >
          <div className="flex items-start gap-2">
            <input
              type="radio"
              name="revenue_policy"
              value="equal_collaborators"
              checked={policyType === "equal_collaborators"}
              onChange={() => onChangePolicyType("equal_collaborators")}
              className="mt-0.5 accent-amber-700"
            />
            <div>
              <span className="font-bold text-[var(--foreground)] block">
                Policy A: Equal Collaborators
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                Every unique credited co-author (including creator) receives an equal share.
              </span>
            </div>
          </div>
        </label>

        {/* Policy B */}
        <label
          className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all ${
            policyType === "contribution_weighted"
              ? "border-amber-700 bg-amber-700/5 shadow-sm"
              : "border-[var(--border)] bg-[var(--background)] hover:border-amber-700/40"
          }`}
        >
          <div className="flex items-start gap-2">
            <input
              type="radio"
              name="revenue_policy"
              value="contribution_weighted"
              checked={policyType === "contribution_weighted"}
              onChange={() => onChangePolicyType("contribution_weighted")}
              className="mt-0.5 accent-amber-700"
            />
            <div>
              <span className="font-bold text-[var(--foreground)] block">
                Policy B: Contribution Weighted
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                Revenue is split proportionally to the number of accepted paragraphs each author wrote.
              </span>
            </div>
          </div>
        </label>

        {/* Policy C */}
        <label
          className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all ${
            policyType === "creator_and_collaborators"
              ? "border-amber-700 bg-amber-700/5 shadow-sm"
              : "border-[var(--border)] bg-[var(--background)] hover:border-amber-700/40"
          }`}
        >
          <div className="flex items-start gap-2">
            <input
              type="radio"
              name="revenue_policy"
              value="creator_and_collaborators"
              checked={policyType === "creator_and_collaborators"}
              onChange={() => onChangePolicyType("creator_and_collaborators")}
              className="mt-0.5 accent-amber-700"
            />
            <div>
              <span className="font-bold text-[var(--foreground)] block">
                Policy C: Creator Reserved + Pool
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                The creator reserves a base percentage (e.g. {creatorReserved}%). The rest is split among continuation authors.
              </span>
            </div>
          </div>
        </label>

        {/* Policy D */}
        <label
          className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all ${
            policyType === "weighted_roles"
              ? "border-amber-700 bg-amber-700/5 shadow-sm"
              : "border-[var(--border)] bg-[var(--background)] hover:border-amber-700/40"
          }`}
        >
          <div className="flex items-start gap-2">
            <input
              type="radio"
              name="revenue_policy"
              value="weighted_roles"
              checked={policyType === "weighted_roles"}
              onChange={() => onChangePolicyType("weighted_roles")}
              className="mt-0.5 accent-amber-700"
            />
            <div>
              <span className="font-bold text-[var(--foreground)] block">
                Policy D: Weighted Paragraph Roles
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                Assign weights to the Genesis paragraph, middle continuations, and climax.
              </span>
            </div>
          </div>
        </label>
      </div>

      {/* Sub-controls for Policy C */}
      {policyType === "creator_and_collaborators" && (
        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-1.5">
          <div className="flex justify-between font-semibold">
            <span>Creator Reserved Share:</span>
            <span className="text-amber-700 font-bold">{creatorReserved}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={70}
            step={5}
            value={creatorReserved}
            onChange={(e) => onChangeCreatorReserved(Number(e.target.value))}
            className="w-full accent-amber-700"
          />
        </div>
      )}

      {/* Sub-controls for Policy D */}
      {policyType === "weighted_roles" && (
        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="font-semibold block text-[11px]">Genesis Weight</label>
            <input
              type="number"
              min={1}
              max={5}
              value={openingWeight}
              onChange={(e) => onChangeOpeningWeight(Number(e.target.value))}
              className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--card)]"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold block text-[11px]">Continuation Weight</label>
            <input
              type="number"
              min={1}
              max={5}
              value={continuationWeight}
              onChange={(e) => onChangeContinuationWeight(Number(e.target.value))}
              className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--card)]"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold block text-[11px]">Climax Weight</label>
            <input
              type="number"
              min={1}
              max={5}
              value={finalWeight}
              onChange={(e) => onChangeFinalWeight(Number(e.target.value))}
              className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--card)]"
            />
          </div>
        </div>
      )}

      {/* Live Sample Distribution Preview */}
      <div className="p-3.5 rounded-xl border border-dashed border-[var(--border)] bg-amber-500/5 space-y-2">
        <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
          <PieChart className="w-3.5 h-3.5" />
          <span>Interactive Sample Payout Preview (on a hypothetical $10.00 creator pool)</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          {previewAllocations.map((a) => (
            <div key={a.authorId} className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
              <span className="font-bold text-[var(--foreground)] block">
                {a.authorId === "owner" ? "Creator (2 paras)" : a.authorId === "author_b" ? "Author B (1 para)" : "Author C (1 para)"}
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                ${(a.allocatedCents / 100).toFixed(2)} ({a.sharePercentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
