/**
 * AERVA — NODUS COMPUTE INFERENCE CLIENT
 * Server-side client for structured emergency situation interpretation.
 * Uses OpenAI-compatible endpoint: https://inference.nodus-compute.ai/v1
 */

import { supabase, isSupabaseConfigured } from "../supabase/client";

export interface NodusInterpretationResult {
  reported_situation: string;
  location: string | null;
  reported_symptoms: string[];
  potential_care_requirements: string[];
  potential_resource_requirements: string[];
  critical_warning_indicators: string[];
  missing_information: string[];
  needs_emergency_guidance: boolean;
}

export interface NodusExecutionTrace {
  requestId: string | null;
  model: string;
  latencyMs: number;
  status: "SUCCESS" | "FAILED" | "FALLBACK";
  error?: string;
  data?: NodusInterpretationResult;
}

const REQUIRED_KEYS: (keyof NodusInterpretationResult)[] = [
  "reported_situation",
  "location",
  "reported_symptoms",
  "potential_care_requirements",
  "potential_resource_requirements",
  "critical_warning_indicators",
  "missing_information",
  "needs_emergency_guidance",
];

export function validateNodusOutput(data: any): data is NodusInterpretationResult {
  if (!data || typeof data !== "object") return false;

  for (const key of REQUIRED_KEYS) {
    if (!(key in data)) return false;
  }

  if (typeof data.reported_situation !== "string") return false;
  if (data.location !== null && typeof data.location !== "string") return false;
  if (!Array.isArray(data.reported_symptoms)) return false;
  if (!Array.isArray(data.potential_care_requirements)) return false;
  if (!Array.isArray(data.potential_resource_requirements)) return false;
  if (!Array.isArray(data.critical_warning_indicators)) return false;
  if (!Array.isArray(data.missing_information)) return false;
  if (typeof data.needs_emergency_guidance !== "boolean") return false;

  return true;
}

export class NodusClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.NODUS_API_KEY || "";
    this.baseUrl = (process.env.NODUS_BASE_URL || "https://inference.nodus-compute.ai/v1").replace(/\/$/, "");
    this.defaultModel = process.env.NODUS_MODEL || "nodus/gpt-oss-120b";
  }

  /**
   * Discovers available models from live Nodus catalog
   */
  async listLiveModels(): Promise<string[]> {
    if (!this.apiKey) return [this.defaultModel];
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "User-Agent": "AERVA-Coordinator/1.0",
        },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.data)) {
          return json.data.map((m: any) => m.id || m.name).filter(Boolean);
        }
      }
    } catch (e) {
      console.warn("[NodusClient] Could not fetch live models catalog:", e);
    }
    return [this.defaultModel];
  }

  /**
   * Interpret emergency description with strict schema validation
   */
  async interpretEmergency(
    rawText: string,
    caseId?: string
  ): Promise<NodusExecutionTrace> {
    const startTime = Date.now();
    let requestId: string | null = null;
    const modelToUse = this.defaultModel;

    if (!rawText || !rawText.trim()) {
      return {
        requestId: null,
        model: modelToUse,
        latencyMs: 0,
        status: "FAILED",
        error: "Emergency description text cannot be empty",
      };
    }

    if (!this.apiKey) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = "NODUS_API_KEY is not configured in server environment";
      await this.logEvent({
        serviceName: "NODUS",
        eventType: "INFERENCE_REQUEST",
        requestId: null,
        caseId,
        latencyMs,
        status: "FALLBACK",
        error: errorMsg,
        payload: { input_length: rawText.length },
      });

      return {
        requestId: null,
        model: modelToUse,
        latencyMs,
        status: "FALLBACK",
        error: errorMsg,
      };
    }

    const systemPrompt = `You are AERVA's medical triage intake parser.
You receive raw patient or bystander emergency descriptions.
CRITICAL SAFETY CONSTRAINTS:
1. Do NOT diagnose medical conditions.
2. Do NOT prescribe medical treatments, dosages, or drug therapies.
3. Do NOT fabricate or estimate hospital bed counts, room availability, or medical schedules.
4. ONLY extract reported facts, reported symptoms, potential hospital department capabilities needed (e.g. Cardiology, Stroke Unit, Trauma Center, Burn Care), and missing critical information (e.g. consciousness, breathing status, exact address).

You MUST respond strictly with valid JSON conforming to this exact schema and nothing else:
{
  "reported_situation": "string",
  "location": "string or null",
  "reported_symptoms": ["string"],
  "potential_care_requirements": ["string"],
  "potential_resource_requirements": ["string"],
  "critical_warning_indicators": ["string"],
  "missing_information": ["string"],
  "needs_emergency_guidance": true
}`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "User-Agent": "AERVA-Inference/1.0",
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Emergency input: """${rawText}"""` },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(12000),
      });

      requestId = response.headers.get("nodus-request-id") || response.headers.get("x-request-id") || null;
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        const errorSummary = `Nodus inference failed with HTTP ${response.status}: ${errorText.slice(0, 200)}`;
        await this.logEvent({
          serviceName: "NODUS",
          eventType: "INFERENCE_REQUEST",
          requestId,
          caseId,
          latencyMs,
          status: "FAILED",
          error: errorSummary,
          payload: { model: modelToUse, input_preview: rawText.slice(0, 100) },
        });

        return {
          requestId,
          model: modelToUse,
          latencyMs,
          status: "FAILED",
          error: errorSummary,
        };
      }

      const responseBody = await response.json();
      const content = responseBody?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty message content returned from Nodus inference");
      }

      let parsed: any;
      try {
        parsed = typeof content === "string" ? JSON.parse(content) : content;
      } catch (err: any) {
        throw new Error(`Invalid JSON format returned from model: ${err.message}`);
      }

      if (!validateNodusOutput(parsed)) {
        throw new Error("Model response failed strict AERVA clinical schema validation");
      }

      await this.logEvent({
        serviceName: "NODUS",
        eventType: "INFERENCE_REQUEST",
        requestId,
        caseId,
        latencyMs,
        status: "SUCCESS",
        payload: { model: modelToUse, symptoms_count: parsed.reported_symptoms.length },
        responseSummary: {
          situation: parsed.reported_situation,
          resources: parsed.potential_resource_requirements,
        },
      });

      return {
        requestId,
        model: modelToUse,
        latencyMs,
        status: "SUCCESS",
        data: parsed,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = err?.message || "Unknown error during Nodus inference";
      await this.logEvent({
        serviceName: "NODUS",
        eventType: "INFERENCE_REQUEST",
        requestId,
        caseId,
        latencyMs,
        status: "FAILED",
        error: errorMsg,
        payload: { model: modelToUse, input_preview: rawText.slice(0, 100) },
      });

      return {
        requestId,
        model: modelToUse,
        latencyMs,
        status: "FAILED",
        error: errorMsg,
      };
    }
  }

  /**
   * Safe persistent logging into Supabase or console
   */
  private async logEvent(params: {
    serviceName: string;
    eventType: string;
    requestId: string | null;
    caseId?: string;
    latencyMs: number;
    status: "SUCCESS" | "FAILED" | "FALLBACK";
    error?: string;
    payload?: any;
    responseSummary?: any;
  }) {
    if (isSupabaseConfigured && supabase) {
      try {
        const insertPromise = Promise.resolve(
          supabase.from("integration_event_logs").insert({
            service_name: params.serviceName,
            event_type: params.eventType,
            request_id: params.requestId,
            case_id: params.caseId || null,
            latency_ms: params.latencyMs,
            status: params.status,
            error_message: params.error || null,
            payload: params.payload || {},
            response_summary: params.responseSummary || {},
          })
        );
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1200));
        await Promise.race([insertPromise, timeoutPromise]);
      } catch (e) {
        console.warn("[NodusClient] DB log warning:", e);
      }
    }
  }
}

export const nodusClient = new NodusClient();
