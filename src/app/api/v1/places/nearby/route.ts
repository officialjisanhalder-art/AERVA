import { NextRequest, NextResponse } from "next/server";
import { googlePlacesService } from "@/lib/services/googlePlacesService";
import { browserUseService } from "@/lib/services/browserUseService";

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

    const enrichedHospitals = await Promise.all(
      discovery.hospitals.map(async (h) => {
        const research = await browserUseService.getCachedResearch(h.hospital_id);
        return {
          ...h,
          website_research: research
            ? {
                status: research.status,
                verification_label: research.verification_label,
                retrieved_at: research.retrieved_at,
                freshness_status: research.freshness_status,
                findings: research.findings,
                source_urls: research.source_urls,
                disclaimer: research.disclaimer,
                live_url: research.live_url,
              }
            : null,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        source: discovery.source,
        total: discovery.total,
        hospitals: enrichedHospitals,
        browser_use_configured: browserUseService.isConfigured(),
        google_attribution: "Data provided by Google Maps Platform & AERVA Healthcare Registry",
        warning: discovery.error || null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
          "X-AERVA-Browser-Use-Enabled": String(browserUseService.isConfigured()),
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
