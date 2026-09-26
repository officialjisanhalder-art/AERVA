import { supabase, isSupabaseConfigured } from "../supabase/client";

export interface EmergencyProfileData {
  userId?: string;
  fullName: string;
  mobile: string;
  bloodGroup: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  knownAllergies: { id: string; name: string; severity: string; type: string }[];
  medicalConditions: string[];
  currentMedications: { name: string; dosage: string; frequency: string; condition: string }[];
  emergencyNotes: string;
  emergencyKinName?: string;
  emergencyKinPhone?: string;
  emergencyKinRelation?: string;
  profileCompletionPercentage: number;
}

const LOCAL_PROFILE_KEY = "nearer_patient_passport_profile";

// Calculate completeness % strictly based on optional filled fields
export function calculateProfileCompleteness(profile: Partial<EmergencyProfileData>): number {
  let score = 0;
  if (profile.fullName && profile.fullName.trim().length > 0) score += 15;
  if (profile.bloodGroup && profile.bloodGroup.trim().length > 0) score += 15;
  if (profile.mobile && profile.mobile.trim().length > 0) score += 10;
  if (profile.knownAllergies && profile.knownAllergies.length > 0) score += 20;
  if (profile.medicalConditions && profile.medicalConditions.length > 0) score += 15;
  if (profile.currentMedications && profile.currentMedications.length > 0) score += 15;
  if (profile.emergencyKinPhone && profile.emergencyKinPhone.trim().length > 0) score += 10;
  return Math.min(score, 100);
}

export const patientService = {
  // Get emergency profile
  async getEmergencyProfile(userId?: string): Promise<EmergencyProfileData> {
    const defaultData: EmergencyProfileData = {
      fullName: "Rahul Verma",
      mobile: "+91 98765 43210",
      bloodGroup: "O+",
      dateOfBirth: "1996-05-14",
      gender: "Male",
      address: "Tower 4, DLF Phase 5, Gurgaon",
      knownAllergies: [
        { id: "1", name: "Penicillin", severity: "Severe (Anaphylaxis)", type: "Drug" },
        { id: "2", name: "Peanuts", severity: "Moderate", type: "Food" },
      ],
      medicalConditions: ["Asthma (Mild)", "Hypertension (Controlled)"],
      currentMedications: [
        { name: "Montelukast", dosage: "10mg", frequency: "Once daily (Night)", condition: "Asthma" },
        { name: "Telmisartan", dosage: "40mg", frequency: "Once daily (Morning)", condition: "Blood Pressure" },
      ],
      emergencyNotes: "Carry Ventolin Inhaler in bag. Penicillin allergy.",
      emergencyKinName: "Pooja Verma",
      emergencyKinPhone: "+91 98765 12345",
      emergencyKinRelation: "Spouse",
      profileCompletionPercentage: 85,
    };

    if (isSupabaseConfigured && supabase && userId) {
      try {
        const { data, error } = await supabase
          .from("emergency_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (!error && data) {
          return {
            userId: data.user_id,
            fullName: defaultData.fullName,
            mobile: defaultData.mobile,
            bloodGroup: data.blood_group || "O+",
            knownAllergies: data.known_allergies || [],
            medicalConditions: data.medical_conditions || [],
            currentMedications: data.current_medications || [],
            emergencyNotes: data.emergency_notes || "",
            profileCompletionPercentage: data.profile_completion_percentage || 80,
          };
        }
      } catch (e) {
        console.warn("Error reading emergency profile from Supabase:", e);
      }
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }

    return defaultData;
  },

  // Save emergency profile
  async saveEmergencyProfile(profile: EmergencyProfileData): Promise<void> {
    const percentage = calculateProfileCompleteness(profile);
    const updated = { ...profile, profileCompletionPercentage: percentage };

    if (isSupabaseConfigured && supabase && profile.userId) {
      try {
        await supabase.from("emergency_profiles").upsert({
          user_id: profile.userId,
          blood_group: updated.bloodGroup,
          known_allergies: updated.knownAllergies,
          medical_conditions: updated.medicalConditions,
          current_medications: updated.currentMedications,
          emergency_notes: updated.emergencyNotes,
          profile_completion_percentage: percentage,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Error updating Supabase emergency profile:", e);
      }
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
    }
  },
};
