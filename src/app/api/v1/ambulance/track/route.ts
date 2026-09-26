import { NextRequest, NextResponse } from "next/server";
import { ambulanceService } from "@/lib/services/ambulance-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("case_id");
    const ambulanceId = searchParams.get("ambulance_id");

    let vehicle = ambulanceId ? ambulanceService.getAmbulanceById(ambulanceId) : undefined;
    if (!vehicle && caseId) {
      vehicle = ambulanceService.getAmbulanceForCase(caseId);
    }

    // If no specific vehicle was dispatched for this case yet, grab the nearest standby
    if (!vehicle) {
      const available = ambulanceService.getAllAmbulances({ status: "AVAILABLE_STANDBY" });
      vehicle = available[0] || ambulanceService.getAllAmbulances()[0];
    }

    return NextResponse.json(
      {
        case_id: caseId,
        ambulance: vehicle,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to track ambulance", details: error?.message },
      { status: 500 }
    );
  }
}
