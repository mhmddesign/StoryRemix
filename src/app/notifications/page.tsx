import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Bell, Sparkles, CheckCircle2, UserPlus, Flame } from "lucide-react";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url)
    `)
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-700" /> Notifications
        </h1>
        <p className="text-xs text-[var(--muted-foreground)]">
          Realtime updates on your stories, votes, accepted continuations, and community interactions.
        </p>
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-[var(--border)] text-center space-y-2">
          <Bell className="w-8 h-8 text-[var(--muted-foreground)] mx-auto opacity-50" />
          <h3 className="font-semibold text-sm text-[var(--foreground)]">No notifications yet</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            When community members vote for your continuation or follow your stories, you&apos;ll see updates here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          {notifications.map((notif) => {
            let icon = <Bell className="w-4 h-4 text-amber-600" />;
            let message = "You have a new notification";

            if (notif.type === "round_won") {
              icon = <Sparkles className="w-4 h-4 text-emerald-600" />;
              message = `Congratulations! Your continuation was chosen as the winner for Paragraph ${
                (notif.metadata as any)?.paragraph_position || ""
              }!`;
            } else if (notif.type === "new_follower") {
              icon = <UserPlus className="w-4 h-4 text-blue-600" />;
              message = `${notif.actor?.display_name || "A writer"} started following you.`;
            } else if (notif.type === "story_completed") {
              icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
              message = `Your story "${(notif.metadata as any)?.title || ""}" has reached its conclusion and is now complete!`;
            } else if (notif.type === "round_unqualified") {
              icon = <Flame className="w-4 h-4 text-amber-600" />;
              message = `Round ${(notif.metadata as any)?.round_number || ""} did not reach the vote threshold. Your decision is needed.`;
            }

            return (
              <div
                key={notif.id}
                className={`p-4 flex items-start gap-3.5 text-xs transition-colors ${
                  notif.read_at ? "bg-[var(--card)]" : "bg-amber-500/5 font-medium"
                }`}
              >
                <div className="p-2 rounded-xl bg-[var(--muted)] shrink-0">{icon}</div>
                <div className="space-y-1 flex-1">
                  <p className="text-[var(--foreground)]">{message}</p>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
