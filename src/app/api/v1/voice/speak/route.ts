import { NextRequest, NextResponse } from "next/server";
import { elevenLabsService } from "@/lib/services/elevenLabsService";

export async function POST(req: NextRequest) {
  try {
    const { text, voice_id } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const audioBuffer = await elevenLabsService.textToSpeech(text.slice(0, 500), voice_id);

    if (!audioBuffer) {
      return NextResponse.json(
        { error: "TTS generation unavailable or ELEVENLABS_API_KEY not configured" },
        { status: 503 }
      );
    }

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("[AERVA TTS API] Error:", error);
    return NextResponse.json({ error: error?.message || "TTS error" }, { status: 500 });
  }
}
