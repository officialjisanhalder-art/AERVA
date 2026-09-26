import { NextRequest, NextResponse } from "next/server";
import { getJson } from "serpapi";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "hospitals";
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const api_key = process.env.SERPAPI_API_KEY;

    if (!api_key) {
      return NextResponse.json({ error: "SERPAPI_API_KEY is not set" }, { status: 500 });
    }

    const params: any = {
      engine: "google_local",
      q: query,
      hl: "en",
      gl: "in",
      api_key
    };

    if (lat && lng) {
      params.ll = `@${lat},${lng},14z`;
    }

    const response = await getJson(params);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("SerpApi Nearby Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
