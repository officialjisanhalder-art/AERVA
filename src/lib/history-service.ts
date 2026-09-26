export interface EmergencyVisitHistory {
  id: string;
  caseId: string;
  timestamp: string;
  hospitalId: string;
  hospitalName: string;
  hospitalAddress: string;
  emergencyType: string;
  doctorInChargeName: string;
  doctorInChargeRole: string;
  originArea: string;
  status: "COMPLETED" | "ADMITTED" | "TRIAGED";
  triageBay: string;
  greenCorridorUsed: boolean;
  etaMinutes: number;
  patientName?: string;
  patientAge?: number | string;
  patientGender?: string;
}

const PATIENT_HISTORY_STORAGE_KEY = "nearer_patient_emergency_history";
const HOSPITAL_ADMISSIONS_STORAGE_KEY = "nearer_hospital_admissions_log";

const INITIAL_PATIENT_HISTORY: EmergencyVisitHistory[] = [
  {
    id: "hist-01",
    caseId: "NR-10398",
    timestamp: "14 Sep 2026, 06:20 PM",
    hospitalId: "h2",
    hospitalName: "AMRI Hospital Salt Lake",
    hospitalAddress: "JC - 16 & 17, Sector III, Salt Lake City, Kolkata",
    emergencyType: "Acute Cardiac Arrhythmia",
    doctorInChargeName: "Dr. Debashis Roy",
    doctorInChargeRole: "Senior Consultant - Emergency Triage",
    originArea: "Salt Lake Sector V, Kolkata",
    status: "ADMITTED",
    triageBay: "Red Bay 01 (Cath-Lab Ready)",
    greenCorridorUsed: true,
    etaMinutes: 9,
  },
  {
    id: "hist-02",
    caseId: "NR-09854",
    timestamp: "18 Jun 2026, 11:30 AM",
    hospitalId: "h1",
    hospitalName: "Apollo Multispeciality Hospitals",
    hospitalAddress: "58 Canal Circular Road, Kadapara, Kolkata",
    emergencyType: "Acute Asthma Exacerbation",
    doctorInChargeName: "Dr. Sandip Sengupta",
    doctorInChargeRole: "Chief Medical Officer & ER Lead",
    originArea: "Salt Lake Sector III, Kolkata",
    status: "COMPLETED",
    triageBay: "Yellow Bay 04 (Observation)",
    greenCorridorUsed: false,
    etaMinutes: 6,
  }
];

export function getPatientHistory(): EmergencyVisitHistory[] {
  if (typeof window === "undefined") return INITIAL_PATIENT_HISTORY;
  try {
    const raw = localStorage.getItem(PATIENT_HISTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PATIENT_HISTORY_STORAGE_KEY, JSON.stringify(INITIAL_PATIENT_HISTORY));
      return INITIAL_PATIENT_HISTORY;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PATIENT_HISTORY;
  }
}

export function addPatientHistory(visit: EmergencyVisitHistory): void {
  if (typeof window === "undefined") return;
  try {
    const current = getPatientHistory();
    const updated = [visit, ...current.filter(v => v.caseId !== visit.caseId)];
    localStorage.setItem(PATIENT_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save patient history:", err);
  }
}

export function getHospitalAdmissions(hospitalId?: string): EmergencyVisitHistory[] {
  if (typeof window === "undefined") return INITIAL_PATIENT_HISTORY;
  try {
    const raw = localStorage.getItem(HOSPITAL_ADMISSIONS_STORAGE_KEY);
    const list: EmergencyVisitHistory[] = raw ? JSON.parse(raw) : INITIAL_PATIENT_HISTORY;
    if (hospitalId) {
      return list.filter(item => item.hospitalId === hospitalId);
    }
    return list;
  } catch {
    return INITIAL_PATIENT_HISTORY;
  }
}

export function addHospitalAdmission(visit: EmergencyVisitHistory): void {
  if (typeof window === "undefined") return;
  try {
    const current = getHospitalAdmissions();
    const updated = [visit, ...current.filter(v => v.caseId !== visit.caseId)];
    localStorage.setItem(HOSPITAL_ADMISSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save hospital admission:", err);
  }
}
