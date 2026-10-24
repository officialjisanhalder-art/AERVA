import { NextRequest, NextResponse } from "next/server";
import { calculateDistanceKm, estimateDrivingEtaMinutes } from "@/lib/services/locationService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startLat = parseFloat(searchParams.get("startLat") || "22.5726");
    const startLng = parseFloat(searchParams.get("startLng") || "88.3639");
    const endLat = parseFloat(searchParams.get("endLat") || "22.5804");
    const endLng = parseFloat(searchParams.get("endLng") || "88.4173");

    if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const distanceKm = calculateDistanceKm(startLat, startLng, endLat, endLng);
    const etaMinutes = estimateDrivingEtaMinutes(distanceKm);

    return NextResponse.json({
      success: true,
      directions: [
        {
          legs: [
            {
              distance: {
                text: `${distanceKm.toFixed(1)} km`,
                value: Math.round(distanceKm * 1000),
              },
              duration: {
                text: `${etaMinutes} mins`,
                value: etaMinutes * 60,
              },
              start_address: `${startLat.toFixed(4)}, ${startLng.toFixed(4)} (Patient Origin)`,
              end_address: `${endLat.toFixed(4)}, ${endLng.toFixed(4)} (Hospital Receiving Bay)`,
            },
          ],
        },
      ],
      green_corridor_active: true,
      cleared_intersections: Math.max(3, Math.round(distanceKm * 1.5)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to calculate corridor traffic", details: error?.message },
      { status: 500 }
    );
  }
}
