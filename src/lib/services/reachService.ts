import { supabase, isSupabaseConfigured } from "../supabase/client";
import { hospitalService, HospitalRecord } from "./hospitalService";
import { locationService } from "./locationService";

export type RuralSosStatus =
  | "SOS_RECEIVED"
  | "VOICE_CAPTURED"
  | "LOCATION_IDENTIFIED"
  | "MATCHING"
  | "FACILITY_IDENTIFIED"
  | "FACILITY_ALERTED"
  | "ACKNOWLEDGED"
  | "CALLER_CONNECTED"
  | "ESCALATING"
  | "MANUAL_ESCALATION"
  | "COMPLETED";

export interface RuralVoiceRecording {
  id: string;
  recordingType: "LOCATION" | "EMERGENCY";
  filePath: string;
  durationSeconds: number;
  transcript: string;
  createdAt: string;
}

export interface FacilityAlert {
  id: string;
  hospitalId: string;
  hospitalName: string;
  alertOrder: number;
  status: "PENDING" | "ACKNOWLEDGED" | "DECLINED" | "NO_RESPONSE";
  sentAt: string;
  acknowledgedAt?: string;
}

export interface EscalationEvent {
  id: string;
  fromHospitalId: string;
  toHospitalId: string;
  fromHospitalName: string;
  toHospitalName: string;
  reason: string;
  createdAt: string;
}

export interface RuralSosCase {
  id: string;
  caseId: string; // e.g. NR-R-10482
  callerNumber: string;
  language: string;
  reportedLocationText: string;
  resolvedLatitude: number | null;
  resolvedLongitude: number | null;
  locationConfidence: "HIGH" | "MEDIUM" | "NEEDS_CONFIRMATION";
  emergencySummary: string;
  status: RuralSosStatus;
  searchRadiusKm: number; // 5 -> 10 -> 25 -> 50
  selectedFacilityId?: string;
  selectedFacilityName?: string;
  recordings: RuralVoiceRecording[];
  alerts: FacilityAlert[];
  escalations: EscalationEvent[];
  createdAt: string;
  updatedAt: string;
}

const LOCAL_RURAL_CASES_KEY = "aerva_reach_rural_cases";

function generateRuralCaseId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `NR-R-${num}`;
}

const DEFAULT_RURAL_CASES: RuralSosCase[] = [
  {
    id: "r-case-1",
    caseId: "NR-R-90412",
    callerNumber: "+91 94160 88219",
    language: "Hindi (Haryanvi Dialect)",
    reportedLocationText: "Near Government High School, Badshahpur Village",
    resolvedLatitude: 28.3850,
    resolvedLongitude: 77.0540,
    locationConfidence: "HIGH",
    emergencySummary: "Elderly female collapsed with severe chest pressure, unconscious.",
    status: "ACKNOWLEDGED",
    searchRadiusKm: 10,
    selectedFacilityId: "apollo",
    selectedFacilityName: "Apollo City Hospital",
    recordings: [
      {
        id: "rec-1",
        recordingType: "LOCATION",
        filePath: "/sample-prescriptions/location-sample.mp3",
        durationSeconds: 4,
        transcript: "Hum Badshahpur gaon me sarkari school ke paas hain.",
        createdAt: "10 mins ago",
      },
      {
        id: "rec-2",
        recordingType: "EMERGENCY",
        filePath: "/sample-prescriptions/emergency-sample.mp3",
        durationSeconds: 6,
        transcript: "Mataji ko achanak se seene me tej dard hua aur behosh ho gayi hain.",
        createdAt: "10 mins ago",
      },
    ],
    alerts: [
      {
        id: "al-1",
        hospitalId: "apollo",
        hospitalName: "Apollo City Hospital",
        alertOrder: 1,
        status: "ACKNOWLEDGED",
        sentAt: "9 mins ago",
        acknowledgedAt: "8 mins ago",
      },
    ],
    escalations: [],
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60000).toISOString(),
  },
];

export const reachService = {
  // Get all rural SOS cases for relay operator desk
  async getAllCases(): Promise<RuralSosCase[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("rural_sos_cases")
          .select("*, rural_voice_recordings(*), facility_alerts(*), escalation_events(*)")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((c: any) => ({
            id: c.id,
            caseId: c.case_id,
            callerNumber: c.caller_number,
            language: c.language || "Hindi",
            reportedLocationText: c.reported_location_text,
            resolvedLatitude: c.resolved_latitude,
            resolvedLongitude: c.resolved_longitude,
            locationConfidence: c.location_confidence || "HIGH",
            emergencySummary: c.emergency_summary,
            status: c.status,
            searchRadiusKm: 10,
            selectedFacilityId: c.selected_facility_id,
            recordings: (c.rural_voice_recordings || []).map((r: any) => ({
              id: r.id,
              recordingType: r.recording_type,
              filePath: r.file_path,
              durationSeconds: r.duration_seconds,
              transcript: r.transcript,
              createdAt: r.created_at,
            })),
            alerts: (c.facility_alerts || []).map((a: any) => ({
              id: a.id,
              hospitalId: a.hospital_id,
              hospitalName: a.hospital_id,
              alertOrder: a.alert_order,
              status: a.status,
              sentAt: a.sent_at,
              acknowledgedAt: a.acknowledged_at,
            })),
            escalations: (c.escalation_events || []).map((e: any) => ({
              id: e.id,
              fromHospitalId: e.from_hospital_id,
              toHospitalId: e.to_hospital_id,
              fromHospitalName: e.from_hospital_id,
              toHospitalName: e.to_hospital_id,
              reason: e.reason,
              createdAt: e.created_at,
            })),
            createdAt: c.created_at,
            updatedAt: c.updated_at,
          }));
        }
      } catch (e) {
        console.warn("Supabase rural cases fetch error:", e);
      }
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_RURAL_CASES_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }

    return DEFAULT_RURAL_CASES;
  },

  // Simulate Rural SOS initiation (Voice-first Keypad / Basic phone call)
  async createRuralSosCase(params: {
    callerNumber: string;
    language: string;
    reportedLocationText: string;
    emergencySummary: string;
    locationRecordingBlob?: Blob;
    locationAudioUrl?: string;
    locationTranscript?: string;
    emergencyRecordingBlob?: Blob;
    emergencyAudioUrl?: string;
    emergencyTranscript?: string;
  }): Promise<RuralSosCase> {
    const caseId = generateRuralCaseId();

    // Attempt geocoding the spoken landmark/village
    let lat: number | null = 28.4595;
    let lng: number | null = 77.0724;
    let confidence: "HIGH" | "MEDIUM" | "NEEDS_CONFIRMATION" = "HIGH";

    if (params.reportedLocationText) {
      const geocoded = await locationService.forwardGeocode(params.reportedLocationText);
      if (geocoded) {
        lat = geocoded.latitude;
        lng = geocoded.longitude;
        confidence = "HIGH";
      } else {
        confidence = "NEEDS_CONFIRMATION";
      }
    }

    // Adaptive radius hospital match (5km -> 10km -> 25km -> 50km)
    let searchRadiusKm = 10;
    let matchedHospitals = await hospitalService.getNearbyHospitals(lat || 28.4595, lng || 77.0724, 10);
    if (matchedHospitals.length === 0) {
      searchRadiusKm = 25;
      matchedHospitals = await hospitalService.getNearbyHospitals(lat || 28.4595, lng || 77.0724, 25);
    }
    if (matchedHospitals.length === 0) {
      searchRadiusKm = 50;
      matchedHospitals = await hospitalService.getNearbyHospitals(lat || 28.4595, lng || 77.0724, 50);
    }

    const selectedFacility = matchedHospitals[0] || null;

    const recordings: RuralVoiceRecording[] = [];
    if (params.locationAudioUrl) {
      recordings.push({
        id: `rec-loc-${Date.now()}`,
        recordingType: "LOCATION",
        filePath: params.locationAudioUrl,
        durationSeconds: 4,
        transcript: params.locationTranscript || params.reportedLocationText,
        createdAt: "Just now",
      });
    }
    if (params.emergencyAudioUrl) {
      recordings.push({
        id: `rec-emg-${Date.now()}`,
        recordingType: "EMERGENCY",
        filePath: params.emergencyAudioUrl,
        durationSeconds: 5,
        transcript: params.emergencyTranscript || params.emergencySummary,
        createdAt: "Just now",
      });
    }

    const alerts: FacilityAlert[] = selectedFacility
      ? [
          {
            id: `al-${Date.now()}`,
            hospitalId: selectedFacility.id,
            hospitalName: selectedFacility.name,
            alertOrder: 1,
            status: "PENDING",
            sentAt: "Just now",
          },
        ]
      : [];

    const newCase: RuralSosCase = {
      id: `rcase-${Date.now()}`,
      caseId,
      callerNumber: params.callerNumber,
      language: params.language,
      reportedLocationText: params.reportedLocationText,
      resolvedLatitude: lat,
      resolvedLongitude: lng,
      locationConfidence: confidence,
      emergencySummary: params.emergencySummary,
      status: selectedFacility ? "FACILITY_ALERTED" : "MATCHING",
      searchRadiusKm,
      selectedFacilityId: selectedFacility?.id,
      selectedFacilityName: selectedFacility?.name,
      recordings,
      alerts,
      escalations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbCase } = await supabase
          .from("rural_sos_cases")
          .insert({
            case_id: newCase.caseId,
            caller_number: newCase.callerNumber,
            language: newCase.language,
            reported_location_text: newCase.reportedLocationText,
            resolved_latitude: newCase.resolvedLatitude,
            resolved_longitude: newCase.resolvedLongitude,
            location_confidence: newCase.locationConfidence,
            emergency_summary: newCase.emergencySummary,
            status: newCase.status,
            selected_facility_id: newCase.selectedFacilityId,
          })
          .select()
          .single();

        if (dbCase) {
          newCase.id = dbCase.id;

          // Insert recordings
          for (const rec of recordings) {
            await supabase.from("rural_voice_recordings").insert({
              rural_sos_case_id: dbCase.id,
              recording_type: rec.recordingType,
              file_path: rec.filePath,
              duration_seconds: rec.durationSeconds,
              transcript: rec.transcript,
            });
          }

          // Insert initial alert
          if (selectedFacility) {
            await supabase.from("facility_alerts").insert({
              rural_sos_case_id: dbCase.id,
              hospital_id: selectedFacility.id,
              alert_order: 1,
              status: "PENDING",
            });
          }
        }
      } catch (e) {
        console.warn("Error persisting rural case to Supabase:", e);
      }
    }

    if (typeof window !== "undefined") {
      const all = await reachService.getAllCases();
      const updated = [newCase, ...all];
      localStorage.setItem(LOCAL_RURAL_CASES_KEY, JSON.stringify(updated));
    }

    return newCase;
  },

  // Auto-escalate or manually escalate when facility does not respond
  async escalateCase(
    caseId: string,
    reason = "NO_RESPONSE timeout: Facility did not acknowledge within 30s window"
  ): Promise<RuralSosCase | null> {
    const all = await reachService.getAllCases();
    const caseIndex = all.findIndex((c) => c.caseId === caseId);
    if (caseIndex === -1) return null;

    const targetCase = all[caseIndex];
    const oldFacilityName = targetCase.selectedFacilityName || "Previous Facility";
    const oldFacilityId = targetCase.selectedFacilityId || "unknown";

    // Mark current alert as NO_RESPONSE
    if (targetCase.alerts.length > 0) {
      targetCase.alerts[targetCase.alerts.length - 1].status = "NO_RESPONSE";
    }

    // Expand radius or pick next hospital
    const nearby = await hospitalService.getNearbyHospitals(
      targetCase.resolvedLatitude || 28.4595,
      targetCase.resolvedLongitude || 77.0724,
      50
    );

    const nextHospital = nearby.find((h) => h.id !== oldFacilityId) || nearby[0];

    const escalation: EscalationEvent = {
      id: `esc-${Date.now()}`,
      fromHospitalId: oldFacilityId,
      toHospitalId: nextHospital.id,
      fromHospitalName: oldFacilityName,
      toHospitalName: nextHospital.name,
      reason,
      createdAt: "Just now",
    };

    targetCase.selectedFacilityId = nextHospital.id;
    targetCase.selectedFacilityName = nextHospital.name;
    targetCase.status = "ESCALATING";
    targetCase.escalations.push(escalation);
    targetCase.alerts.push({
      id: `al-${Date.now()}`,
      hospitalId: nextHospital.id,
      hospitalName: nextHospital.name,
      alertOrder: targetCase.alerts.length + 1,
      status: "PENDING",
      sentAt: "Just now",
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("rural_sos_cases")
          .update({
            selected_facility_id: nextHospital.id,
            status: "ESCALATING",
            updated_at: new Date().toISOString(),
          })
          .eq("case_id", caseId);

        await supabase.from("escalation_events").insert({
          rural_sos_case_id: targetCase.id,
          from_hospital_id: oldFacilityId,
          to_hospital_id: nextHospital.id,
          reason,
        });
      } catch (e) {
        console.warn("Supabase escalation error:", e);
      }
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_RURAL_CASES_KEY, JSON.stringify(all));
    }

    return targetCase;
  },

  // Facility Acknowledges Alert
  async acknowledgeAlert(caseId: string): Promise<RuralSosCase | null> {
    const all = await reachService.getAllCases();
    const caseIndex = all.findIndex((c) => c.caseId === caseId);
    if (caseIndex === -1) return null;

    const targetCase = all[caseIndex];
    targetCase.status = "ACKNOWLEDGED";
    if (targetCase.alerts.length > 0) {
      targetCase.alerts[targetCase.alerts.length - 1].status = "ACKNOWLEDGED";
      targetCase.alerts[targetCase.alerts.length - 1].acknowledgedAt = "Just now";
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("rural_sos_cases")
          .update({
            status: "ACKNOWLEDGED",
            updated_at: new Date().toISOString(),
          })
          .eq("case_id", caseId);
      } catch (e) {}
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_RURAL_CASES_KEY, JSON.stringify(all));
    }

    return targetCase;
  },

  // Manual Escalation Trigger by Operator
  async triggerManualEscalation(caseId: string, operatorNotes: string): Promise<RuralSosCase | null> {
    return this.escalateCase(caseId, `Manual Operator Escalation: ${operatorNotes}`);
  },

  // Operator Session Management
  getCurrentOperator(): OperatorSession | null {
    if (typeof window === "undefined") return DEMO_OPERATORS[0];
    const stored = localStorage.getItem(OPERATOR_SESSION_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return null;
  },

  loginOperator(operatorId: string): OperatorSession {
    const found = DEMO_OPERATORS.find((op) => op.id === operatorId) || DEMO_OPERATORS[0];
    if (typeof window !== "undefined") {
      localStorage.setItem(OPERATOR_SESSION_KEY, JSON.stringify(found));
    }
    return found;
  },

  logoutOperator(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(OPERATOR_SESSION_KEY);
    }
  },
};

export interface OperatorSession {
  id: string;
  badgeId: string;
  name: string;
  email: string;
  role: string;
  shift: string;
}

export const DEMO_OPERATORS: OperatorSession[] = [
  {
    id: "op-1",
    badgeId: "OP-8821",
    name: "Priya Sharma",
    email: "priya.sharma@aerva-reach.in",
    role: "Lead Relay Dispatcher",
    shift: "Day Command (08:00 - 20:00)",
  },
  {
    id: "op-2",
    badgeId: "OP-4410",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@aerva-reach.in",
    role: "Senior Trauma Coordinator",
    shift: "Night Emergency Watch",
  },
];

const OPERATOR_SESSION_KEY = "aerva_relay_operator_session";

