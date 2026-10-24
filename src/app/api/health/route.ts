import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "AERVA Emergency Platform & Hospital Discovery API",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
