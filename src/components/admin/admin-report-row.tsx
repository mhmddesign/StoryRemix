"use client";

import React, { useState, useTransition } from "react";
import { resolveReportAction } from "@/app/actions/admin-actions";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AdminReportRow({ report }: { report: any }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(report.status);

  const handleResolve = (action: "resolved" | "dismissed") => {
    startTransition(async () => {
      const res = await resolveReportAction(report.id, action);
      if (res.success) {
        setStatus(action);
        toast.success(`Report marked as ${action}.`);
      } else {
        toast.error(res.error || "Failed to update report.");
      }
    });
  };

  return (
    <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-rose-600 uppercase tracking-wide">
            {report.reason}
          </span>
          <span className="text-[var(--muted-foreground)]">•</span>
          <span className="text-[var(--muted-foreground)]">
            Target: <code className="bg-[var(--muted)] px-1 rounded">{report.target_type}</code>
          </span>
          <span className="text-[var(--muted-foreground)]">•</span>
          <span className="text-[var(--muted-foreground)]">
            By @{report.reporter?.username || "user"}
          </span>
        </div>
        {report.description && (
          <p className="text-[var(--foreground)]">{report.description}</p>
        )}
        <span className="text-[10px] text-[var(--muted-foreground)]">
          Reported {new Date(report.created_at).toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
            status === "pending"
              ? "bg-amber-500/10 text-amber-700"
              : status === "resolved"
              ? "bg-emerald-500/10 text-emerald-700"
              : "bg-stone-500/10 text-stone-700"
          }`}
        >
          {status}
        </span>

        {status === "pending" && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleResolve("resolved")}
              disabled={isPending}
              className="p-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
              title="Resolve & Take Action"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => handleResolve("dismissed")}
              disabled={isPending}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] cursor-pointer"
              title="Dismiss Report"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
