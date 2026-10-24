import { supabase, isSupabaseConfigured } from "../supabase/client";

export type EmergencyStatus =
  | "DRAFT"
  | "ANALYSING"
  | "BEST_MATCH_FOUND"
  | "REQUEST_SENT"
  | "HOSPITAL_REVIEWING"
  | "REQUEST_VERIFIED"
  | "HOSPITAL_ACCEPTED"
  | "CAPACITY_RESERVED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "COMPLETED"
  | "CANCELLED";

export interface EmergencyCase {
  id?: string;
  caseId: string; // e.g. NR-10482
  userId?: string;
  patientName: string;
  patientMobile: string;
  numberOfPatients: number;
  emergencyType: string;
  description?: string;
  originLatitude: number;
  originLongitude: number;
  originText?: string;
  selectedHospitalId: string;
  status: EmergencyStatus;
  hasVoiceBrief?: boolean;
  voiceAudioUrl?: string;
  voiceDuration?: number;
  voiceTranscript?: string;
  createdAt: string;
  submittedAt?: string;
  completedAt?: string;
}

const LOCAL_ACTIVE_CASE_KEY = "aerva_active_emergency_case";

export function generateCaseId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `NR-${num}`;
}

export const emergencyService = {
  // Create or submit an emergency case
  async createEmergencyCase(data: Partial<EmergencyCase>): Promise<EmergencyCase> {
    const caseId = data.caseId || generateCaseId();
    const emergencyCase: EmergencyCase = {
      caseId,
      userId: data.userId,
      patientName: data.patientName || "Guest Patient",
      patientMobile: data.patientMobile || "+91 98765 43210",
      numberOfPatients: data.numberOfPatients || 1,
      emergencyType: data.emergencyType || "cardiac",
      description: data.description || "",
      originLatitude: data.originLatitude || 28.4595,
      originLongitude: data.originLongitude || 77.0724,
      originText: data.originText || "Sector 44, Gurgaon",
      selectedHospitalId: data.selectedHospitalId || "apollo",
      status: data.status || "REQUEST_SENT",
      hasVoiceBrief: data.hasVoiceBrief,
      voiceAudioUrl: data.voiceAudioUrl,
      voiceDuration: data.voiceDuration,
      voiceTranscript: data.voiceTranscript,
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: insertedCase, error } = await supabase
          .from("emergency_requests")
          .insert({
            case_id: emergencyCase.caseId,
            user_id: emergencyCase.userId,
            patient_name: emergencyCase.patientName,
            patient_mobile: emergencyCase.patientMobile,
            number_of_patients: emergencyCase.numberOfPatients,
            emergency_type: emergencyCase.emergencyType,
            description: emergencyCase.description,
            origin_latitude: emergencyCase.originLatitude,
            origin_longitude: emergencyCase.originLongitude,
            origin_text: emergencyCase.originText,
            selected_hospital_id: emergencyCase.selectedHospitalId,
            status: emergencyCase.status,
            submitted_at: emergencyCase.submittedAt,
          })
          .select()
          .single();

        if (!error && insertedCase) {
          emergencyCase.id = insertedCase.id;

          // Log timeline event
          await supabase.from("emergency_case_events").insert({
            emergency_request_id: insertedCase.id,
            event_type: "REQUEST_SENT",
            event_description: `Emergency request initiated for ${emergencyCase.emergencyType}`,
          });

          // Insert voice note if present
          if (emergencyCase.hasVoiceBrief && emergencyCase.voiceAudioUrl) {
            await supabase.from("emergency_voice_notes").insert({
              emergency_request_id: insertedCase.id,
              file_path: emergencyCase.voiceAudioUrl,
              duration_seconds: emergencyCase.voiceDuration || 5,
              transcript: emergencyCase.voiceTranscript || "Voice brief recorded",
            });
          }
        }
      } catch (e) {
        console.warn("Supabase case creation error, using local persistence:", e);
      }
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_ACTIVE_CASE_KEY, JSON.stringify(emergencyCase));
    }

    return emergencyCase;
  },

  // Get currently active case
  async getActiveCase(): Promise<EmergencyCase | null> {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_ACTIVE_CASE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.status !== "COMPLETED" && parsed.status !== "CANCELLED") {
            return parsed;
          }
        } catch {}
      }
    }
    return null;
  },

  // Update status (e.g. EN_ROUTE, ARRIVED, COMPLETED)
  async updateCaseStatus(caseId: string, status: EmergencyStatus): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("emergency_requests")
          .update({
            status,
            updated_at: new Date().toISOString(),
            ...(status === "COMPLETED" ? { completed_at: new Date().toISOString() } : {}),
          })
          .eq("case_id", caseId);

        // Also add audit event
        const { data: c } = await supabase
          .from("emergency_requests")
          .select("id")
          .eq("case_id", caseId)
          .single();

        if (c) {
          await supabase.from("emergency_case_events").insert({
            emergency_request_id: c.id,
            event_type: status,
            event_description: `Status changed to ${status}`,
          });
        }
      } catch (e) {
        console.warn("Supabase status update error:", e);
      }
    }

    if (typeof window !== "undefined") {
      const active = await emergencyService.getActiveCase();
      if (active && active.caseId === caseId) {
        active.status = status;
        if (status === "COMPLETED" || status === "CANCELLED") {
          localStorage.removeItem(LOCAL_ACTIVE_CASE_KEY);
        } else {
          localStorage.setItem(LOCAL_ACTIVE_CASE_KEY, JSON.stringify(active));
        }
      }
    }
  },

  // Clear unsubmitted draft
  clearDraft(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_ACTIVE_CASE_KEY);
    }
  },
};
