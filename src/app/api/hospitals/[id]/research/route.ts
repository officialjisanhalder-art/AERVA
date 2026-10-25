import { NextRequest, NextResponse } from "next/server";
import { browserUseService } from "@/lib/services/browserUseService";
import { DEMO_HOSPITALS_DATA } from "@/lib/services/hospitalService";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hospitalId } = await context.params;
    if (!hospitalId || typeof hospitalId !== "string") {
      return NextResponse.json({ error: "Invalid hospital ID" }, { status: 400 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body allowed
    }

    // Resolve hospital name and existing info if not provided in payload
    let hospitalName = body.hospitalName;
    let websiteUrl = body.websiteUrl;
    let address = body.address;
    let googlePlaceId = body.googlePlaceId;

    if (!hospitalName) {
      const match = DEMO_HOSPITALS_DATA.find(
        (h) => h.id === hospitalId || (h as any).hospital_id === hospitalId
      );
      if (match) {
        hospitalName = match.name;
        address = address || match.address;
        googlePlaceId = googlePlaceId || (match as any).google_place_id;
      } else {
        hospitalName = `Hospital (${hospitalId})`;
      }
    }

    const result = await browserUseService.initiateHospitalResearch({
      hospitalId,
      hospitalName,
      googlePlaceId,
      websiteUrl,
      address,
      forceRefresh: Boolean(body.forceRefresh),
    });

    return NextResponse.json(result, {
      status: result.status === "FAILED" ? 502 : 200,
      headers: {
        "X-AERVA-Service": "Browser-Use-Cloud",
        "X-AERVA-Task-Id": result.taskId,
        "X-AERVA-Verification-Label": "WEBSITE_INFORMATION_FOUND",
      },
    });
  } catch (error: any) {
    console.error("[AERVA Browser Use API] Research submission error:", error);
    return NextResponse.json(
      { error: "Failed to initiate hospital website research", details: error?.message },
      { status: 500 }
    );
  }
}
