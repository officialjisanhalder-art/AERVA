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

    // Query IP geolocation worldwide
    const ipUrl = isLocal ? "https://ipwho.is/" : `https://ipwho.is/${clientIp}`;

    try {
      const ipRes = await fetch(ipUrl, {
        headers: { "User-Agent": "AERVA-Emergency-Coordination/1.0" },
        signal: AbortSignal.timeout(3500),
      });

      if (ipRes.ok) {
        const data = await ipRes.json();
        if (data && data.success && typeof data.latitude === "number" && typeof data.longitude === "number") {
          return NextResponse.json({
            success: true,
            lat: data.latitude,
            lng: data.longitude,
            city: data.city || "Detected City",
            area: data.region || data.city || "Detected Area",
            country: data.country || "Detected Country",
            ip: data.ip || clientIp,
            is_approximate: true,
            source: "ipwhois_live",
          });
        }
      }
    } catch (err) {
      console.warn("[Location IP] Lookup warning:", err);
    }

    // Default global fallback hub (if offline)
    return NextResponse.json({
      success: true,
      lat: 26.1844,
      lng: 91.7458,
      area: "Guwahati Central",
      city: "Guwahati",
      country: "India",
      ip: clientIp || "127.0.0.1",
      is_approximate: true,
      source: "aerva_default_hub",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: true,
        lat: 26.1844,
        lng: 91.7458,
        area: "Guwahati Central",
        city: "Guwahati",
        country: "India",
        is_approximate: true,
        source: "fallback",
      },
      { status: 200 }
    );
  }
}
