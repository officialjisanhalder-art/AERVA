import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hospitalDiscoveryService } from "@/lib/services/hospitalDiscoveryService";
import { browserUseService } from "@/lib/services/browserUseService";

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(100).max(50000).default(5000),
  limit: z.coerce.number().int().min(1).max(20).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryObj = {
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      radius: searchParams.get("radius") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    };

    const parsed = schema.safeParse(queryObj);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid location or search parameters",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { lat, lng, radius, limit } = parsed.data;
    const discovery = await hospitalDiscoveryService.getNearbyHospitals({
      lat,
      lng,
      radius,
      limit,
    });

    const enrichedResults = await Promise.all(
      (discovery.results || []).map(async (h: any) => {
        const research = await browserUseService.getCachedResearch(h.placeId);
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
        ...discovery,
        results: enrichedResults,
        browser_use_configured: browserUseService.isConfigured(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-AERVA-Browser-Use-Enabled": String(browserUseService.isConfigured()),
        },
      }
    );
  } catch (error: any) {
    console.error("[AERVA Discovery API] Error:", error);
    return NextResponse.json(
      {
        error: "Hospital search unavailable. Please try again or contact emergency services.",
      },
      { status: 503 }
    );
  }
}

/**
 * Live Resource Update Handler (Hospital Dashboard / Integration Testing)
 * Allows authorized hospital operators or integration tests to update capacity dynamically.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { hospital_id, google_place_id, capacity, resources_updated_at } = body || {};

    const targetId = google_place_id || hospital_id;
    if (!targetId) {
      return NextResponse.json(
        { error: "A valid 'hospital_id' or 'google_place_id' is required" },
        { status: 400 }
      );
    }

    const result = await hospitalDiscoveryService.updateHospitalResourceData(targetId, {
      icu_beds_available: capacity?.icu_beds_available,
      general_beds_available: capacity?.general_beds_available ?? capacity?.er_beds_available,
      ventilators_available: capacity?.ventilators_available,
      oxygen_support_available: capacity?.oxygen_support_available,
      resources_updated_at,
    });

    return NextResponse.json({
      success: true,
      message: "Hospital resource telemetry updated successfully",
      updated: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update hospital resources", details: err?.message },
      { status: 500 }
    );
  }
}
