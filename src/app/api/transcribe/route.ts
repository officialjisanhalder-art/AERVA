import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Returning safe fallback.");
      return NextResponse.json({
        transcript: "Voice brief recorded. Staff can listen to the audio directly.",
        summary: {
          reportedIssue: "Emergency Voice Note",
          breathingDifficulty: "Unknown",
          patientCount: 1,
        }
      });
    }

    const formData = await req.formData();
    const file = formData.get("audio") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Convert audio Blob to Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");
    
    // Clean audio mimeType
    let mimeType = file.type || "audio/webm";
    if (mimeType.includes("webm")) mimeType = "audio/webm";
    else if (mimeType.includes("mp4") || mimeType.includes("m4a")) mimeType = "audio/mp4";
    else if (mimeType.includes("ogg")) mimeType = "audio/ogg";
    else if (mimeType.includes("mp3") || mimeType.includes("mpeg")) mimeType = "audio/mp3";
    else mimeType = "audio/webm";

    const prompt = `You are an emergency medical dispatcher assistant.
Listen to this emergency voice note from a patient or bystander.
1. Provide a direct, faithful transcript of what they said.
2. Extract:
- reportedIssue: 2-4 word concise description of medical emergency.
- breathingDifficulty: "Yes", "No", or "Unknown".
- patientCount: number of patients (default 1).

Respond ONLY with valid JSON in this format:
{
  "transcript": "Exact transcription...",
  "reportedIssue": "string",
  "breathingDifficulty": "string",
  "patientCount": number
}`;

    const ai = new GoogleGenAI({ apiKey });

    // Try primary model, fallback if 503/error
    const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.5-flash"];
    let resultText = "";

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            prompt,
            {
              inlineData: {
                data: base64Audio,
                mimeType,
              }
            }
          ],
          config: {
            responseMimeType: "application/json",
          }
        });
        if (response.text) {
          resultText = response.text;
          break;
        }
      } catch (modelErr: any) {
        console.warn(`Model ${model} attempt failed:`, modelErr?.message?.slice(0, 100));
      }
    }

    let parsed: any = {};
    if (resultText) {
      try {
        parsed = JSON.parse(resultText);
      } catch {
        parsed = { transcript: resultText };
      }
    }

    return NextResponse.json({ 
      transcript: parsed.transcript || "Voice brief recorded. Staff can listen to the audio directly.",
      summary: {
        reportedIssue: parsed.reportedIssue || "Emergency Voice Note",
        breathingDifficulty: parsed.breathingDifficulty || "Unknown",
        patientCount: parsed.patientCount || 1,
      }
    });
  } catch (error: any) {
    console.warn("Transcribe handler fallback:", error?.message || error);
    // Never fail the request — voice note is preserved
    return NextResponse.json({ 
      transcript: "Voice brief recorded. Staff can listen to the audio directly.",
      summary: {
        reportedIssue: "Emergency Voice Note",
        breathingDifficulty: "Unknown",
        patientCount: 1,
      }
    });
  }
}

