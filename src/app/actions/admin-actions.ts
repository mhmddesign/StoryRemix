"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveReportAction(
  reportId: string,
  resolution: "resolved" | "dismissed",
  notes?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check admin/moderator role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as any)?.role;
  if (!role || !["admin", "moderator"].includes(role)) {
    return { success: false, error: "Unauthorized: Moderator privileges required." };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("reports")
    .update({
      status: resolution,
      moderator_id: user.id,
      resolution_notes: notes || null,
      resolved_at: new Date().toISOString(),
    } as any)
    .eq("id", reportId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log audit event
  await adminClient.from("moderation_audit_logs").insert({
    moderator_id: user.id,
    action: `report_${resolution}`,
    target_type: "report",
    target_id: reportId,
    details: { notes },
  } as any);

  revalidatePath("/admin");
  return { success: true };
}

export async function archiveStoryAdminAction(storyId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as any)?.role;
  if (role !== "admin") {
    return { success: false, error: "Admin privileges required." };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("stories")
    .update({ status: "archived" } as any)
    .eq("id", storyId);

  if (error) return { success: false, error: error.message };

  await adminClient.from("moderation_audit_logs").insert({
    moderator_id: user.id,
    action: "story_archived",
    target_type: "story",
    target_id: storyId,
    details: { reason },
  } as any);

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}
