import { NextRequest, NextResponse } from "next/server";
import { ambulanceService } from "@/lib/services/ambulance-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.case_id) {
      return NextResponse.json(
        { error: "Invalid request. 'case_id' is required." },
        { status: 400 }
      );
    }

    const patientLocation = body.patient_location || {
      latitude: 22.5726,
      longitude: 88.3639,
      area: "Central Kolkata",
      city: "Kolkata",
    };

    const dispatchedVehicle = await ambulanceService.dispatchAmbulance({
      caseId: body.case_id,
      ambulanceId: body.ambulance_id,
      hospitalId: body.hospital_id,
      patientName: body.patient_name,
      patientLocation,
      emergencyType: body.emergency_type,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Ambulance ${dispatchedVehicle.unitCode} dispatched successfully to Case ${body.case_id}`,
        ambulance: dispatchedVehicle,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to dispatch ambulance", details: error?.message },
      { status: 500 }
    );
  }
}
