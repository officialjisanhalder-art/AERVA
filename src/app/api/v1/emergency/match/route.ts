import { NextRequest, NextResponse } from "next/server";
import { NearERRoutingService } from "@/lib/routing/routing-engine";
import { MatchRequest } from "@/lib/routing/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MatchRequest;

    if (!body || !body.patient_location) {
      return NextResponse.json(
        { error: "Invalid request. 'patient_location' with latitude and longitude is required." },
        { status: 400 }
      );
    }

    const { latitude, longitude } = body.patient_location;
    if (typeof latitude !== "number" || typeof longitude !== "number" || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid coordinates. 'latitude' and 'longitude' must be valid numbers." },
        { status: 400 }
      );
    }

    const matchResult = await NearERRoutingService.matchEmergency(body);

    return NextResponse.json(matchResult, {
      status: 200,
      headers: {
        "X-NearER-Routing-Engine": matchResult.engine_version,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("[NearER Match API] Error processing match:", error);
    return NextResponse.json(
      {
        error: "Failed to process emergency match",
        details: error?.message || "Unknown internal error",
      },
      { status: 500 }
    );
  }
}
