import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatency = 0;

  try {
    const supabase = await createClient();
    const queryStart = Date.now();
    const { error } = await supabase.from("stories").select("id").limit(1);
    dbLatency = Date.now() - queryStart;

    if (error) {
      dbStatus = `degraded: ${error.message}`;
    }
  } catch (err: any) {
    dbStatus = `disconnected: ${err?.message || "Unknown error"}`;
  }

  return NextResponse.json({
    status: dbStatus.startsWith("healthy") ? "healthy" : "warning",
    version: "0.1.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      app: "healthy",
      database: dbStatus,
      database_latency_ms: dbLatency,
    },
    duration_ms: Date.now() - startTime,
  });
}
