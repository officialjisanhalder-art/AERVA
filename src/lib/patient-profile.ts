import { supabase, isSupabaseConfigured } from "./supabase/client";

export interface AllergyItem {
  id: string;
  name: string;
  category: "Drug" | "Food" | "Environmental" | "Other";
  severity: "Mild" | "Moderate" | "Severe / Anaphylaxis";
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedFor: string;
}

export interface PrescriptionDoc {
  id: string;
  title: string;
  doctorName: string;
  date: string;
  fileType: "image" | "pdf";
  category?: "Prescription" | "Lab Report" | "Discharge Summary" | "Vaccine Record" | "Other";
  notes?: string;
  fileDataUrl?: string;
  fileName?: string;
  fileSize?: string;
}

export interface PatientProfile {
  healthId: string;
  fullName: string;
  phone: string;
  email: string;
  age: string;
  gender: string;
  bloodGroup: string;
  address: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  allergies: AllergyItem[];
  chronicConditions: string[];
  medications: MedicationItem[];
  prescriptions: PrescriptionDoc[];
  organDonor: boolean;
  autoShareInEmergency: boolean;
  lastUpdated: string;
}

export const DEFAULT_PATIENT_PROFILE: PatientProfile = {
  healthId: "HID-9842-108",
  fullName: "Jisan Halder",
  phone: "+91 98765 43210",
  email: "jisan.halder@example.com",
  age: "28",
  gender: "Male",
  bloodGroup: "O+",
  address: "Block AE, Sector 1, Salt Lake, Kolkata, West Bengal - 700064",
  emergencyContactName: "Subhash Halder",
  emergencyContactRelation: "Brother / Emergency Kin",
  emergencyContactPhone: "+91 98301 23456",
  allergies: [
    { id: "a1", name: "Penicillin (Antibiotics)", category: "Drug", severity: "Severe / Anaphylaxis" },
    { id: "a2", name: "Sulfa Drugs", category: "Drug", severity: "Moderate" },
    { id: "a3", name: "Peanuts", category: "Food", severity: "Mild" },
  ],
  chronicConditions: [
    "Mild Bronchial Asthma",
    "Seasonal Rhinitis",
  ],
  medications: [
    { id: "m1", name: "Montelukast", dosage: "10mg", frequency: "Once daily at night", prescribedFor: "Asthma Prevention" },
    { id: "m2", name: "Levocetirizine", dosage: "5mg", frequency: "As needed", prescribedFor: "Allergies" },
  ],
  prescriptions: [
    {
      id: "p1",
      title: "Respiratory Care & Inhaler Protocol",
      doctorName: "Dr. Arvind Ray, Pulmonology",
      date: "14 Aug 2026",
      fileType: "pdf",
      category: "Prescription",
      fileName: "asthma_protocol_2026.pdf",
      fileSize: "412 KB",
      notes: "Continue maintenance dose, monitor peak flow during seasonal changes."
    },
    {
      id: "p2",
      title: "Annual Preventive Health Summary",
      doctorName: "Dr. Meenakshi Sen, Internal Medicine",
      date: "02 Feb 2026",
      fileType: "image",
      category: "Lab Report",
      fileName: "health_checkup_summary.png",
      fileSize: "1.2 MB",
      notes: "Blood pressure normal (118/76). ECG clear. Routine metabolic panel clean."
    }
  ],
  organDonor: true,
  autoShareInEmergency: true,
  lastUpdated: "Just now"
};

const PROFILE_KEY = "aerva_patient_profile";

export function getStoredPatientProfile(): PatientProfile {
  if (typeof window === "undefined") return DEFAULT_PATIENT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PATIENT_PROFILE));
      return DEFAULT_PATIENT_PROFILE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PATIENT_PROFILE;
  }
}

export function savePatientProfile(profile: PatientProfile): void {
  if (typeof window === "undefined") return;
  try {
    const updated = { ...profile, lastUpdated: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("aerva_profile_updated"));
    window.dispatchEvent(new Event("storage"));

    if (isSupabaseConfigured && supabase) {
      Promise.resolve(
        supabase.from("emergency_profiles").upsert({
          user_id: profile.healthId,
          blood_group: profile.bloodGroup,
          known_allergies: profile.allergies,
          medical_conditions: profile.chronicConditions,
          current_medications: profile.medications,
          emergency_notes: profile.emergencyContactName ? `Kin: ${profile.emergencyContactName} (${profile.emergencyContactPhone})` : "",
          profile_completion_percentage: calculateProfileCompleteness(profile).percentage,
          updated_at: new Date().toISOString()
        })
      ).catch((e: any) => console.warn("Supabase profile sync error:", e));
    }
  } catch (err) {
    console.error("Failed to save patient profile:", err);
  }
}

export function calculateProfileCompleteness(profile: PatientProfile): {
  percentage: number;
  completedCount: number;
  totalCount: number;
  missingFields: string[];
} {
  let score = 0;
  const missing: string[] = [];

  if (profile.fullName && profile.fullName.trim().length > 0) score += 15;
  else missing.push("Full Name");

  if (profile.bloodGroup && profile.bloodGroup !== "Unknown") score += 20;
  else missing.push("Blood Group");

  if (profile.phone && profile.phone.trim().length > 0) score += 15;
  else missing.push("Phone Number");

  if (profile.emergencyContactPhone && profile.emergencyContactPhone.trim().length > 0) score += 15;
  else missing.push("Emergency Kin Contact");

  if (profile.allergies && profile.allergies.length > 0) score += 15;
  else missing.push("Allergies List");

  if (profile.medications && profile.medications.length > 0) score += 10;
  else missing.push("Current Medications");

  if (profile.prescriptions && profile.prescriptions.length > 0) score += 10;
  else missing.push("Prescription Documents");

  return {
    percentage: Math.min(score, 100),
    completedCount: Math.round(score / 10),
    totalCount: 10,
    missingFields: missing,
  };
}

export function generateEmergencyQrPayload(profile: PatientProfile): string {
  return JSON.stringify({
    app: "AERVA_Passport",
    hid: profile.healthId,
    name: profile.fullName,
    bg: profile.bloodGroup,
    age: profile.age,
    gender: profile.gender,
    kin: `${profile.emergencyContactName} (${profile.emergencyContactPhone})`,
    allergies: profile.allergies.map(a => `${a.name} [${a.severity}]`),
    meds: profile.medications.map(m => `${m.name} ${m.dosage}`),
    donor: profile.organDonor ? "YES" : "NO",
  });
}