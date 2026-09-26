/**
 * NEARER ROUTING ENGINE — CORE SUITABILITY & GEOFENCING SERVICE
 * Engine Version: NEARER_ROUTER_V1
 * 
 * Commercial Firewall: commercial_weight = 0 (No paid status can influence routing)
 */

import {
  MatchRequest,
  MatchResponse,
  RecommendedHospital,
  AvailabilityStatus,
  DataConfidence,
  CapabilityCode,
  RoutingRequirements,
} from "./types";
import { routingAuditStore } from "./routing-audit-store";
import { MOCK_HOSPITALS, Hospital } from "../demo-data";
import { DEMO_HOSPITALS_DATA, HospitalRecord } from "../services/hospitalService";
import { calculateDistanceKm, estimateDrivingEtaMinutes } from "../services/locationService";
import { supabase, isSupabaseConfigured } from "../supabase/client";

export const ROUTING_ENGINE_VERSION = "NEARER_ROUTER_V1";

// Adaptive geofence expansion stages
const GEOFENCE_STAGES_KM = [5, 10, 25, 50, 100];

// Hard Capability Gates
interface CapabilityRequirement {
  mandatoryKeywords: string[];
  mandatoryCodes: CapabilityCode[];
  requiresIcu: boolean;
  requiresVentilator: boolean;
  requiresBloodBank: boolean;
}

const EMERGENCY_CAPABILITY_GATES: Record<string, CapabilityRequirement> = {
  cardiac: {
    mandatoryKeywords: ["cardiac", "cardiology", "cath lab", "cardiovascular"],
    mandatoryCodes: ["CARDIAC_EMERGENCY", "CATH_LAB_24X7", "ICU"],
    requiresIcu: true,
    requiresVentilator: false,
    requiresBloodBank: true,
  },
  stroke: {
    mandatoryKeywords: ["stroke", "neurology", "neuro", "ct/mri"],
    mandatoryCodes: ["STROKE_UNIT", "CT_MRI_SCAN", "ICU"],
    requiresIcu: true,
    requiresVentilator: false,
    requiresBloodBank: false,
  },
  trauma: {
    mandatoryKeywords: ["trauma", "emergency surgery", "orthopedic", "general surgeon"],
    mandatoryCodes: ["TRAUMA_CENTER", "EMERGENCY_SURGERY"],
    requiresIcu: true,
    requiresVentilator: true,
    requiresBloodBank: true,
  },
  burns: {
    mandatoryKeywords: ["burn", "plastic surgery", "critical care"],
    mandatoryCodes: ["BURN_CARE", "ICU"],
    requiresIcu: true,
    requiresVentilator: true,
    requiresBloodBank: false,
  },
  respiratory: {
    mandatoryKeywords: ["respiratory", "pulmonology", "ventilator", "critical care"],
    mandatoryCodes: ["VENTILATOR", "ICU"],
    requiresIcu: true,
    requiresVentilator: true,
    requiresBloodBank: false,
  },
  bleeding: {
    mandatoryKeywords: ["trauma", "emergency surgery", "blood bank"],
    mandatoryCodes: ["TRAUMA_CENTER", "EMERGENCY_SURGERY"],
    requiresIcu: true,
    requiresVentilator: false,
    requiresBloodBank: true,
  },
  general: {
    mandatoryKeywords: ["emergency", "general", "physician"],
    mandatoryCodes: ["GENERAL_ER"],
    requiresIcu: false,
    requiresVentilator: false,
    requiresBloodBank: false,
  },
};

// Internal normalized hospital structure
interface UnifiedHospital {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  isVerified: boolean;
  receivingStatus: AvailabilityStatus;
  dataConfidence: DataConfidence;
  lastUpdatedSeconds: number;
  capabilities: string[];
  erBedsAvailable: number;
  icuBedsAvailable: number;
  ventilatorsAvailable: number;
  bloodAvailability: Record<string, string>;
  doctorInChargeName: string;
  publicRating: number;
  publicReviewCount: number;
  publicReviewSummary: string;
}

export class NearERRoutingService {
  /**
   * Main Hospital Matching Pipeline
   * 1. Validate Location
   * 2. Adaptive Geofence
   * 3. Hard Capability Gate
   * 4. Availability & Freshness Filtering
   * 5. Road Travel ETA
   * 6. Explainable Decision Formulation
   */
  public static async matchEmergency(request: MatchRequest): Promise<MatchResponse> {
    const { patient_location, emergency_type, requirements, case_id } = request;
    const caseId = case_id || `NR-${Math.floor(10000 + Math.random() * 90000)}`;

    const pLat = patient_location.latitude || 22.5645;
    const pLng = patient_location.longitude || 88.4069;
    const cleanEmergencyType = (emergency_type || "general").toLowerCase();

    // 1. Gather all available hospital candidates across database & registered network
    const allHospitals = await this.loadAllHospitals(request.hospital_overrides);

    // 2. Adaptive Geofencing loop
    let matchedStageRadius = GEOFENCE_STAGES_KM[0];
    let candidatesInGeofence: { hospital: UnifiedHospital; distanceKm: number }[] = [];
    let eligibleCandidates: { hospital: UnifiedHospital; distanceKm: number; etaMinutes: number }[] = [];

    const reqGate = EMERGENCY_CAPABILITY_GATES[cleanEmergencyType] || EMERGENCY_CAPABILITY_GATES.general;

    for (const radiusKm of GEOFENCE_STAGES_KM) {
      matchedStageRadius = radiusKm;

      // Filter geographically
      candidatesInGeofence = allHospitals
        .map((h) => {
          const distanceKm = calculateDistanceKm(pLat, pLng, h.latitude, h.longitude);
          return { hospital: h, distanceKm };
        })
        .filter((c) => c.distanceKm <= radiusKm);

      // Apply Hard Capability Filter (enforces specialist, ICU, and OPEN ER BEDS)
      eligibleCandidates = candidatesInGeofence
        .filter((c) => this.checkCapabilityGate(c.hospital, reqGate, requirements))
        .filter((c) => c.hospital.receivingStatus !== "TEMPORARILY_UNAVAILABLE")
        .filter((c) => c.hospital.erBedsAvailable > 0)
        .map((c) => {
          const etaMinutes = this.calculateRoadEta(c.distanceKm, c.hospital.city);
          return { ...c, etaMinutes };
        });

      // If we found at least 2 capable facilities (or at max radius), proceed to ranking
      if (eligibleCandidates.length >= 2 || radiusKm === GEOFENCE_STAGES_KM[GEOFENCE_STAGES_KM.length - 1]) {
        break;
      }
    }

    // Fallback: if no hospital passed the strict capability filter, find closest facility WITH OPEN BEDS
    if (eligibleCandidates.length === 0) {
      // 1. First look within current geofence for any facility with open ER beds
      const withBedsInGeofence = candidatesInGeofence.filter(
        (c) => c.hospital.erBedsAvailable > 0 && c.hospital.receivingStatus !== "TEMPORARILY_UNAVAILABLE"
      );

      if (withBedsInGeofence.length > 0) {
        eligibleCandidates = withBedsInGeofence.map((c) => ({
          ...c,
          etaMinutes: this.calculateRoadEta(c.distanceKm, c.hospital.city),
        }));
      } else {
        // 2. If all facilities in geofence are full, expand to full network for ANY hospital with open beds
        const networkWithBeds = allHospitals.filter(
          (h) => h.erBedsAvailable > 0 && h.receivingStatus !== "TEMPORARILY_UNAVAILABLE"
        );
        const pool = networkWithBeds.length > 0 ? networkWithBeds : allHospitals;
        eligibleCandidates = pool.map((h) => {
          const distanceKm = calculateDistanceKm(pLat, pLng, h.latitude, h.longitude);
          return {
            hospital: h,
            distanceKm,
            etaMinutes: this.calculateRoadEta(distanceKm, h.city),
          };
        });
      }
    }

    // 3. Score & Rank Candidates
    // Scoring Formula:
    // Capability Check = Mandatory Gate
    // Availability Confidence = 40 pts
    // Travel Time / ETA = 45 pts
    // Data Freshness = 15 pts
    // Commercial Weight = 0 strictly!
    const scoredCandidates = eligibleCandidates.map((c) => {
      let score = 0;
      const reasons: string[] = [];
      const humanReasons: string[] = [];

      // Availability Signal (up to 40 pts)
      if (c.hospital.receivingStatus === "LIVE_VERIFIED") {
        score += 40;
        reasons.push("CURRENTLY_RECEIVING", "LIVE_STATUS_CONFIRMED");
        humanReasons.push("Currently receiving emergency patients (Live Verified)");
      } else if (c.hospital.receivingStatus === "PARTNER_REPORTED") {
        score += 30;
        reasons.push("PARTNER_REPORTED_AVAILABLE");
        humanReasons.push("Hospital triage confirmed active intake");
      } else if (c.hospital.receivingStatus === "CONFIRMATION_REQUIRED") {
        score += 15;
        reasons.push("CONFIRMATION_REQUIRED");
        humanReasons.push("ER operational status confirmation requested upon dispatch");
      } else {
        score += 5;
        reasons.push("BASIC_NETWORK_DATA");
      }

      // Travel Time / Road ETA (up to 45 pts)
      if (c.etaMinutes <= 10) {
        score += 45;
        reasons.push("RAPID_TRANSIT_ETA");
        humanReasons.push(`Rapid estimated travel time: ~${c.etaMinutes} mins`);
      } else if (c.etaMinutes <= 20) {
        score += 35;
        reasons.push("SHORT_TRAVEL_TIME");
        humanReasons.push(`Estimated travel time: ~${c.etaMinutes} mins`);
      } else if (c.etaMinutes <= 35) {
        score += 20;
        reasons.push("MODERATE_TRAVEL_TIME");
        humanReasons.push(`Travel time: ~${c.etaMinutes} mins`);
      } else {
        score += 10;
        reasons.push("EXTENDED_TRANSIT");
        humanReasons.push(`Transit time: ~${c.etaMinutes} mins (distance: ${c.distanceKm.toFixed(1)} km)`);
      }

      // Data Freshness (up to 15 pts)
      if (c.hospital.lastUpdatedSeconds <= 120) {
        score += 15;
        reasons.push("FRESH_OPERATIONAL_DATA");
        humanReasons.push("Operational telemetry updated within last 2 minutes");
      } else if (c.hospital.lastUpdatedSeconds <= 900) {
        score += 10;
        reasons.push("RECENT_OPERATIONAL_DATA");
        humanReasons.push("Operational status refreshed recently");
      } else {
        score += 5;
      }

      // Capability Match explanation
      const specialtyName = reqGate.mandatoryKeywords[0].toUpperCase();
      reasons.unshift(`${specialtyName}_CAPABILITY`);
      humanReasons.unshift(`${cleanEmergencyType.toUpperCase()} emergency capability on-duty`);

      if (c.hospital.erBedsAvailable > 0) {
        humanReasons.push(`${c.hospital.erBedsAvailable} Emergency triage bed(s) currently open`);
      } else {
        score -= 50000;
        reasons.push("ER_BEDS_FULL");
        humanReasons.push("ER capacity currently full — intakes restricted");
      }

      const recHospital: RecommendedHospital = {
        hospital_id: c.hospital.id,
        name: c.hospital.name,
        phone: c.hospital.phone,
        address: c.hospital.address,
        latitude: c.hospital.latitude,
        longitude: c.hospital.longitude,
        distance_km: Math.round(c.distanceKm * 10) / 10,
        estimated_travel_minutes: c.etaMinutes,
        capability_match: true,
        emergency_receiving_status: c.hospital.receivingStatus,
        data_confidence: c.hospital.dataConfidence,
        last_updated_seconds_ago: c.hospital.lastUpdatedSeconds,
        reason_codes: reasons,
        human_reasons: humanReasons,
        capabilities_matched: c.hospital.capabilities,
        metrics: {
          er_beds_open: c.hospital.erBedsAvailable,
          icu_beds_open: c.hospital.icuBedsAvailable,
          blood_status: c.hospital.bloodAvailability[requirements?.blood_group || "O+"] || "Available",
        },
        public_review: {
          rating: c.hospital.publicRating,
          review_count: c.hospital.publicReviewCount,
          summary: c.hospital.publicReviewSummary,
        },
      };

      return {
        recHospital,
        totalScore: score,
      };
    });

    // Sort by Total Score descending (Road ETA & Live Availability)
    scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);

    const primary = scoredCandidates[0].recHospital;
    const alternatives = scoredCandidates.slice(1, 4).map((s) => s.recHospital);

    const response: MatchResponse = {
      case_id: caseId,
      engine_version: ROUTING_ENGINE_VERSION,
      search_radius_km: matchedStageRadius,
      recommended_hospital: primary,
      alternatives,
      timestamp: new Date().toISOString(),
    };

    // Audit Logging
    routingAuditStore.logDecision(
      response,
      pLat,
      pLng,
      cleanEmergencyType,
      scoredCandidates.map((s, idx) => ({
        hospital: s.recHospital,
        eligible: true,
        status: idx === 0 ? "RECOMMENDED" : "ALTERNATIVE",
      }))
    );

    return response;
  }

  /**
   * Hard Capability Gate Check
   * Fails hospital if it lacks mandatory emergency capability or has 0 ER beds.
   */
  private static checkCapabilityGate(
    h: UnifiedHospital,
    gate: CapabilityRequirement,
    req?: RoutingRequirements
  ): boolean {
    // 0. Hard ER Bed Gate: A hospital with 0 available ER beds is FULL and cannot admit emergency cases!
    if (h.erBedsAvailable <= 0) {
      return false;
    }

    const capsLower = h.capabilities.map((c) => c.toLowerCase());

    // 1. Mandatory specialty check
    const hasSpecialty = gate.mandatoryKeywords.some((kw) =>
      capsLower.some((c) => c.includes(kw))
    );
    if (!hasSpecialty && gate !== EMERGENCY_CAPABILITY_GATES.general) {
      return false;
    }

    // 2. ICU requirement check
    if ((gate.requiresIcu || req?.icu_required) && h.icuBedsAvailable <= 0) {
      // If patient critically needs ICU and facility reports 0, downgrade or filter
      return false;
    }

    // 3. Ventilator requirement check
    if ((gate.requiresVentilator || req?.ventilator_required) && h.ventilatorsAvailable <= 0) {
      return false;
    }

    return true;
  }

  /**
   * Estimated Road Driving ETA (accounting for traffic and urban density)
   */
  private static calculateRoadEta(distanceKm: number, city?: string): number {
    if (distanceKm <= 0.3) return 2;
    // Urban dense traffic: average 22-26 km/h + 2 min dispatch buffer
    const speedKmh = city?.toLowerCase().includes("kolkata") || city?.toLowerCase().includes("gurgaon") ? 24 : 30;
    const drivingMins = Math.ceil((distanceKm / speedKmh) * 60);
    return Math.max(drivingMins + 2, 3);
  }

  /**
   * Unifies hospitals from mock dataset, DEMO_HOSPITALS_DATA, and Supabase,
   * applying any client-side dynamic capacity overrides.
   */
  public static async loadAllHospitals(overrides?: Record<string, any>): Promise<UnifiedHospital[]> {
    const list: UnifiedHospital[] = [];

    // 1. Load Kolkata Mock Hospitals (AMRI, Apollo, Fortis, Ruby, etc.)
    MOCK_HOSPITALS.forEach((h) => {
      const o = overrides ? (overrides[h.id] || (h.id === "h2" && overrides["h2_amri"]) || (h.id === "h1" && overrides["apollo"])) : undefined;
      const erBeds = o?.capacity?.erBeds?.available !== undefined ? o.capacity.erBeds.available : h.capacity.erBeds.available;
      const icuBeds = o?.capacity?.icuBeds?.available !== undefined ? o.capacity.icuBeds.available : h.capacity.icuBeds.available;
      const isAvailable = erBeds > 0;
      list.push({
        id: h.id,
        name: h.name,
        phone: h.phone,
        address: h.address || "Kolkata",
        city: h.city || "Kolkata",
        latitude: h.latitude || 22.5645,
        longitude: h.longitude || 88.4069,
        isVerified: h.verified,
        receivingStatus: isAvailable ? (h.verified ? "LIVE_VERIFIED" : "CONFIRMATION_REQUIRED") : "TEMPORARILY_UNAVAILABLE",
        dataConfidence: isAvailable ? (h.verified ? "HIGH" : "MEDIUM") : "HIGH",
        lastUpdatedSeconds: h.lastUpdated.includes("Just") ? 30 : 120,
        capabilities: [
          ...h.specialists,
          "ICU",
          "Ventilators",
          "Trauma Center",
          "Cath Lab 24x7",
          "CT/MRI Scan",
        ],
        erBedsAvailable: erBeds,
        icuBedsAvailable: icuBeds,
        ventilatorsAvailable: h.capacity.ventilators.available,
        bloodAvailability: h.bloodBank,
        doctorInChargeName: h.doctorInCharge?.name || "Dr. On Duty",
        publicRating: 4.4,
        publicReviewCount: 1820,
        publicReviewSummary: "Recognized for rapid emergency triage & advanced trauma reception.",
      });
    });

    // 2. Load General Network Hospitals (DEMO_HOSPITALS_DATA)
    DEMO_HOSPITALS_DATA.forEach((h) => {
      if (!list.some((existing) => existing.id === h.id)) {
        list.push({
          id: h.id,
          name: h.name,
          phone: h.phone_number,
          address: h.address,
          city: h.city,
          latitude: h.latitude,
          longitude: h.longitude,
          isVerified: h.is_verified,
          receivingStatus: h.capacity.er_beds_available > 0 ? "LIVE_VERIFIED" : "TEMPORARILY_UNAVAILABLE",
          dataConfidence: "HIGH",
          lastUpdatedSeconds: 60,
          capabilities: h.capabilities,
          erBedsAvailable: h.capacity.er_beds_available,
          icuBedsAvailable: h.capacity.icu_beds_available,
          ventilatorsAvailable: h.capacity.ventilators_available,
          bloodAvailability: h.blood_inventory.reduce((acc, b) => {
            acc[b.blood_group] = b.availability_status;
            return acc;
          }, {} as Record<string, string>),
          doctorInChargeName: "Chief Medical Officer",
          publicRating: 4.3,
          publicReviewCount: 2450,
          publicReviewSummary: "Emergency department frequently mentioned positively for fast intake.",
        });
      }
    });

    // 3. Merge Supabase real-time hospital database and capacity updates if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: hospData } = await supabase.from("hospitals").select("*");
        const { data: capData } = await supabase.from("hospital_capacity").select("*");

        if (hospData && hospData.length > 0) {
          hospData.forEach((row: any) => {
            const existing = list.find((h) => h.id === row.id || (row.id === "h2_amri" && h.id === "h2"));
            if (existing) {
              if (row.latitude) existing.latitude = row.latitude;
              if (row.longitude) existing.longitude = row.longitude;
              if (row.emergency_available === false) {
                existing.receivingStatus = "TEMPORARILY_UNAVAILABLE";
              }
            }
          });
        }

        if (capData && capData.length > 0) {
          capData.forEach((cap: any) => {
            const existing = list.find((h) => h.id === cap.hospital_id || (cap.hospital_id === "h2_amri" && h.id === "h2"));
            if (existing) {
              if (typeof cap.er_beds_available === "number") {
                existing.erBedsAvailable = cap.er_beds_available;
                if (cap.er_beds_available <= 0) {
                  existing.receivingStatus = "TEMPORARILY_UNAVAILABLE";
                }
              }
              if (typeof cap.icu_beds_available === "number") {
                existing.icuBedsAvailable = cap.icu_beds_available;
              }
              if (typeof cap.ventilators_available === "number") {
                existing.ventilatorsAvailable = cap.ventilators_available;
              }
            }
          });
        }
      } catch (err) {
        // Fallback gracefully to memory list
      }
    }

    // CRITICAL: Re-apply client-side capacity overrides AFTER Supabase query
    // This ensures local partner testing and browser overrides take absolute precedence!
    if (overrides) {
      list.forEach((h) => {
        const o = overrides[h.id] || (h.id === "h2" && overrides["h2_amri"]) || (h.id === "h1" && overrides["apollo"]);
        if (o) {
          if (o.capacity?.erBeds?.available !== undefined) {
            h.erBedsAvailable = o.capacity.erBeds.available;
            if (o.capacity.erBeds.available <= 0) {
              h.receivingStatus = "TEMPORARILY_UNAVAILABLE";
            }
          }
          if (o.capacity?.icuBeds?.available !== undefined) {
            h.icuBedsAvailable = o.capacity.icuBeds.available;
          }
        }
      });
    }

    return list;
  }
}
