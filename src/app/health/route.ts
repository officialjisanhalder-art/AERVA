import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "AERVA Emergency Platform & Hospital Discovery API",
    integrations: {
      browser_use_cloud: Boolean(process.env.BROWSER_USE_API_KEY),
      agent37: Boolean(process.env.AGENT37_API_KEY),
      nodus_compute: Boolean(process.env.NODUS_API_KEY),
      elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
      google_places: Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY),
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
