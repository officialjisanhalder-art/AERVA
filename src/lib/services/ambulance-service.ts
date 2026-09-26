/**
 * NearER Ambulance Fleet & Telemetry Service
 * Real-time fleet management, emergency dispatch, and live patient tracking.
 */

import { supabase, isSupabaseConfigured } from "../supabase/client";

export type AmbulanceType =
  | "ALS_MOBILE_ICU"
  | "CARDIAC_CARE"
  | "BLS_BASIC"
  | "NEONATAL_CRITICAL";

export type AmbulanceStatus =
  | "AVAILABLE_STANDBY"
  | "DISPATCHED"
  | "EN_ROUTE_PATIENT"
  | "PATIENT_ONBOARD"
  | "ARRIVED_HOSPITAL"
  | "RETURNING_BASE"
  | "MAINTENANCE";

export interface AmbulanceDriver {
  name: string;
  phone: string;
  rating: number;
}

export interface AmbulanceParamedic {
  name: string;
  qualification: string;
  phone: string;
}

export interface AmbulanceTelemetry {
  latitude: number;
  longitude: number;
  speedKmH: number;
  heading: number;
  oxygenLevelPercent: number;
  fuelPercent: number;
}

export interface Ambulance {
  id: string;
  unitCode: string;
  vehicleNumber: string;
  name: string;
  type: AmbulanceType;
  hospitalId: string;
  hospitalName: string;
  status: AmbulanceStatus;
  driver: AmbulanceDriver;
  paramedic: AmbulanceParamedic;
  equipment: string[];
  telemetry: AmbulanceTelemetry;
  assignedCaseId?: string;
  patientName?: string;
  patientLocation?: {
    latitude: number;
    longitude: number;
    area?: string;
    city?: string;
  };
  etaMinutes: number;
  greenCorridorActive: boolean;
  lastUpdated: string;
}

const INITIAL_FLEET: Ambulance[] = [
  {
    id: "amb-101",
    unitCode: "AMB-101",
    vehicleNumber: "WB-02-AK-4401",
    name: "ALS Mobile ICU 01",
    type: "ALS_MOBILE_ICU",
    hospitalId: "h1",
    hospitalName: "Apollo Multispeciality Hospitals",
    status: "AVAILABLE_STANDBY",
    driver: {
      name: "Ramesh Mondal",
      phone: "+91 98311 44556",
      rating: 4.9,
    },
    paramedic: {
      name: "Bikash Roy",
      qualification: "Critical Care Paramedic (ALS Cert)",
      phone: "+91 98311 99881",
    },
    equipment: [
      "Transport Ventilator (Hamilton-T1)",
      "Automated External Defibrillator (AED)",
      "Multipara Monitor (NIBP/SpO2/ECG)",
      "Medical Oxygen 88%",
      "Syringe Infusion Pump",
      "Spine Board & Extrication Collar",
    ],
    telemetry: {
      latitude: 22.5701,
      longitude: 88.4032,
      speedKmH: 0,
      heading: 90,
      oxygenLevelPercent: 92,
      fuelPercent: 85,
    },
    etaMinutes: 0,
    greenCorridorActive: false,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "amb-102",
    unitCode: "AMB-102",
    vehicleNumber: "WB-06-CX-8820",
    name: "Cardiac Rapid Resuscitation Unit",
    type: "CARDIAC_CARE",
    hospitalId: "h2",
    hospitalName: "AMRI Hospital Salt Lake",
    status: "AVAILABLE_STANDBY",
    driver: {
      name: "Sunil Das",
      phone: "+91 98305 22119",
      rating: 4.8,
    },
    paramedic: {
      name: "Dr. Ananya Sen",
      qualification: "Emergency Medical Registrar on Board",
      phone: "+91 98305 77661",
    },
    equipment: [
      "12-Lead Wireless Telemetry ECG",
      "Biphasic Defibrillator with Pacing",
      "Portable Medical Oxygen 95%",
      "Emergency Crash Drug Kit",
      "Suction Apparatus",
      "Resuscitation Bag-Valve-Mask",
    ],
    telemetry: {
      latitude: 22.5645,
      longitude: 88.4069,
      speedKmH: 0,
      heading: 180,
      oxygenLevelPercent: 95,
      fuelPercent: 90,
    },
    etaMinutes: 0,
    greenCorridorActive: false,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "amb-103",
    unitCode: "AMB-103",
    vehicleNumber: "WB-02-BL-1192",
    name: "Level-1 Trauma & Surgical Ambulance",
    type: "ALS_MOBILE_ICU",
    hospitalId: "h1",
    hospitalName: "Apollo Multispeciality Hospitals",
    status: "AVAILABLE_STANDBY",
    driver: {
      name: "Pradip Mukherjee",
      phone: "+91 98322 33445",
      rating: 4.7,
    },
    paramedic: {
      name: "Subrata Paul",
      qualification: "Advanced Trauma Life Support (ATLS) EMT",
      phone: "+91 98322 88771",
    },
    equipment: [
      "Trauma Vacuum Splints",
      "Haemostatic Dressing Pack",
      "Portable Ultrasound (FAST Scan)",
      "Multipara Vital Monitor",
      "High-Flow Oxygen Concentrator",
      "Cervical Immobilizer",
    ],
    telemetry: {
      latitude: 22.5715,
      longitude: 88.3985,
      speedKmH: 0,
      heading: 45,
      oxygenLevelPercent: 88,
      fuelPercent: 78,
    },
    etaMinutes: 0,
    greenCorridorActive: false,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "amb-104",
    unitCode: "AMB-104",
    vehicleNumber: "WB-06-DZ-9901",
    name: "Basic Life Support Responder",
    type: "BLS_BASIC",
    hospitalId: "h2",
    hospitalName: "AMRI Hospital Salt Lake",
    status: "AVAILABLE_STANDBY",
    driver: {
      name: "Mohan Lal",
      phone: "+91 98333 11223",
      rating: 4.6,
    },
    paramedic: {
      name: "Amitabha Roy",
      qualification: "Certified First Responder (EMT-B)",
      phone: "+91 98333 44556",
    },
    equipment: [
      "Portable Oxygen Kit",
      "Stretcher Trolley",
      "Automated External Defibrillator (AED)",
      "First Aid Trauma Bag",
      "Pulse Oximeter & BP Monitor",
    ],
    telemetry: {
      latitude: 22.562,
      longitude: 88.409,
      speedKmH: 0,
      heading: 270,
      oxygenLevelPercent: 85,
      fuelPercent: 82,
    },
    etaMinutes: 0,
    greenCorridorActive: false,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "amb-105",
    unitCode: "AMB-105",
    vehicleNumber: "WB-02-EP-5531",
    name: "Neonatal & Pediatric Critical Transport",
    type: "NEONATAL_CRITICAL",
    hospitalId: "h3",
    hospitalName: "Manipal Hospital Broadway",
    status: "AVAILABLE_STANDBY",
    driver: {
      name: "Dipak Saha",
      phone: "+91 98344 55667",
      rating: 4.9,
    },
    paramedic: {
      name: "Sister Mary Fernandez",
      qualification: "Pediatric Critical Care Specialist",
      phone: "+91 98344 77889",
    },
    equipment: [
      "Transport Incubator with Temperature Control",
      "Neonatal High-Frequency Ventilator",
      "Micro-Infusion Syringe Driver",
      "Pediatric Resuscitation Kit",
      "Oxygen Hood & Blender",
    ],
    telemetry: {
      latitude: 22.568,
      longitude: 88.411,
      speedKmH: 0,
      heading: 0,
      oxygenLevelPercent: 98,
      fuelPercent: 91,
    },
    etaMinutes: 0,
    greenCorridorActive: false,
    lastUpdated: new Date().toISOString(),
  },
];

class AmbulanceFleetService {
  private fleet: Ambulance[] = [...INITIAL_FLEET];
  private isLoadedFromStorage = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nearer_ambulance_fleet");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.fleet = parsed;
          }
        }
      } catch (_) {}
      this.isLoadedFromStorage = true;
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nearer_ambulance_fleet", JSON.stringify(this.fleet));
        window.dispatchEvent(new Event("nearer_ambulance_fleet_updated"));
      } catch (_) {}
    }
  }

  public getAllAmbulances(filter?: { hospitalId?: string; status?: AmbulanceStatus }): Ambulance[] {
    this.loadFromStorage();
    let result = [...this.fleet];
    if (filter?.hospitalId) {
      const hId = filter.hospitalId.toLowerCase();
      result = result.filter(
        (a) =>
          a.hospitalId.toLowerCase() === hId ||
          (hId === "h2_amri" && a.hospitalId === "h2") ||
          (hId === "h2" && a.hospitalId === "h2_amri")
      );
    }
    if (filter?.status) {
      result = result.filter((a) => a.status === filter.status);
    }
    return result;
  }

  public getAmbulanceById(id: string): Ambulance | undefined {
    this.loadFromStorage();
    return this.fleet.find((a) => a.id.toLowerCase() === id.toLowerCase() || a.unitCode.toLowerCase() === id.toLowerCase());
  }

  public getAmbulanceForCase(caseId: string): Ambulance | undefined {
    this.loadFromStorage();
    return this.fleet.find((a) => a.assignedCaseId === caseId);
  }

  public async dispatchAmbulance(params: {
    caseId: string;
    ambulanceId?: string;
    hospitalId?: string;
    patientName?: string;
    patientLocation: { latitude: number; longitude: number; area?: string; city?: string };
    emergencyType?: string;
  }): Promise<Ambulance> {
    this.loadFromStorage();

    // Find requested ambulance, or automatically select the best standby ambulance
    let vehicle = params.ambulanceId
      ? this.getAmbulanceById(params.ambulanceId)
      : undefined;

    if (!vehicle) {
      const candidates = this.getAllAmbulances({
        hospitalId: params.hospitalId,
        status: "AVAILABLE_STANDBY",
      });
      vehicle = candidates[0] || this.fleet[0];
    }

    vehicle.status = "DISPATCHED";
    vehicle.assignedCaseId = params.caseId;
    vehicle.patientName = params.patientName || "Emergency Patient";
    vehicle.patientLocation = params.patientLocation;
    vehicle.etaMinutes = 6;
    vehicle.greenCorridorActive = true;
    vehicle.lastUpdated = new Date().toISOString();

    // Update telemetry to move towards patient
    vehicle.telemetry.speedKmH = 46;
    vehicle.telemetry.latitude = (vehicle.telemetry.latitude + params.patientLocation.latitude) / 2;
    vehicle.telemetry.longitude = (vehicle.telemetry.longitude + params.patientLocation.longitude) / 2;

    this.saveToStorage();

    // Broadcast to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("emergency_case_events").insert({
          event_type: "AMBULANCE_DISPATCHED",
          event_data: {
            case_id: params.caseId,
            ambulance_id: vehicle.id,
            unit_code: vehicle.unitCode,
            driver_name: vehicle.driver.name,
            driver_phone: vehicle.driver.phone,
            paramedic_name: vehicle.paramedic.name,
            eta_minutes: vehicle.etaMinutes,
            patient_location: params.patientLocation,
          },
          created_at: new Date().toISOString(),
        });
      } catch (_) {}
    }

    return vehicle;
  }

  public async updateAmbulanceStatus(
    ambulanceId: string,
    status: AmbulanceStatus,
    telemetry?: Partial<AmbulanceTelemetry>
  ): Promise<Ambulance | null> {
    this.loadFromStorage();
    const vehicle = this.getAmbulanceById(ambulanceId);
    if (!vehicle) return null;

    vehicle.status = status;
    vehicle.lastUpdated = new Date().toISOString();

    if (telemetry) {
      vehicle.telemetry = { ...vehicle.telemetry, ...telemetry };
    }

    if (status === "EN_ROUTE_PATIENT") {
      vehicle.etaMinutes = Math.max(1, vehicle.etaMinutes - 2);
      vehicle.telemetry.speedKmH = 48;
    } else if (status === "PATIENT_ONBOARD") {
      vehicle.etaMinutes = 8;
      vehicle.telemetry.speedKmH = 52;
    } else if (status === "ARRIVED_HOSPITAL" || status === "AVAILABLE_STANDBY") {
      vehicle.etaMinutes = 0;
      vehicle.telemetry.speedKmH = 0;
      if (status === "AVAILABLE_STANDBY") {
        vehicle.assignedCaseId = undefined;
        vehicle.patientName = undefined;
        vehicle.patientLocation = undefined;
        vehicle.greenCorridorActive = false;
      }
    }

    this.saveToStorage();

    if (isSupabaseConfigured && supabase && vehicle.assignedCaseId) {
      try {
        await supabase.from("emergency_case_events").insert({
          event_type: "AMBULANCE_STATUS_UPDATED",
          event_data: {
            case_id: vehicle.assignedCaseId,
            ambulance_id: vehicle.id,
            unit_code: vehicle.unitCode,
            status,
            eta_minutes: vehicle.etaMinutes,
            telemetry: vehicle.telemetry,
          },
          created_at: new Date().toISOString(),
        });
      } catch (_) {}
    }

    return vehicle;
  }

  public requestGreenCorridor(ambulanceId: string): boolean {
    const vehicle = this.getAmbulanceById(ambulanceId);
    if (!vehicle) return false;
    vehicle.greenCorridorActive = true;
    vehicle.lastUpdated = new Date().toISOString();
    this.saveToStorage();
    return true;
  }

  public resetFleet(): Ambulance[] {
    this.fleet = [...INITIAL_FLEET];
    this.saveToStorage();
    return this.fleet;
  }
}

export const ambulanceService = new AmbulanceFleetService();
