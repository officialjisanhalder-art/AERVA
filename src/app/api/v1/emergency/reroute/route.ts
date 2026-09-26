import { NextRequest, NextResponse } from "next/server";
import { NearERReroutingService } from "@/lib/routing/rerouting-service";
import { RerouteRequest } from "@/lib/routing/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RerouteRequest;

    if (!body || !body.case_id || !body.old_hospital_id || !body.new_hospital_id) {
      return NextResponse.json(
        { error: "Invalid request. 'case_id', 'old_hospital_id', and 'new_hospital_id' are required." },
        { status: 400 }
      );
    }

    const rerouteResult = await NearERReroutingService.applyReroute(body);

    return NextResponse.json(rerouteResult, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("[NearER Reroute API] Error applying reroute:", error);
    return NextResponse.json(
      {
        error: "Failed to apply reroute",
        details: error?.message || "Unknown internal error",
      },
      { status: 500 }
    );
  }
}
