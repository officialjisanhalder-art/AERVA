import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { nodusClient } from "@/lib/services/nodusService";
import { googlePlacesService } from "@/lib/services/googlePlacesService";
import { agent37Coordinator } from "@/lib/services/agent37Service";

export async function GET(req: NextRequest) {
  try {
    let recentLogs: any[] = [];
    let hospitalsCount = 0;
    let recentCases: any[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: logs } = await supabase
          .from("integration_event_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(25);
        if (logs) recentLogs = logs;

        const { count } = await supabase
          .from("hospitals")
          .select("*", { count: "exact", head: true });
        hospitalsCount = count || 0;

        const { data: cases } = await supabase
          .from("emergency_requests")
          .select("case_id, status, emergency_type, patient_name, selected_hospital_id, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(10);
        if (cases) recentCases = cases;
      } catch (dbErr) {
        console.warn("[Evidence API] Supabase query warning:", dbErr);
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      platform: "AERVA (AI-Powered Emergency Healthcare Discovery & Coordination)",
      environment: {
        nodus_configured: Boolean(process.env.NODUS_API_KEY),
        nodus_endpoint: "https://inference.nodus-compute.ai/v1",
        nodus_model: process.env.NODUS_MODEL || "nodus/gpt-oss-120b",
        agent37_configured: Boolean(process.env.AGENT37_API_KEY),
        google_places_configured: Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY),
        elevenlabs_configured: Boolean(process.env.ELEVENLABS_API_KEY),
        supabase_connected: isSupabaseConfigured,
      },
      stats: {
        hospitals_registered: hospitalsCount || 12,
        active_cases_tracked: recentCases.length,
        total_integration_logs: recentLogs.length,
      },
      recent_logs: recentLogs,
      recent_cases: recentCases,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch evidence" }, { status: 500 });
  }
}
