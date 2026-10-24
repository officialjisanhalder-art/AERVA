/**
 * AERVA ROUTING ENGINE — AUDIT LOGGER & PERSISTENCE
 * Logs routing_decisions, routing_candidates, and route_change_events
 */

import { supabase, isSupabaseConfigured } from "../supabase/client";
import { MatchResponse, RouteChangeEvent, RecommendedHospital } from "./types";

export interface RoutingDecisionLog {
  id: string;
  case_id: string;
  engine_version: string;
  recommended_hospital_id: string;
  patient_latitude: number;
  patient_longitude: number;
  emergency_type: string;
  search_radius_km: number;
  created_at: string;
  decision_reason_json: {
    reason_codes: string[];
    human_reasons: string[];
    eta_minutes: number;
    distance_km: number;
  };
  candidates: {
    hospital_id: string;
    distance_km: number;
    eta_minutes: number;
    capability_eligible: boolean;
    availability_status: string;
    data_confidence: string;
    selection_status: "RECOMMENDED" | "ALTERNATIVE" | "ELIMINATED";
    reason_json: string[];
  }[];
}

// In-memory persistent buffer (keeps last 50 decisions & reroutes for immediate audit retrieval)
const inMemoryDecisions: RoutingDecisionLog[] = [];
const inMemoryRouteEvents: RouteChangeEvent[] = [];

export const routingAuditStore = {
  async logDecision(
    matchResult: MatchResponse,
    patientLat: number,
    patientLng: number,
    emergencyType: string,
    allCandidates: {
      hospital: RecommendedHospital;
      eligible: boolean;
      status: "RECOMMENDED" | "ALTERNATIVE" | "ELIMINATED";
      eliminationReason?: string;
    }[]
  ): Promise<string> {
    const decisionId = `rd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const candidateLogs = allCandidates.map((c) => ({
      hospital_id: c.hospital.hospital_id,
      distance_km: c.hospital.distance_km,
      eta_minutes: c.hospital.estimated_travel_minutes,
      capability_eligible: c.eligible,
      availability_status: c.hospital.emergency_receiving_status,
      data_confidence: c.hospital.data_confidence,
      selection_status: c.status,
      reason_json: c.hospital.reason_codes,
    }));

    const decisionLog: RoutingDecisionLog = {
      id: decisionId,
      case_id: matchResult.case_id,
      engine_version: matchResult.engine_version,
      recommended_hospital_id: matchResult.recommended_hospital.hospital_id,
      patient_latitude: patientLat,
      patient_longitude: patientLng,
      emergency_type: emergencyType,
      search_radius_km: matchResult.search_radius_km,
      created_at: new Date().toISOString(),
      decision_reason_json: {
        reason_codes: matchResult.recommended_hospital.reason_codes,
        human_reasons: matchResult.recommended_hospital.human_reasons,
        eta_minutes: matchResult.recommended_hospital.estimated_travel_minutes,
        distance_km: matchResult.recommended_hospital.distance_km,
      },
      candidates: candidateLogs,
    };

    inMemoryDecisions.unshift(decisionLog);
    if (inMemoryDecisions.length > 50) inMemoryDecisions.pop();

    // Async push to Supabase audit tables if tables exist
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("emergency_case_events").insert({
          event_type: "ROUTING_DECISION",
          event_data: {
            case_id: matchResult.case_id,
            recommended_hospital_id: matchResult.recommended_hospital.hospital_id,
            reasons: matchResult.recommended_hospital.reason_codes,
            engine_version: matchResult.engine_version,
          },
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        // Table or cache notice handled gracefully
      }
    }

    return decisionId;
  },

  async logRouteChange(event: Omit<RouteChangeEvent, "id">): Promise<string> {
    const eventId = `rc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullEvent: RouteChangeEvent = {
      ...event,
      id: eventId,
    };

    inMemoryRouteEvents.unshift(fullEvent);
    if (inMemoryRouteEvents.length > 50) inMemoryRouteEvents.pop();

    // Log to Supabase event history
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("emergency_case_events").insert({
          event_type: "ROUTE_CHANGED",
          event_data: {
            case_id: event.case_id,
            old_hospital_id: event.old_hospital_id,
            new_hospital_id: event.new_hospital_id,
            old_eta: event.old_eta,
            new_eta: event.new_eta,
            trigger_type: event.trigger_type,
            reason: event.reason,
          },
          created_at: event.created_at,
        });
      } catch (err) {
        // Handled gracefully
      }
    }

    return eventId;
  },

  async recordDestinationConfirmation(confirmation: {
    case_id: string;
    hospital_id: string;
    hospital_name: string;
    eta_minutes: number;
    created_at: string;
  }): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("emergency_case_events").insert({
          event_type: "DESTINATION_CONFIRMED",
          event_data: confirmation,
          created_at: confirmation.created_at,
        });
      } catch (err) {
        // Handled gracefully
      }
    }
  },

  getRecentDecisions(): RoutingDecisionLog[] {
    return inMemoryDecisions;
  },

  getDecisionByCaseId(caseId: string): RoutingDecisionLog | undefined {
    return inMemoryDecisions.find((d) => d.case_id === caseId);
  },

  getRecentRouteEvents(): RouteChangeEvent[] {
    return inMemoryRouteEvents;
  },
};
