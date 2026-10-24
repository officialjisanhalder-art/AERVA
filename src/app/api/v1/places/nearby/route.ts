import { NextRequest, NextResponse } from "next/server";
import { googlePlacesService } from "@/lib/services/googlePlacesService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const radiusStr = searchParams.get("radius") || "15000";

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: "Query parameters 'lat' and 'lng' are required" },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radius = parseInt(radiusStr, 10);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Invalid numeric coordinates for 'lat' and 'lng'" },
        { status: 400 }
      );
    }

    const discovery = await googlePlacesService.searchNearbyHospitals(lat, lng, radius);

    return NextResponse.json(
      {
        success: true,
        source: discovery.source,
        total: discovery.total,
        hospitals: discovery.hospitals,
        google_attribution: "Data provided by Google Maps Platform & AERVA Healthcare Registry",
        warning: discovery.error || null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error: any) {
    console.error("[AERVA Places API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to search nearby hospitals",
      },
      { status: 500 }
    );
  }
}
