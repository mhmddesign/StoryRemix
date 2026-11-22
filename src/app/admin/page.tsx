import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminReportRow } from "@/components/admin/admin-report-row";
import {
  ShieldAlert,
  Users,
  BookOpen,
  Flame,
  CheckCircle2,
  AlertTriangle,
  History,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    redirect("/");
  }

  // Fetch metrics
  const { count: totalStories } = await supabase
    .from("stories")
    .select("*", { count: "exact", head: true });

  const { count: activeRounds } = await supabase
    .from("story_rounds")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  const { count: completedStories } = await supabase
    .from("stories")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const { count: pendingReportsCount } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Fetch reports queue
  const { data: reports } = await supabase
    .from("reports")
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(username, display_name)
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch audit logs
  const { data: auditLogs } = await supabase
    .from("moderation_audit_logs")
    .select(`
      *,
      moderator:profiles!moderation_audit_logs_moderator_id_fkey(username, display_name)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Trust & Safety Operations</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]">
          Moderation & Administration Dashboard
        </h1>
        <p className="text-xs text-[var(--muted-foreground)]">
          Monitor community health, review user reports, resolve disputes, and maintain platform integrity.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-1">
          <span className="text-[11px] text-[var(--muted-foreground)] uppercase font-semibold">
            Total Stories
          </span>
          <p className="text-2xl font-bold font-serif text-[var(--foreground)]">
            {totalStories || 0}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-1">
          <span className="text-[11px] text-[var(--muted-foreground)] uppercase font-semibold">
            Active Voting Rounds
          </span>
          <p className="text-2xl font-bold font-serif text-amber-600">
            {activeRounds || 0}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-1">
          <span className="text-[11px] text-[var(--muted-foreground)] uppercase font-semibold">
            Completed Stories
          </span>
          <p className="text-2xl font-bold font-serif text-emerald-600">
            {completedStories || 0}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-1">
          <span className="text-[11px] text-[var(--muted-foreground)] uppercase font-semibold">
            Pending Reports
          </span>
          <p className="text-2xl font-bold font-serif text-rose-600">
            {pendingReportsCount || 0}
          </p>
        </div>
      </div>

      {/* Reports Queue */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
        <h2 className="font-serif text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" /> Community Reports Queue
        </h2>

        {!reports || reports.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl">
            No reports in queue. The community is healthy!
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {reports.map((report) => (
              <AdminReportRow key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>

      {/* Moderation Audit Log */}
      {auditLogs && auditLogs.length > 0 && (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h2 className="font-serif text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <History className="w-5 h-5 text-amber-600" /> Moderation Audit Log
          </h2>

          <div className="space-y-2 text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-[var(--border)] flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-[var(--foreground)]">
                    {log.moderator?.display_name || "Moderator"}
                  </span>{" "}
                  performed <span className="font-mono text-amber-700">{log.action}</span> on{" "}
                  <span className="font-mono">{log.target_type}</span>
                </div>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
