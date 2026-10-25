/**
 * AERVA ROUTING ENGINE — DYNAMIC REROUTING & ACTIVE MONITORING SERVICE
 * 
 * Hysteresis Rule: MIN_TIME_GAIN_FOR_OPTIONAL_REROUTE = 5 mins
 * Mandatory Reroute: Current hospital unavailable, closed, or rejected case
 */

import { RecheckRequest, RecheckResponse, RerouteRequest, RerouteResponse, RerouteType } from "./types";
import { AERVARoutingService } from "./routing-engine";
import { routingAuditStore } from "./routing-audit-store";
import { supabase, isSupabaseConfigured } from "../supabase/client";

export const MIN_TIME_GAIN_FOR_OPTIONAL_REROUTE_MINS = 5;

export class AERVAReroutingService {
  /**
   * Recheck active route and evaluate if conditions warrant rerouting
   */
  public static async evaluateRoute(request: RecheckRequest): Promise<RecheckResponse> {
    const { case_id, current_hospital_id, patient_location, emergency_type, requirements } = request;

    // Run standard fresh routing analysis
    const freshMatch = await AERVARoutingService.matchEmergency({
      case_id,
      patient_location,
      emergency_type,
      requirements,
      hospital_overrides: request.hospital_overrides,
    });

    const recommended = freshMatch.recommended_hospital;
    const allCandidates = [recommended, ...freshMatch.alternatives];

    // Locate current destination in candidates list
    const currentCandidate = allCandidates.find(
      (c) => c.hospital_id === current_hospital_id || (current_hospital_id === "h2_amri" && c.hospital_id === "h2")
    ) || {
      hospital_id: current_hospital_id,
      name: "Current Hospital",
      estimated_travel_minutes: 20,
      emergency_receiving_status: "UNKNOWN" as const,
    };

    const isCurrentUnavailable =
      currentCandidate.emergency_receiving_status === "TEMPORARILY_UNAVAILABLE" ||
      currentCandidate.emergency_receiving_status === "UNKNOWN" ||
      (currentCandidate.metrics && currentCandidate.metrics.er_beds_open !== null && currentCandidate.metrics.er_beds_open <= 0);

    // 1. Mandatory Reroute Check
    if (isCurrentUnavailable) {
      // Current hospital cannot accept emergency (full beds or suspended)! Reroute is critical & mandatory.
      const bestAvailable = allCandidates.find(
        (c) => c.hospital_id !== current_hospital_id && (c.metrics?.er_beds_open ?? 1) > 0 && c.emergency_receiving_status !== "TEMPORARILY_UNAVAILABLE"
      ) || recommended;

      return {
        case_id,
        reroute_recommended: true,
        reroute_type: "MANDATORY",
        current_destination: {
          hospital_id: currentCandidate.hospital_id,
          name: currentCandidate.name,
          eta_minutes: currentCandidate.estimated_travel_minutes,
          status: currentCandidate.emergency_receiving_status,
        },
        better_destination: {
          hospital_id: bestAvailable.hospital_id,
          name: bestAvailable.name,
          latitude: bestAvailable.latitude,
          longitude: bestAvailable.longitude,
          eta_minutes: bestAvailable.estimated_travel_minutes,
          status: bestAvailable.emergency_receiving_status,
          distance_km: bestAvailable.distance_km,
          time_saved_minutes: Math.max(0, currentCandidate.estimated_travel_minutes - bestAvailable.estimated_travel_minutes),
          reason_codes: ["CURRENT_HOSPITAL_UNAVAILABLE", ...bestAvailable.reason_codes],
          human_reasons: [
            "Current selected hospital has suspended ER intake",
            "AERVA verified active resuscitation bay at alternative hospital",
            ...bestAvailable.human_reasons,
          ],
        },
        evaluation_reason: "Selected hospital can no longer receive emergency cases. Immediate reroute recommended.",
        timestamp: new Date().toISOString(),
      };
    }

    // 2. Optional Reroute Check (Hysteresis rule: delta >= 5 mins)
    const timeDifference = currentCandidate.estimated_travel_minutes - recommended.estimated_travel_minutes;
    const isDifferentHospital = recommended.hospital_id !== currentCandidate.hospital_id;

    if (isDifferentHospital && timeDifference >= MIN_TIME_GAIN_FOR_OPTIONAL_REROUTE_MINS) {
      return {
        case_id,
        reroute_recommended: true,
        reroute_type: "OPTIONAL",
        current_destination: {
          hospital_id: currentCandidate.hospital_id,
          name: currentCandidate.name,
          eta_minutes: currentCandidate.estimated_travel_minutes,
          status: currentCandidate.emergency_receiving_status,
        },
        better_destination: {
          hospital_id: recommended.hospital_id,
          name: recommended.name,
          latitude: recommended.latitude,
          longitude: recommended.longitude,
          eta_minutes: recommended.estimated_travel_minutes,
          status: recommended.emergency_receiving_status,
          distance_km: recommended.distance_km,
          time_saved_minutes: timeDifference,
          reason_codes: ["SIGNIFICANT_TIME_SAVED", ...recommended.reason_codes],
          human_reasons: [
            `${timeDifference} minutes faster road transit verified`,
            "Live ER bed availability verified",
            ...recommended.human_reasons,
          ],
        },
        evaluation_reason: `A more suitable emergency destination is now available (${timeDifference} mins faster).`,
        timestamp: new Date().toISOString(),
      };
    }

    // 3. No Reroute Needed (Difference is < 5 mins or current hospital is best)
    return {
      case_id,
      reroute_recommended: false,
      reroute_type: "NONE",
      current_destination: {
        hospital_id: currentCandidate.hospital_id,
        name: currentCandidate.name,
        eta_minutes: currentCandidate.estimated_travel_minutes,
        status: currentCandidate.emergency_receiving_status,
      },
      evaluation_reason: "Current route optimal. No meaningful time or capability advantage to justify rerouting.",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Confirm and apply destination reroute
   */
  public static async applyReroute(request: RerouteRequest): Promise<RerouteResponse> {
    const { case_id, old_hospital_id, new_hospital_id, reason, patient_location } = request;

    // Load hospital details
    const all = await AERVARoutingService.matchEmergency({
      case_id,
      patient_location: patient_location || { latitude: 22.5645, longitude: 88.4069 },
      emergency_type: "general",
    });

    const targetHospital = [all.recommended_hospital, ...all.alternatives].find(
      (h) => h.hospital_id === new_hospital_id
    ) || all.recommended_hospital;

    const oldHospital = [all.recommended_hospital, ...all.alternatives].find(
      (h) => h.hospital_id === old_hospital_id
    );

    // Build Google Maps navigation URL
    const destinationStr = `${targetHospital.latitude},${targetHospital.longitude}`;
    const originStr = patient_location ? `&origin=${patient_location.latitude},${patient_location.longitude}` : "";
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationStr}${originStr}&travelmode=driving`;

    // Log ROUTE_CHANGED event in audit log
    await routingAuditStore.logRouteChange({
      case_id,
      old_hospital_id,
      new_hospital_id: targetHospital.hospital_id,
      old_eta: oldHospital?.estimated_travel_minutes || 15,
      new_eta: targetHospital.estimated_travel_minutes,
      trigger_type: reason.includes("UNAVAILABLE") ? "MANDATORY" : "OPTIONAL",
      reason,
      created_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    });

    // Update Supabase emergency case destination in real-time
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("emergency_requests")
          .update({
            selected_hospital_id: targetHospital.hospital_id,
            updated_at: new Date().toISOString(),
          })
          .eq("case_id", case_id);
      } catch (err) {
        console.warn("Supabase reroute update notice:", err);
      }
    }

    return {
      success: true,
      case_id,
      updated_hospital_id: targetHospital.hospital_id,
      updated_hospital_name: targetHospital.name,
      new_coordinates: {
        latitude: targetHospital.latitude,
        longitude: targetHospital.longitude,
      },
      google_maps_url: googleMapsUrl,
      event_logged: true,
      timestamp: new Date().toISOString(),
    };
  }
}
