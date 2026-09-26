import { NextRequest, NextResponse } from "next/server";
import { getJson } from "serpapi";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startLat = searchParams.get("startLat");
    const startLng = searchParams.get("startLng");
    const endLat = searchParams.get("endLat");
    const endLng = searchParams.get("endLng");
    const type = searchParams.get("type") || "driving";
    const api_key = process.env.SERPAPI_API_KEY;

    if (!api_key) {
      return NextResponse.json({ error: "SERPAPI_API_KEY is not set" }, { status: 500 });
    }

    if (!startLat || !startLng || !endLat || !endLng) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    // Convert type to Google Maps routing type
    let data_dir = "";
    if (type === "driving") {
       data_dir = `!4m2!4m1!3e0`; 
    }

    const params = {
      engine: "google_maps_directions",
      start_addr: `${startLat},${startLng}`,
      end_addr: `${endLat},${endLng}`,
      hl: "en",
      gl: "in",
      api_key
    };

    const response = await getJson(params);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("SerpApi Traffic Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
