import { NextRequest, NextResponse } from "next/server";
import { AERVARoutingService } from "@/lib/routing/routing-engine";
import { routingAuditStore } from "@/lib/routing/routing-audit-store";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const body = await req.json();
    const { hospital_id, patient_location } = body;

    if (!hospital_id) {
      return NextResponse.json(
        { error: "hospital_id is required to confirm destination." },
        { status: 400 }
      );
    }

    const allHospitals = await AERVARoutingService.loadAllHospitals();
    const hospital = allHospitals.find((h) => h.id === hospital_id || (hospital_id === "h2_amri" && h.id === "h2"));

    if (!hospital) {
      return NextResponse.json(
        { error: `Hospital with ID '${hospital_id}' not found in AERVA network.` },
        { status: 404 }
      );
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}&travelmode=driving`;

    // Audit destination confirmation
    await routingAuditStore.recordDestinationConfirmation({
      case_id: caseId,
      hospital_id: hospital.id,
      hospital_name: hospital.name,
      eta_minutes: 12,
      created_at: new Date().toISOString(),
    });

    // Update Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("emergency_requests")
          .update({
            assigned_hospital_id: hospital.id,
            status: "EN_ROUTE",
          })
          .eq("id", caseId);
      } catch (dbErr) {
        console.warn("[Confirm Destination] Supabase update warning:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      case_id: caseId,
      destination_hospital: {
        hospital_id: hospital.id,
        name: hospital.name,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
        phone: hospital.phone,
        address: hospital.address,
      },
      google_maps_url: googleMapsUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to confirm destination", details: error?.message },
      { status: 500 }
    );
  }
}
