import { NextRequest, NextResponse } from "next/server";
import { AERVAReroutingService } from "@/lib/routing/rerouting-service";
import { RecheckRequest } from "@/lib/routing/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RecheckRequest;

    if (!body || !body.case_id || !body.current_hospital_id || !body.patient_location) {
      return NextResponse.json(
        { error: "Invalid request. 'case_id', 'current_hospital_id', and 'patient_location' are required." },
        { status: 400 }
      );
    }

    const evaluation = await AERVAReroutingService.evaluateRoute(body);

    return NextResponse.json(evaluation, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("[AERVA Recheck API] Error evaluating route:", error);
    return NextResponse.json(
      {
        error: "Failed to evaluate route",
        details: error?.message || "Unknown internal error",
      },
      { status: 500 }
    );
  }
}
