import { NextRequest, NextResponse } from "next/server";
import { AERVARoutingService } from "@/lib/routing/routing-engine";
import { calculateDistanceKm, estimateDrivingEtaMinutes } from "@/lib/services/locationService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const radiusKm = parseFloat(searchParams.get("radius_km") || "25");
    const emergencyType = searchParams.get("emergency_type") || "general";

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: "Query parameters 'lat' and 'lng' are required." },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Invalid coordinates format." },
        { status: 400 }
      );
    }

    const allHospitals = await AERVARoutingService.loadAllHospitals();

    const candidates = allHospitals
      .map((h) => {
        const distance = calculateDistanceKm(lat, lng, h.latitude, h.longitude);
        const eta = estimateDrivingEtaMinutes(distance);
        return {
          hospital_id: h.id,
          name: h.name,
          phone: h.phone,
          address: h.address,
          latitude: h.latitude,
          longitude: h.longitude,
          distance_km: Math.round(distance * 10) / 10,
          estimated_travel_minutes: eta,
          receiving_status: h.receivingStatus,
          data_confidence: h.dataConfidence,
          capabilities: h.capabilities,
          metrics: {
            er_beds_open: h.erBedsAvailable,
            icu_beds_open: h.icuBedsAvailable,
            ventilators_open: h.ventilatorsAvailable,
          },
          public_rating: h.publicRating,
          public_review_count: h.publicReviewCount,
        };
      })
      .filter((h) => h.distance_km <= radiusKm)
      .sort((a, b) => a.estimated_travel_minutes - b.estimated_travel_minutes);

    return NextResponse.json(
      {
        search_center: { latitude: lat, longitude: lng },
        radius_km: radiusKm,
        total_found: candidates.length,
        hospitals: candidates,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: any) {
    console.error("[AERVA Nearby Hospitals API] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve nearby hospitals", details: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}
