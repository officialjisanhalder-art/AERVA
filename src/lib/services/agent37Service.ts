/**
 * AERVA — AGENT37 EMERGENCY COORDINATION AGENT
 * Orchestrates hospital discovery and emergency case preparation using authenticated AERVA backend tools.
 * Complies with Agent37 official documentation (https://www.agent37.com/docs, https://www.agent37.com/docs/llms-full.txt).
 * Security guarantee: Tools execute against backend authority; patient confirmation strictly required for submission.
 */

import { supabase, isSupabaseConfigured } from "../supabase/client";
import { googlePlacesService, UnifiedHospitalResult } from "./googlePlacesService";
import { hospitalService } from "./hospitalService";
import { hospitalMatchingService, MatchScoreResult } from "./hospitalMatchingService";
import { emergencyService, EmergencyCase } from "./emergencyService";

export interface Agent37ToolCallRecord {
  tool: string;
  arguments: any;
  result: any;
  timestamp: string;
  duration_ms: number;
}

export interface Agent37ExecutionResult {
  execution_id: string;
  session_id: string;
  status: "COMPLETED" | "FALLBACK" | "FAILED";
  tool_calls: Agent37ToolCallRecord[];
  recommended_hospital: MatchScoreResult | null;
  all_candidates: MatchScoreResult[];
  prepared_request: {
    case_id: string;
    patient_name: string;
    emergency_type: string;
    selected_hospital_id: string;
    selected_hospital_name: string;
    requires_patient_confirmation: true;
    submission_status: "DRAFT_AWAITING_CONFIRMATION";
  } | null;
  coordination_summary: string;
  latency_ms: number;
  agent_provider: "AGENT37_REMOTE" | "AGENT37_BACKEND_HARNESS";
  error?: string;
}

export class Agent37Coordinator {
  private apiKey: string;
  private instanceUrl: string;

  constructor() {
    this.apiKey = process.env.AGENT37_API_KEY || "";
    this.instanceUrl = (process.env.AGENT37_INSTANCE_URL || "").replace(/\/$/, "");
  }

  /**
   * Run Emergency Coordination Workflow
   */
  async coordinateEmergency(params: {
    caseId?: string;
    patientName?: string;
    patientPhone?: string;
    emergencyType: string;
    latitude: number;
    longitude: number;
    patientBloodGroup?: string;
    requirements?: string[];
  }): Promise<Agent37ExecutionResult> {
    const startTime = Date.now();
    const executionId = `a37_exec_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionId = `a37_sess_${Date.now().toString(36)}`;
    const toolCalls: Agent37ToolCallRecord[] = [];

    try {
      // -------------------------------------------------------------
      // TOOL 1: search_nearby_hospitals
      // -------------------------------------------------------------
      const t1Start = Date.now();
      const discovery = await this.tool_search_nearby_hospitals(params.latitude, params.longitude, 20);
      toolCalls.push({
        tool: "search_nearby_hospitals",
        arguments: { latitude: params.latitude, longitude: params.longitude, radius_km: 20 },
        result: { total_found: discovery.length, source: "GooglePlaces + AERVA DB" },
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - t1Start,
      });

      // -------------------------------------------------------------
      // TOOL 2 & 3: get_verified_hospital_record & get_hospital_resources
      // -------------------------------------------------------------
      const verifiedRecords = [];
      for (const candidate of discovery.slice(0, 8)) {
        const tRecordStart = Date.now();
        const record = await this.tool_get_verified_hospital_record(candidate.hospital_id);
        const resources = await this.tool_get_hospital_resources(candidate.hospital_id);
        
        toolCalls.push({
          tool: "get_hospital_resources",
          arguments: { hospital_id: candidate.hospital_id },
          result: {
            is_verified: record?.is_verified ?? false,
            er_beds: resources?.er_beds_available ?? null,
            icu_beds: resources?.icu_beds_available ?? null,
          },
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - tRecordStart,
        });

        if (record) {
          verifiedRecords.push(record);
        }
      }

      // -------------------------------------------------------------
      // TOOL 4: filter_hospitals_by_requirements
      // -------------------------------------------------------------
      const tFilterStart = Date.now();
      const filterResult = this.tool_filter_hospitals_by_requirements(
        verifiedRecords,
        params.emergencyType,
        params.patientBloodGroup || "O+"
      );
      const bestHosp: any = filterResult.bestMatch?.hospital;
      toolCalls.push({
        tool: "filter_hospitals_by_requirements",
        arguments: {
          emergency_type: params.emergencyType,
          hospitals_evaluated: verifiedRecords.length,
          blood_group: params.patientBloodGroup || "O+",
        },
        result: {
          best_match_id: bestHosp?.id || bestHosp?.hospital_id || null,
          total_ranked: filterResult.allRanked.length,
        },
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - tFilterStart,
      });

      // -------------------------------------------------------------
      // TOOL 5: prepare_emergency_request (Patient confirmation safety)
      // -------------------------------------------------------------
      let preparedRequest = null;
      if (filterResult.bestMatch) {
        const tPrepStart = Date.now();
        const bestHosp: any = filterResult.bestMatch.hospital;
        preparedRequest = await this.tool_prepare_emergency_request({
          caseId: params.caseId || `NR-${Math.floor(10000 + Math.random() * 90000)}`,
          patientName: params.patientName || "Emergency Patient",
          patientPhone: params.patientPhone || "+91 98765 43210",
          emergencyType: params.emergencyType,
          selectedHospitalId: bestHosp?.id || bestHosp?.hospital_id || "apollo",
          selectedHospitalName: bestHosp.name,
        });
        toolCalls.push({
          tool: "prepare_emergency_request",
          arguments: {
            case_id: preparedRequest.case_id,
            hospital_id: preparedRequest.selected_hospital_id,
          },
          result: {
            status: preparedRequest.submission_status,
            requires_patient_confirmation: true,
          },
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - tPrepStart,
        });
      }

      // -------------------------------------------------------------
      // If Agent37 remote instance configured, send turn to remote agent
      // -------------------------------------------------------------
      let agentProvider: Agent37ExecutionResult["agent_provider"] = "AGENT37_BACKEND_HARNESS";
      let summaryText = "";

      if (this.instanceUrl && this.apiKey) {
        try {
          const remoteResp = await fetch(`${this.instanceUrl}/v1/responses`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Agent37-Key": this.apiKey,
            },
            body: JSON.stringify({
              input: `Coordinate emergency intake for ${params.emergencyType}. Recommended hospital: ${filterResult.bestMatch?.hospital?.name || "None"}. Open ER beds: ${filterResult.bestMatch?.metrics.erBedsOpen ?? 0}.`,
              session_id: sessionId,
              stream: false,
            }),
            signal: AbortSignal.timeout(5000),
          });
          if (remoteResp.ok) {
            const remoteJson = await remoteResp.json();
            summaryText = remoteJson.output_text || "";
            agentProvider = "AGENT37_REMOTE";
          }
        } catch (remoteErr) {
          console.warn("[Agent37] Remote turn warning, backend harness handling:", remoteErr);
        }
      }

      if (!summaryText) {
        summaryText = filterResult.bestMatch
          ? `Identified best matching facility ${filterResult.bestMatch.hospital.name} with ${filterResult.bestMatch.metrics.erBedsOpen} open ER beds and ETA of ${filterResult.bestMatch.metrics.etaMinutes} minutes. Request prepared and waiting for patient one-tap confirmation.`
          : `Discovered nearby facilities; manual hospital selection available.`;
      }

      const totalLatency = Date.now() - startTime;

      // Persist execution log to database
      await this.logExecution({
        executionId,
        caseId: params.caseId,
        latencyMs: totalLatency,
        toolCallsCount: toolCalls.length,
        status: "COMPLETED",
        recommendedHospitalId: (filterResult.bestMatch?.hospital as any)?.id || (filterResult.bestMatch?.hospital as any)?.hospital_id,
      });

      return {
        execution_id: executionId,
        session_id: sessionId,
        status: "COMPLETED",
        tool_calls: toolCalls,
        recommended_hospital: filterResult.bestMatch,
        all_candidates: filterResult.allRanked,
        prepared_request: preparedRequest,
        coordination_summary: summaryText,
        latency_ms: totalLatency,
        agent_provider: agentProvider,
      };
    } catch (err: any) {
      const totalLatency = Date.now() - startTime;
      console.error("[Agent37Coordinator] Coordination failed:", err);

      await this.logExecution({
        executionId,
        caseId: params.caseId,
        latencyMs: totalLatency,
        toolCallsCount: toolCalls.length,
        status: "FAILED",
        error: err?.message,
      });

      return {
        execution_id: executionId,
        session_id: sessionId,
        status: "FAILED",
        tool_calls: toolCalls,
        recommended_hospital: null,
        all_candidates: [],
        prepared_request: null,
        coordination_summary: "Coordination encountered an error. Proceed with manual hospital list.",
        latency_ms: totalLatency,
        agent_provider: "AGENT37_BACKEND_HARNESS",
        error: err?.message,
      };
    }
  }

  // Tool 1 Implementation
  private async tool_search_nearby_hospitals(lat: number, lng: number, radiusKm: number) {
    const discovery = await googlePlacesService.searchNearbyHospitals(lat, lng, radiusKm * 1000);
    return discovery.hospitals;
  }

  // Tool 2 Implementation
  private async tool_get_verified_hospital_record(hospitalId: string) {
    return await hospitalService.getHospitalById(hospitalId);
  }

  // Tool 3 Implementation
  private async tool_get_hospital_resources(hospitalId: string) {
    const h = await hospitalService.getHospitalById(hospitalId);
    return h?.capacity || null;
  }

  // Tool 4 Implementation
  private tool_filter_hospitals_by_requirements(
    hospitals: any[],
    emergencyType: string,
    preferredBloodGroup: string
  ) {
    return hospitalMatchingService.findBestMatch(hospitals, emergencyType, preferredBloodGroup);
  }

  // Tool 5 Implementation: Patient must confirm before submission!
  private async tool_prepare_emergency_request(params: {
    caseId: string;
    patientName: string;
    patientPhone: string;
    emergencyType: string;
    selectedHospitalId: string;
    selectedHospitalName: string;
  }) {
    return {
      case_id: params.caseId,
      patient_name: params.patientName,
      emergency_type: params.emergencyType,
      selected_hospital_id: params.selectedHospitalId,
      selected_hospital_name: params.selectedHospitalName,
      requires_patient_confirmation: true as const,
      submission_status: "DRAFT_AWAITING_CONFIRMATION" as const,
    };
  }

  // Tool 6 Implementation: Query request status
  async tool_get_emergency_request_status(caseId: string) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from("emergency_requests")
          .select("case_id, status, selected_hospital_id, updated_at")
          .eq("case_id", caseId)
          .single();
        if (data) return data;
      } catch {}
    }
    const local = await emergencyService.getActiveCase();
    if (local && local.caseId === caseId) {
      return {
        case_id: local.caseId,
        status: local.status,
        selected_hospital_id: local.selectedHospitalId,
        updated_at: local.createdAt,
      };
    }
    return null;
  }

  private async logExecution(params: {
    executionId: string;
    caseId?: string;
    latencyMs: number;
    toolCallsCount: number;
    status: "COMPLETED" | "FAILED";
    recommendedHospitalId?: string;
    error?: string;
  }) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("integration_event_logs").insert({
          service_name: "AGENT37",
          event_type: "COORDINATION_EXECUTION",
          execution_id: params.executionId,
          case_id: params.caseId || null,
          latency_ms: params.latencyMs,
          status: params.status === "COMPLETED" ? "SUCCESS" : "FAILED",
          error_message: params.error || null,
          payload: {
            tools_invoked: params.toolCallsCount,
            recommended_hospital_id: params.recommendedHospitalId,
          },
        });
      } catch (e) {
        console.warn("[Agent37Coordinator] Log error:", e);
      }
    }
  }
}

export const agent37Coordinator = new Agent37Coordinator();
