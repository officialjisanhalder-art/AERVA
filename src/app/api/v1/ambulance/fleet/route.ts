import { NextRequest, NextResponse } from "next/server";
import { ambulanceService, AmbulanceStatus } from "@/lib/services/ambulance-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get("hospital_id") || undefined;
    const status = (searchParams.get("status") as AmbulanceStatus) || undefined;

    const fleet = ambulanceService.getAllAmbulances({ hospitalId, status });

    const total = fleet.length;
    const standbyCount = fleet.filter((a) => a.status === "AVAILABLE_STANDBY").length;
    const activeCount = fleet.filter(
      (a) => a.status === "DISPATCHED" || a.status === "EN_ROUTE_PATIENT" || a.status === "PATIENT_ONBOARD"
    ).length;

    return NextResponse.json(
      {
        total,
        standby_available: standbyCount,
        active_missions: activeCount,
        fleet,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch ambulance fleet", details: error?.message },
      { status: 500 }
    );
  }
}
