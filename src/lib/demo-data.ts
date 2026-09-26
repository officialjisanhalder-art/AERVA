export type DoctorInCharge = {
  name: string;
  specialty: string;
  designation: string;
  qualification: string;
  registrationNumber: string;
  shift: string;
  onDuty: boolean;
  phoneExtension: string;
};

export type HospitalCapacity = {
  erBeds: { available: number; total: number };
  icuBeds: { available: number; total: number };
  ventilators: { available: number; total: number };
  otRooms: { available: number; total: number };
};

export type Hospital = {
  id: string;
  name: string;
  phone: string;
  distance: number; // in km
  eta: number; // in minutes
  verified: boolean;
  lastUpdated: string;
  erWaitTime: number; // in minutes
  capacity: HospitalCapacity;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  specialists: string[];
  bloodBank: Record<string, "Available" | "Limited" | "Unavailable">;
  doctorInCharge: DoctorInCharge;
};

export const MOCK_HOSPITALS: Hospital[] = [
  {
    id: "h1",
    name: "Apollo Multispeciality Hospitals",
    phone: "+91 33 2320 3040",
    address: "58 Canal Circular Road, Kadapara, Phool Bagan",
    city: "Kolkata",
    latitude: 22.5694,
    longitude: 88.3986,
    distance: 2.5,
    eta: 7,
    verified: true,
    lastUpdated: "2 min ago",
    erWaitTime: 10,
    capacity: {
      erBeds: { available: 6, total: 30 },
      icuBeds: { available: 4, total: 18 },
      ventilators: { available: 5, total: 20 },
      otRooms: { available: 3, total: 6 },
    },
    specialists: ["Cardiologist", "General Surgeon", "Trauma Specialist"],
    bloodBank: { "O+": "Available", "O-": "Limited", "A+": "Available", "AB+": "Available" },
    doctorInCharge: {
      name: "Dr. Sandip Sengupta",
      specialty: "Emergency & Trauma Medicine",
      designation: "Chief Medical Officer & ER Lead",
      qualification: "MD (Emergency Med), FACEE",
      registrationNumber: "WBMC-48291",
      shift: "Day Shift (08:00 - 20:00)",
      onDuty: true,
      phoneExtension: "Ext. 204",
    },
  },
  {
    id: "h2",
    name: "AMRI Hospital Salt Lake",
    phone: "+91 33 2335 7710",
    address: "JC - 16 & 17, Sector III, Salt Lake City",
    city: "Kolkata",
    latitude: 22.5645,
    longitude: 88.4069,
    distance: 3.2,
    eta: 9,
    verified: true,
    lastUpdated: "Just now",
    erWaitTime: 5,
    capacity: {
      erBeds: { available: 8, total: 20 },
      icuBeds: { available: 5, total: 12 },
      ventilators: { available: 6, total: 15 },
      otRooms: { available: 2, total: 4 },
    },
    specialists: ["Cardiologist", "Neurologist", "Cardiac Surgeon"],
    bloodBank: { "O+": "Available", "O-": "Available", "A+": "Available", "AB+": "Available" },
    doctorInCharge: {
      name: "Dr. Debashis Roy",
      specialty: "Cardiothoracic & Critical Care",
      designation: "Senior Consultant - Emergency Triage",
      qualification: "MS, MCh (CTS), FCCP",
      registrationNumber: "WBMC-39182",
      shift: "Evening Shift (10:00 - 22:00)",
      onDuty: true,
      phoneExtension: "Ext. 118",
    },
  },
  {
    id: "h3",
    name: "Columbia Asia Hospital (Manipal)",
    phone: "+91 33 6607 0000",
    address: "IB-193, Broadway Rd, Sector III, Salt Lake",
    city: "Kolkata",
    latitude: 22.5683,
    longitude: 88.4087,
    distance: 4.1,
    eta: 12,
    verified: true,
    lastUpdated: "5 min ago",
    erWaitTime: 4,
    capacity: {
      erBeds: { available: 12, total: 25 },
      icuBeds: { available: 6, total: 15 },
      ventilators: { available: 8, total: 20 },
      otRooms: { available: 4, total: 6 },
    },
    specialists: ["Trauma Surgeon", "Burn Specialist", "Orthopedic Surgeon"],
    bloodBank: { "O+": "Available", "O-": "Limited", "A+": "Available" },
    doctorInCharge: {
      name: "Dr. Ananya Mukherjee",
      specialty: "Critical Care & Trauma Surgery",
      designation: "HOD Emergency Services",
      qualification: "MD (Trauma & Critical Care), DNB",
      registrationNumber: "WBMC-51024",
      shift: "Day Lead (07:00 - 19:00)",
      onDuty: true,
      phoneExtension: "Ext. 302",
    },
  },
  {
    id: "h4",
    name: "Subodh Mitra Cancer Hospital & Clinic",
    phone: "+91 33 2337 1212",
    address: "Block IB, Sector III, Salt Lake",
    city: "Kolkata",
    latitude: 22.5670,
    longitude: 88.4112,
    distance: 2.1,
    eta: 8,
    verified: false,
    lastUpdated: "2 hours ago",
    erWaitTime: 20,
    capacity: {
      erBeds: { available: 0, total: 10 },
      icuBeds: { available: 1, total: 5 },
      ventilators: { available: 1, total: 5 },
      otRooms: { available: 1, total: 2 },
    },
    specialists: ["Oncologist", "General Physician"],
    bloodBank: { "O+": "Limited" },
    doctorInCharge: {
      name: "Dr. Kalyan Bose",
      specialty: "General & Critical Medicine",
      designation: "Emergency Medical Officer (EMO)",
      qualification: "MBBS, MD (Internal Med)",
      registrationNumber: "WBMC-29471",
      shift: "General Shift (09:00 - 18:00)",
      onDuty: true,
      phoneExtension: "Ext. 105",
    },
  },
  {
    id: "h5",
    name: "Fortis Hospital Anandapur",
    phone: "+91 33 6628 4444",
    address: "730 Anandapur, E.M. Bypass Road",
    city: "Kolkata",
    latitude: 22.5186,
    longitude: 88.4034,
    distance: 5.4,
    eta: 15,
    verified: true,
    lastUpdated: "Just now",
    erWaitTime: 3,
    capacity: {
      erBeds: { available: 5, total: 18 },
      icuBeds: { available: 3, total: 10 },
      ventilators: { available: 4, total: 12 },
      otRooms: { available: 2, total: 4 },
    },
    specialists: ["Cardiologist", "Trauma Surgeon", "Neurologist", "Critical Care"],
    bloodBank: { "O+": "Available", "O-": "Available", "A+": "Available", "B+": "Available" },
    doctorInCharge: {
      name: "Dr. Vikram Malhotra",
      specialty: "Trauma Surgery & Resuscitation",
      designation: "HOD Emergency & Trauma",
      qualification: "MS (Gen Surg), MCh (Trauma), FACS",
      registrationNumber: "WBMC-41920",
      shift: "Emergency Active Shift",
      onDuty: true,
      phoneExtension: "Ext. 312",
    },
  },
  {
    id: "h6",
    name: "Ruby General Hospital",
    phone: "+91 33 3987 1800",
    address: "Kasba Golpark, E.M. Bypass",
    city: "Kolkata",
    latitude: 22.5132,
    longitude: 88.4026,
    distance: 5.9,
    eta: 17,
    verified: true,
    lastUpdated: "4 min ago",
    erWaitTime: 5,
    capacity: {
      erBeds: { available: 7, total: 22 },
      icuBeds: { available: 4, total: 12 },
      ventilators: { available: 5, total: 14 },
      otRooms: { available: 3, total: 5 },
    },
    specialists: ["General Surgeon", "Trauma Specialist", "Orthopedic Surgeon"],
    bloodBank: { "O+": "Available", "A+": "Available", "AB+": "Available" },
    doctorInCharge: {
      name: "Dr. Anirban Ghosh",
      specialty: "Emergency Medicine",
      designation: "Senior Registrar - Casualty",
      qualification: "MD (Emergency Med)",
      registrationNumber: "WBMC-38102",
      shift: "Rotating Duty Shift",
      onDuty: true,
      phoneExtension: "Ext. 110",
    },
  },
];

export const EMERGENCIES = [
  { id: "cardiac", title: "Cardiac", icon: "Activity", color: "#EF4444", requiredSpecialty: "Cardiologist" },
  { id: "trauma", title: "Trauma", icon: "Activity", color: "#F97316", requiredSpecialty: "Trauma Surgeon" },
  { id: "stroke", title: "Stroke", icon: "Activity", color: "#8B5CF6", requiredSpecialty: "Neurologist" },
  { id: "bleeding", title: "Severe Bleeding", icon: "Droplet", color: "#DC2626", requiredSpecialty: "General Surgeon" },
  { id: "burns", title: "Burns", icon: "Flame", color: "#EA580C", requiredSpecialty: "Burn Specialist" },
  { id: "breathing", title: "Breathing Problem", icon: "Wind", color: "#0EA5E9", requiredSpecialty: "General Physician" },
  { id: "other", title: "Other", icon: "HelpCircle", color: "#6B7280", requiredSpecialty: null },
];

export const HOSPITAL_OVERRIDES_STORAGE_KEY = "nearer_hospital_overrides";

/**
 * Reads live hospital state including any updates made by hospital staff
 * through the Capacity & Beds Management portal.
 */
export function getLiveHospitals(): Hospital[] {
  if (typeof window === "undefined") {
    return MOCK_HOSPITALS;
  }
  try {
    const raw = localStorage.getItem(HOSPITAL_OVERRIDES_STORAGE_KEY);
    if (!raw) return MOCK_HOSPITALS;
    const overrides: Record<string, Partial<Hospital>> = JSON.parse(raw);
    return MOCK_HOSPITALS.map(h => {
      const o = overrides[h.id];
      if (!o) return h;
      return {
        ...h,
        ...o,
        capacity: {
          ...h.capacity,
          ...(o.capacity || {})
        },
        doctorInCharge: {
          ...h.doctorInCharge,
          ...(o.doctorInCharge || {})
        }
      };
    });
  } catch (e) {
    return MOCK_HOSPITALS;
  }
}

export function findHospitalById(id?: string | null, useStatic = false): Hospital {
  const hospitals = useStatic ? MOCK_HOSPITALS : getLiveHospitals();
  if (!id) return hospitals[0];
  const cleanId = id.toLowerCase().trim();

  // 1. Direct ID match
  const direct = hospitals.find(h => h.id.toLowerCase() === cleanId);
  if (direct) return direct;

  // 2. Normalized alias / ID mapping
  const alias = hospitals.find(h => {
    const hid = h.id.toLowerCase();
    const hname = h.name.toLowerCase();
    if (cleanId === "h1" || cleanId.includes("apollo")) return hid === "h1" || hname.includes("apollo");
    if (cleanId === "h2" || cleanId === "h2_amri" || cleanId.includes("amri")) return hid === "h2" || hname.includes("amri");
    if (cleanId === "h3" || cleanId.includes("manipal") || cleanId.includes("columbia")) return hid === "h3" || hname.includes("manipal") || hname.includes("columbia");
    if (cleanId === "h4" || cleanId.includes("subodh")) return hid === "h4" || hname.includes("subodh");
    if (cleanId === "h5" || cleanId.includes("fortis")) return hid === "h5" || hname.includes("fortis");
    if (cleanId === "h6" || cleanId.includes("ruby")) return hid === "h6" || hname.includes("ruby");
    return hid.includes(cleanId) || cleanId.includes(hid) || hname.includes(cleanId);
  });
  if (alias) return alias;

  // 3. Fallback to first hospital with available beds, or default
  return hospitals.find(h => h.capacity.erBeds.available > 0) || hospitals[0];
}

export function getLiveHospital(id: string): Hospital {
  return findHospitalById(id);
}

export function saveHospitalCapacity(id: string, capacityUpdates: Partial<HospitalCapacity>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(HOSPITAL_OVERRIDES_STORAGE_KEY);
    const overrides: Record<string, any> = raw ? JSON.parse(raw) : {};
    overrides[id] = {
      ...(overrides[id] || {}),
      lastUpdated: "Just now",
      capacity: {
        ...(overrides[id]?.capacity || {}),
        ...capacityUpdates,
      }
    };
    localStorage.setItem(HOSPITAL_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new Event("nearer_hospital_data_updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to save hospital capacity", e);
  }
}

export function saveDoctorInCharge(id: string, doctorUpdates: Partial<DoctorInCharge>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(HOSPITAL_OVERRIDES_STORAGE_KEY);
    const overrides: Record<string, any> = raw ? JSON.parse(raw) : {};
    overrides[id] = {
      ...(overrides[id] || {}),
      lastUpdated: "Just now",
      doctorInCharge: {
        ...(overrides[id]?.doctorInCharge || {}),
        ...doctorUpdates,
      }
    };
    localStorage.setItem(HOSPITAL_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new Event("nearer_hospital_data_updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to save doctor in charge", e);
  }
}

/**
 * Smart Decision Engine Algorithm
 * Dynamically evaluates hospitals based on live, updated data:
 * 1. Required specialist presence (Massive weight)
 * 2. Available ER & ICU capacity (STRICT HARD GATE: 0 beds = disqualified)
 * 3. Travel ETA & ER Wait time
 * 4. Verified data status
 */
export function findBestHospitals(emergencyId: string, useStatic = false) {
  const hospitals = useStatic ? MOCK_HOSPITALS : getLiveHospitals();
  const emergency = EMERGENCIES.find(e => e.id === emergencyId) || EMERGENCIES[0];
  
  const scoredHospitals = hospitals.map(hospital => {
    let score = 100;
    const reasons = [];

    // 1. Hard Capacity Check: If ER is full, hospital CANNOT intake emergency patients!
    const erBedsAvailable = hospital.capacity?.erBeds?.available ?? 0;
    if (erBedsAvailable > 0) {
      score += (erBedsAvailable * 10);
      reasons.push(`${erBedsAvailable} ER beds available`);
    } else {
      // Disqualifying penalty so full hospitals are NEVER chosen over available facilities
      score -= 50000;
      reasons.push("ER BEDS FULL — Intake restricted");
    }

    // 2. Specialist Check
    if (emergency.requiredSpecialty) {
      if (hospital.specialists.includes(emergency.requiredSpecialty)) {
        score += 500;
        reasons.push(`Required ${emergency.requiredSpecialty} on duty`);
      } else {
        score -= 200; // Penalize if they don't have the specialist
      }
    }

    if (hospital.capacity.icuBeds.available > 0) {
      score += (hospital.capacity.icuBeds.available * 4);
    }

    // 3. Time Penalty (ETA + Wait Time)
    const totalTime = hospital.eta + hospital.erWaitTime;
    score -= (totalTime * 3);
    
    if (hospital.eta < 15) {
      reasons.push(`Fastest route (${hospital.eta} mins)`);
    }

    // 4. Verification Check
    if (hospital.verified) {
      score += 50;
      reasons.push(`Verified live data`);
    } else {
      score -= 100;
    }

    return { hospital, score, reasons: reasons.slice(0, 3) };
  });

  // Sort descending by score
  scoredHospitals.sort((a, b) => b.score - a.score);

  return {
    bestMatch: scoredHospitals[0].hospital,
    matchReasons: scoredHospitals[0].reasons,
    alternatives: scoredHospitals.slice(1).map(s => s.hospital),
    emergency
  };
}
