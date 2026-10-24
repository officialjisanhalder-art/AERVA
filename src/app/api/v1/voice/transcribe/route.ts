import { NextRequest, NextResponse } from "next/server";
import { elevenLabsService } from "@/lib/services/elevenLabsService";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided in request" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "audio/webm";

    const result = await elevenLabsService.transcribeAudio(buffer, mimeType, file.name || "emergency_brief.webm");

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      language_code: result.language_code || "en",
      provider: result.provider,
      latency_ms: result.latency_ms,
      warning: result.error || null,
    });
  } catch (error: any) {
    console.error("[AERVA Voice Transcribe API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        transcript: "Voice brief recorded. Ready for emergency triage.",
        error: error?.message || "Transcription processing failed",
      },
      { status: 200 }
    );
  }
}
