import { NextRequest, NextResponse } from "next/server";
import { AERVARoutingService } from "@/lib/routing/routing-engine";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { AvailabilityStatus } from "@/lib/routing/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const all = await AERVARoutingService.loadAllHospitals();
    const hospital = all.find((h) => h.id.toLowerCase() === id.toLowerCase());

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        hospital_id: hospital.id,
        name: hospital.name,
        emergency_receiving_status: hospital.receivingStatus,
        data_confidence: hospital.dataConfidence,
        last_updated_seconds_ago: hospital.lastUpdatedSeconds,
        er_beds_available: hospital.erBedsAvailable,
        icu_beds_available: hospital.icuBedsAvailable,
        ventilators_available: hospital.ventilatorsAvailable,
        blood_availability: hospital.bloodAvailability,
        capabilities: hospital.capabilities,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch hospital status", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const newStatus: AvailabilityStatus | undefined = body.emergency_receiving_status;
    const erBeds: number | undefined = body.er_beds_available;
    const icuBeds: number | undefined = body.icu_beds_available;

    // Optional Partner Verification header
    const partnerId = req.headers.get("x-aerva-partner-id") || body.partner_id;

    // Persist to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: any = {
          updated_at: new Date().toISOString(),
        };
        if (newStatus) {
          updatePayload.emergency_available = newStatus !== "TEMPORARILY_UNAVAILABLE";
        }
        if (erBeds !== undefined) {
          updatePayload.er_beds_available = erBeds;
        }
        if (icuBeds !== undefined) {
          updatePayload.icu_beds_available = icuBeds;
        }

        await supabase.from("hospitals").update(updatePayload).eq("id", id);
      } catch (dbErr) {
        console.warn("[Hospital Status API] Supabase update warning:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      hospital_id: id,
      partner_id: partnerId || "ANONYMOUS_DESK",
      updated_status: newStatus,
      timestamp: new Date().toISOString(),
      message: "Hospital operational status successfully broadcast to AERVA Routing Engine",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update hospital status", details: error?.message },
      { status: 500 }
    );
  }
}
