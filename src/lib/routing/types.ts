/**
 * AERVA ROUTING ENGINE — TYPES & DATA MODEL
 * Version: Hackathon MVP -> Production-Ready Architecture
 */

export type EmergencyCategory =
  | "CARDIAC"
  | "STROKE"
  | "TRAUMA"
  | "BURNS"
  | "RESPIRATORY"
  | "BLEEDING"
  | "NEUROLOGY"
  | "GENERAL";

export type CapabilityCode =
  | "CARDIAC_EMERGENCY"
  | "STROKE_UNIT"
  | "TRAUMA_CENTER"
  | "BURN_CARE"
  | "ICU"
  | "VENTILATOR"
  | "EMERGENCY_SURGERY"
  | "CATH_LAB_24X7"
  | "CT_MRI_SCAN"
  | "PEDIATRIC_ER"
  | "GENERAL_ER";

export type AvailabilityStatus =
  | "LIVE_VERIFIED"
  | "PARTNER_REPORTED"
  | "CONFIRMATION_REQUIRED"
  | "UNKNOWN"
  | "TEMPORARILY_UNAVAILABLE";

export type DataConfidence = "HIGH" | "MEDIUM" | "BASIC";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  area?: string;
  city?: string;
}

export interface RoutingRequirements {
  icu_required?: boolean;
  ventilator_required?: boolean;
  blood_group?: string | null;
  min_er_beds?: number;
}

export interface MatchRequest {
  case_id?: string;
  patient_location: GeoLocation;
  emergency_type: string;
  requirements?: RoutingRequirements;
  max_search_radius_km?: number;
  hospital_overrides?: Record<string, any>;
}

export interface ExplainableReasonCode {
  code: string;
  label: string;
  type: "positive" | "warning" | "neutral";
}

export interface RecommendedHospital {
  hospital_id: string;
  name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  estimated_travel_minutes: number;
  capability_match: boolean;
  emergency_receiving_status: AvailabilityStatus;
  data_confidence: DataConfidence;
  last_updated_seconds_ago: number;
  reason_codes: string[];
  human_reasons: string[];
  capabilities_matched: string[];
  is_verified?: boolean;
  verification_status?: string;
  source?: string;
  metrics: {
    er_beds_open: number | null;
    icu_beds_open: number | null;
    blood_status: string;
  };
  public_review?: {
    rating: number;
    review_count: number;
    summary: string;
  };
}

export interface MatchResponse {
  case_id: string;
  engine_version: string;
  search_radius_km: number;
  recommended_hospital: RecommendedHospital;
  alternatives: RecommendedHospital[];
  timestamp: string;
}

export interface RecheckRequest {
  case_id: string;
  current_hospital_id: string;
  patient_location: GeoLocation;
  emergency_type: string;
  requirements?: RoutingRequirements;
  hospital_overrides?: Record<string, any>;
}

export type RerouteType = "MANDATORY" | "OPTIONAL" | "NONE";

export interface RecheckResponse {
  case_id: string;
  reroute_recommended: boolean;
  reroute_type: RerouteType;
  current_destination: {
    hospital_id: string;
    name: string;
    eta_minutes: number;
    status: AvailabilityStatus;
  };
  better_destination?: {
    hospital_id: string;
    name: string;
    latitude: number;
    longitude: number;
    eta_minutes: number;
    status: AvailabilityStatus;
    distance_km: number;
    time_saved_minutes: number;
    reason_codes: string[];
    human_reasons: string[];
  };
  evaluation_reason: string;
  timestamp: string;
}

export interface RerouteRequest {
  case_id: string;
  old_hospital_id: string;
  new_hospital_id: string;
  reason: string;
  patient_location?: GeoLocation;
}

export interface RerouteResponse {
  success: boolean;
  case_id: string;
  updated_hospital_id: string;
  updated_hospital_name: string;
  new_coordinates: {
    latitude: number;
    longitude: number;
  };
  google_maps_url: string;
  event_logged: boolean;
  timestamp: string;
}

export interface RouteChangeEvent {
  id: string;
  case_id: string;
  old_hospital_id: string;
  new_hospital_id: string;
  old_eta: number;
  new_eta: number;
  trigger_type: RerouteType;
  reason: string;
  created_at: string;
  confirmed_at: string;
}
