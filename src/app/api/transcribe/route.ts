import { NextResponse } from "next/server";
import { elevenLabsService } from "@/lib/services/elevenLabsService";
import { nodusClient } from "@/lib/services/nodusService";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "audio/webm";

    let transcript = "";
    let provider = "ELEVENLABS";

    // 1. Try ElevenLabs First (Primary AERVA Audio Pipeline)
    if (process.env.ELEVENLABS_API_KEY) {
      const elResult = await elevenLabsService.transcribeAudio(buffer, mimeType, file.name || "emergency_brief.webm");
      if (elResult.transcript && elResult.provider === "ELEVENLABS") {
        transcript = elResult.transcript;
        provider = "ELEVENLABS";
      }
    }

    // 2. Fallback to Gemini if ElevenLabs not configured or failed
    if (!transcript && process.env.GEMINI_API_KEY) {
      try {
        const base64Audio = buffer.toString("base64");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            "Transcribe this emergency audio faithfully. Return only the transcript text.",
            { inlineData: { data: base64Audio, mimeType } },
          ],
        });
        if (response.text) {
          transcript = response.text.trim();
          provider = "GEMINI_FALLBACK";
        }
      } catch (gErr) {
        console.warn("[Transcribe Route] Gemini fallback warning:", gErr);
      }
    }

    if (!transcript) {
      transcript = "Emergency brief recorded. Staff can listen to audio directly.";
      provider = "LOCAL_AUDIO_STORED";
    }

    // 3. Structured Emergency Interpretation via Nodus Compute
    let interpretation = null;
    try {
      const nodusTrace = await nodusClient.interpretEmergency(transcript);
      if (nodusTrace.status === "SUCCESS") {
        interpretation = nodusTrace.data;
      }
    } catch (nodusErr) {
      console.warn("[Transcribe Route] Nodus interpretation warning:", nodusErr);
    }

    return NextResponse.json({
      success: true,
      transcript,
      provider,
      structured_interpretation: interpretation,
      summary: {
        reportedIssue: interpretation?.reported_situation || "Emergency Voice Brief",
        breathingDifficulty: interpretation?.critical_warning_indicators?.some((w) =>
          w.toLowerCase().includes("breath") || w.toLowerCase().includes("respir")
        )
          ? "Yes"
          : "No",
        patientCount: 1,
        potential_care_requirements: interpretation?.potential_care_requirements || [],
        potential_resource_requirements: interpretation?.potential_resource_requirements || [],
      },
    });
  } catch (error: any) {
    console.error("[Transcribe Route] Error:", error);
    return NextResponse.json(
      {
        success: false,
        transcript: "Emergency brief recorded.",
        provider: "FALLBACK",
        summary: {
          reportedIssue: "Emergency Voice Note",
          breathingDifficulty: "Unknown",
          patientCount: 1,
        },
      },
      { status: 200 }
    );
  }
}
