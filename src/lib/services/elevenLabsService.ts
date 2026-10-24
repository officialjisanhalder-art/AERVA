/**
 * AERVA — ELEVENLABS VOICE & TRANSLATION SERVICE
 * Server-side client for ElevenLabs Speech-to-Text (Scribe) and Text-to-Speech.
 * Provides AERVA Sense voice triage with graceful text fallback.
 */

import { supabase, isSupabaseConfigured } from "../supabase/client";

export interface ElevenLabsTranscriptionResult {
  transcript: string;
  language_code?: string;
  duration_seconds?: number;
  provider: "ELEVENLABS" | "FALLBACK";
  latency_ms: number;
  error?: string;
}

export class ElevenLabsService {
  private apiKey: string;
  private sttEndpoint = "https://api.elevenlabs.io/v1/speech-to-text";
  private ttsEndpoint = "https://api.elevenlabs.io/v1/text-to-speech";
  private defaultVoiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel / default clear medical narrator

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || "";
  }

  /**
   * Transcribe recorded emergency audio via ElevenLabs
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    mimeType = "audio/webm",
    fileName = "emergency_brief.webm"
  ): Promise<ElevenLabsTranscriptionResult> {
    const startTime = Date.now();

    if (!this.apiKey) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = "ELEVENLABS_API_KEY is not configured in server environment";
      await this.logEvent({
        eventType: "TRANSCRIPTION",
        latencyMs,
        status: "FALLBACK",
        error: errorMsg,
      });

      return {
        transcript: "Voice brief recorded. Ready for emergency coordination.",
        provider: "FALLBACK",
        latency_ms: latencyMs,
        error: errorMsg,
      };
    }

    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
      formData.append("file", blob, fileName);
      formData.append("model_id", "scribe_v1");

      const response = await fetch(this.sttEndpoint, {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
        },
        body: formData,
        signal: AbortSignal.timeout(15000),
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errText = await response.text();
        const errorMsg = `ElevenLabs STT error HTTP ${response.status}: ${errText.slice(0, 150)}`;
        await this.logEvent({
          eventType: "TRANSCRIPTION",
          latencyMs,
          status: "FAILED",
          error: errorMsg,
        });

        return {
          transcript: "Voice brief recorded. Ready for emergency coordination.",
          provider: "FALLBACK",
          latency_ms: latencyMs,
          error: errorMsg,
        };
      }

      const json = await response.json();
      const transcript = json.text || json.transcript || "";

      await this.logEvent({
        eventType: "TRANSCRIPTION",
        latencyMs,
        status: "SUCCESS",
        payload: { text_length: transcript.length, language: json.language_code },
      });

      return {
        transcript: transcript || "Voice brief recorded successfully.",
        language_code: json.language_code,
        duration_seconds: json.duration_seconds,
        provider: "ELEVENLABS",
        latency_ms: latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = err?.message || "Failed to contact ElevenLabs STT";
      await this.logEvent({
        eventType: "TRANSCRIPTION",
        latencyMs,
        status: "FAILED",
        error: errorMsg,
      });

      return {
        transcript: "Voice brief recorded. Ready for emergency coordination.",
        provider: "FALLBACK",
        latency_ms: latencyMs,
        error: errorMsg,
      };
    }
  }

  /**
   * Synthesize emergency audio instruction via ElevenLabs TTS
   */
  async textToSpeech(text: string, voiceId?: string): Promise<ArrayBuffer | null> {
    if (!this.apiKey || !text) return null;
    const voice = voiceId || this.defaultVoiceId;

    try {
      const response = await fetch(`${this.ttsEndpoint}/${voice}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return null;
      return await response.arrayBuffer();
    } catch (e) {
      console.warn("[ElevenLabsService] TTS generation warning:", e);
      return null;
    }
  }

  private async logEvent(params: {
    eventType: string;
    latencyMs: number;
    status: "SUCCESS" | "FAILED" | "FALLBACK";
    error?: string;
    payload?: any;
  }) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("integration_event_logs").insert({
          service_name: "ELEVENLABS",
          event_type: params.eventType,
          latency_ms: params.latencyMs,
          status: params.status,
          error_message: params.error || null,
          payload: params.payload || {},
        });
      } catch (e) {
        console.warn("[ElevenLabsService] DB log warning:", e);
      }
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
