import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    let clientIp = (forwarded ? forwarded.split(",")[0] : realIp || "").trim();

    const isLocal =
      !clientIp ||
      clientIp === "127.0.0.1" ||
      clientIp === "::1" ||
      clientIp.startsWith("192.168.") ||
      clientIp.startsWith("10.") ||
      clientIp.startsWith("172.");

    if (!isLocal) {
      try {
        const ipRes = await fetch(`https://ipwho.is/${clientIp}`, {
          signal: AbortSignal.timeout(3000),
        });
        if (ipRes.ok) {
          const data = await ipRes.json();
          if (data && data.success && data.latitude && data.longitude) {
            return NextResponse.json({
              success: true,
              lat: data.latitude,
              lng: data.longitude,
              city: data.city || "Detected City",
              area: data.region || data.city || "Detected Area",
              country: data.country || "India",
              ip: clientIp,
              is_approximate: true,
              source: "ipwhois",
            });
          }
        }
      } catch {
        // Fall back gracefully
      }
    }

    // Default development / local fallback
    return NextResponse.json({
      success: true,
      lat: 22.5804,
      lng: 88.4173,
      area: "Salt Lake, Sector V",
      city: "Kolkata",
      country: "India",
      ip: clientIp || "127.0.0.1",
      is_approximate: true,
      source: "aerva_default_hub",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: true,
        lat: 22.5804,
        lng: 88.4173,
        area: "Salt Lake, Sector V",
        city: "Kolkata",
        country: "India",
        is_approximate: true,
        source: "fallback",
      },
      { status: 200 }
    );
  }
}
