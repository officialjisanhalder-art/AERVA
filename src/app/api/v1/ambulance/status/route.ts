import { NextRequest, NextResponse } from "next/server";
import { ambulanceService, AmbulanceStatus } from "@/lib/services/ambulance-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.ambulance_id || !body.status) {
      return NextResponse.json(
        { error: "Invalid request. 'ambulance_id' and 'status' are required." },
        { status: 400 }
      );
    }

    const updated = await ambulanceService.updateAmbulanceStatus(
      body.ambulance_id,
      body.status as AmbulanceStatus,
      body.telemetry
    );

    if (!updated) {
      return NextResponse.json(
        { error: `Ambulance with ID '${body.ambulance_id}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Ambulance ${updated.unitCode} status updated to ${updated.status}`,
        ambulance: updated,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update ambulance status", details: error?.message },
      { status: 500 }
    );
  }
}
