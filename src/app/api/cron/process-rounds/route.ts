import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Authorize cron request
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 2. Fetch all rounds that reached deadline and are still open
  const now = new Date().toISOString();
  const { data: expiredRounds, error: fetchError } = await supabase
    .from("story_rounds")
    .select("id, story_id, round_number")
    .eq("status", "open")
    .lte("deadline_at", now);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!expiredRounds || expiredRounds.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      message: "No expired rounds pending finalization.",
    });
  }

  const results: any[] = [];

  // 3. Process each round sequentially through the PostgreSQL finalize_round procedure
  for (const round of expiredRounds) {
    try {
      const { data, error } = await supabase.rpc("finalize_round", {
        p_round_id: round.id,
      });

      if (error) {
        results.push({ round_id: round.id, success: false, error: error.message });
      } else {
        results.push({ round_id: round.id, success: true, result: data });
      }
    } catch (err: any) {
      results.push({ round_id: round.id, success: false, error: err?.message });
    }
  }

  return NextResponse.json({
    success: true,
    processed: expiredRounds.length,
    results,
  });
}
