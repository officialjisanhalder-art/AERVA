import { NextRequest, NextResponse } from "next/server";
import { nodusClient } from "@/lib/services/nodusService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, case_id } = body || {};

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Field 'description' is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const trace = await nodusClient.interpretEmergency(description.trim(), case_id);

    return NextResponse.json(
      {
        success: trace.status === "SUCCESS",
        status: trace.status,
        request_id: trace.requestId,
        model: trace.model,
        latency_ms: trace.latencyMs,
        data: trace.data || null,
        error: trace.error || null,
      },
      {
        status: trace.status === "SUCCESS" ? 200 : 200, // Return 200 with fallback flag so frontend gracefully handles fallback without 500 crash
        headers: {
          "X-AERVA-Inference-Provider": "Nodus-Compute",
          "X-Nodus-Request-Id": trace.requestId || "none",
        },
      }
    );
  } catch (error: any) {
    console.error("[AERVA AI Interpret API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        status: "FAILED",
        error: error?.message || "Internal server error during interpretation",
      },
      { status: 500 }
    );
  }
}
