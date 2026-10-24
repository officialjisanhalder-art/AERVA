import { NextRequest, NextResponse } from "next/server";
import { agent37Coordinator } from "@/lib/services/agent37Service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      case_id,
      patient_name,
      patient_phone,
      emergency_type,
      latitude,
      longitude,
      blood_group,
      requirements,
    } = body || {};

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Valid numeric 'latitude' and 'longitude' are required" },
        { status: 400 }
      );
    }

    const result = await agent37Coordinator.coordinateEmergency({
      caseId: case_id,
      patientName: patient_name,
      patientPhone: patient_phone,
      emergencyType: emergency_type || "cardiac",
      latitude,
      longitude,
      patientBloodGroup: blood_group,
      requirements,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "X-AERVA-Agent": "Agent37",
        "X-Agent37-Execution-Id": result.execution_id,
      },
    });
  } catch (error: any) {
    console.error("[AERVA Agent37 API] Error:", error);
    return NextResponse.json(
      { error: "Failed to run Agent37 coordination", details: error?.message },
      { status: 500 }
    );
  }
}
