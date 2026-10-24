import { supabase, isSupabaseConfigured } from "../supabase/client";
import { calculateDistanceKm, estimateDrivingEtaMinutes } from "./locationService";

export interface HospitalRecord {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  is_verified: boolean;
  emergency_available: boolean;
  is_24x7: boolean;
  last_updated: string;
  distanceKm?: number;
  etaMinutes?: number;
  capabilities: string[];
  capacity: {
    er_status: string;
    er_beds_available: number;
    er_beds_total: number;
    icu_beds_available: number;
    icu_beds_total: number;
    ventilators_available: number;
    ventilators_total: number;
    ot_rooms_available: number;
    ot_rooms_total: number;
  };
  blood_inventory: {
    blood_group: string;
    availability_status: string;
  }[];
}

export const DEMO_HOSPITALS_DATA: HospitalRecord[] = [
  {
    id: "h1",
    name: "Apollo Multispeciality Hospitals",
    phone_number: "+91 33 2320 3040",
    email: "emergency@apollo-kolkata.org",
    address: "58 Canal Circular Road, Kadapara, Phool Bagan",
    city: "Kolkata",
    state: "West Bengal",
    postal_code: "700054",
    latitude: 22.5694,
    longitude: 88.3986,
    is_verified: true,
    emergency_available: true,
    is_24x7: true,
    last_updated: "2 mins ago",
    capabilities: ["Cardiology", "Trauma", "Neurology", "Respiratory", "Cath Lab 24x7", "CT/MRI Scan"],
    capacity: {
      er_status: "OPEN",
      er_beds_available: 6,
      er_beds_total: 30,
      icu_beds_available: 4,
      icu_beds_total: 18,
      ventilators_available: 5,
      ventilators_total: 20,
      ot_rooms_available: 3,
      ot_rooms_total: 6,
    },
    blood_inventory: [
      { blood_group: "O+", availability_status: "AVAILABLE" },
      { blood_group: "O-", availability_status: "AVAILABLE" },
      { blood_group: "A+", availability_status: "AVAILABLE" },
      { blood_group: "B+", availability_status: "AVAILABLE" },
    ],
  },
  {
    id: "h2",
    name: "AMRI Hospital Salt Lake",
    phone_number: "+91 33 2335 7710",
    email: "emergency@amri-saltlake.org",
    address: "JC - 16 & 17, Sector III, Salt Lake City",
    city: "Kolkata",
    state: "West Bengal",
    postal_code: "700098",
    latitude: 22.5645,
    longitude: 88.4069,
    is_verified: true,
    emergency_available: true,
    is_24x7: true,
    last_updated: "1 min ago",
    capabilities: ["Cardiology", "Trauma", "Stroke Unit", "Cardiac Surgery", "Critical Care", "Cath Lab 24x7"],
    capacity: {
      er_status: "OPEN",
      er_beds_available: 8,
      er_beds_total: 20,
      icu_beds_available: 5,
      icu_beds_total: 12,
      ventilators_available: 6,
      ventilators_total: 15,
      ot_rooms_available: 2,
      ot_rooms_total: 4,
    },
    blood_inventory: [
      { blood_group: "O+", availability_status: "AVAILABLE" },
      { blood_group: "O-", availability_status: "AVAILABLE" },
      { blood_group: "A+", availability_status: "AVAILABLE" },
      { blood_group: "B+", availability_status: "AVAILABLE" },
      { blood_group: "AB+", availability_status: "AVAILABLE" },
    ],
  },
  {
    id: "h3",
    name: "Columbia Asia Hospital (Manipal)",
    phone_number: "+91 33 6607 0000",
    email: "triage@manipal-kolkata.org",
    address: "IB-193, Broadway Rd, Sector III, Salt Lake",
    city: "Kolkata",
    state: "West Bengal",
    postal_code: "700106",
    latitude: 22.5683,
    longitude: 88.4087,
    is_verified: true,
    emergency_available: true,
    is_24x7: true,
    last_updated: "4 mins ago",
    capabilities: ["Trauma", "Burn Care", "Orthopedic Surgery", "Neurology", "Cardiology"],
    capacity: {
      er_status: "OPEN",
      er_beds_available: 12,
      er_beds_total: 25,
      icu_beds_available: 6,
      icu_beds_total: 15,
      ventilators_available: 8,
      ventilators_total: 20,
      ot_rooms_available: 4,
      ot_rooms_total: 6,
    },
    blood_inventory: [
      { blood_group: "O+", availability_status: "AVAILABLE" },
      { blood_group: "O-", availability_status: "LIMITED" },
      { blood_group: "A+", availability_status: "AVAILABLE" },
    ],
  },
  {
    id: "h4",
    name: "Subodh Mitra Cancer Hospital & Clinic",
    phone_number: "+91 33 2337 1212",
    email: "emergency@subodh-mitra.org",
    address: "Block IB, Sector III, Salt Lake",
    city: "Kolkata",
    state: "West Bengal",
    postal_code: "700106",
    latitude: 22.5670,
    longitude: 88.4112,
    is_verified: false,
    emergency_available: false,
    is_24x7: true,
    last_updated: "3 mins ago",
    capabilities: ["Oncology", "General Emergency", "Palliative Care"],
    capacity: {
      er_status: "FULL",
      er_beds_available: 0,
      er_beds_total: 10,
      icu_beds_available: 1,
      icu_beds_total: 5,
      ventilators_available: 1,
      ventilators_total: 5,
      ot_rooms_available: 1,
      ot_rooms_total: 2,
    },
    blood_inventory: [
      { blood_group: "O+", availability_status: "LIMITED" },
    ],
  },
  {
    id: "h5",
    name: "Fortis Hospital Anandapur",
    phone_number: "+91 33 6628 4444",
    email: "emergency@fortis-kolkata.org",
    address: "730 Anandapur, E.M. Bypass Road",
    city: "Kolkata",
    state: "West Bengal",
    postal_code: "700107",
    latitude: 22.5186,
    longitude: 88.4034,
    is_verified: true,
    emergency_available: true,
    is_24x7: true,
    last_updated: "5 mins ago",
    capabilities: ["Cardiology", "Trauma", "Neurology", "Critical Care", "Cath Lab 24x7"],
    capacity: {
      er_status: "OPEN",
      er_beds_available: 5,
      er_beds_total: 18,
      icu_beds_available: 3,
      icu_beds_total: 10,
      ventilators_available: 4,
      ventilators_total: 12,
      ot_rooms_available: 2,
      ot_rooms_total: 4,
    },
    blood_inventory: [
      { blood_group: "O+", availability_status: "AVAILABLE" },
      { blood_group: "O-", availability_status: "AVAILABLE" },
      { blood_group: "A+", availability_status: "AVAILABLE" },
      { blood_group: "B+", availability_status: "AVAILABLE" },
    ],
  },
  {
    id: "h6",
    name: "Ruby General Hospital",
    phone_number: "+91 33 3987 1800",
    email: "emergency@rubyhospital.com",
    address: "Kasba Golpark, E.M. Bypass",
    city: "Kolkata",
    state: "West Bengal",
    postal_code: "700107",
    latitude: 22.5132,
    longitude: 88.4026,
    is_verified: true,
    emergency_available: true,
    is_24x7: true,
    last_updated: "4 mins ago",
    capabilities: ["General Emergency", "Trauma", "Orthopedics", "General Surgery"],
    capacity: {
      er_status: "OPEN",
      er_beds_available: 7,
      er_beds_total: 22,
      icu_beds_available: 4,
      icu_beds_total: 12,
      ventilators_available: 5,
      ventilators_total: 14,
      ot_rooms_available: 3,
      ot_rooms_total: 5,
    },
    blood_inventory: [
      { blood_group: "O+", availability_status: "AVAILABLE" },
      { blood_group: "A+", availability_status: "AVAILABLE" },
      { blood_group: "AB+", availability_status: "AVAILABLE" },
    ],
  },
];

let cachedHospitals: HospitalRecord[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30000; // 30s in-memory cache

export const hospitalService = {
  // Query hospitals with distance & driving ETA from given lat/lng
  async getNearbyHospitals(
    latitude: number,
    longitude: number,
    maxRadiusKm = 50
  ): Promise<HospitalRecord[]> {
    const now = Date.now();
    let hospitals: HospitalRecord[] = [];

    if (cachedHospitals && (now - lastCacheTime < CACHE_TTL_MS)) {
      hospitals = [...cachedHospitals];
    } else if (isSupabaseConfigured && supabase) {
      try {
        const fetchPromise = Promise.resolve(
          supabase
            .from("hospitals")
            .select("*, hospital_capacity(*), hospital_capabilities(*), blood_inventory(*)")
        );
        const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error("Supabase timeout") }), 1500)
        );
        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

        if (!error && data && data.length > 0) {
          hospitals = data.map((h: any) => ({
            id: h.id,
            name: h.name,
            phone_number: h.phone_number,
            email: h.email,
            address: h.address,
            city: h.city,
            state: h.state,
            postal_code: h.postal_code,
            latitude: h.latitude,
            longitude: h.longitude,
            is_verified: h.is_verified,
            emergency_available: h.emergency_available,
            is_24x7: h.is_24x7,
            last_updated: "Live DB",
            capabilities: (h.hospital_capabilities || []).map((c: any) => c.capability_name),
            capacity: h.hospital_capacity?.[0] || {
              er_status: "OPEN",
              er_beds_available: 3,
              er_beds_total: 10,
              icu_beds_available: 2,
              icu_beds_total: 6,
              ventilators_available: 2,
              ventilators_total: 4,
              ot_rooms_available: 1,
              ot_rooms_total: 2,
            },
            blood_inventory: h.blood_inventory || [],
          }));
          cachedHospitals = hospitals;
          lastCacheTime = now;
        }
      } catch (e) {
        console.warn("Error fetching hospitals from Supabase, using seed data:", e);
      }
    }

    if (hospitals.length === 0) {
      hospitals = [...DEMO_HOSPITALS_DATA];
      cachedHospitals = hospitals;
      lastCacheTime = now;
    }

    // Attach distance and ETA to each hospital
    const enriched = hospitals
      .map((h) => {
        const distanceKm = calculateDistanceKm(latitude, longitude, h.latitude, h.longitude);
        const etaMinutes = estimateDrivingEtaMinutes(distanceKm);
        return { ...h, distanceKm, etaMinutes };
      })
      .filter((h) => (h.distanceKm ?? 0) <= maxRadiusKm)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

    return enriched;
  },

  async getHospitalById(id: string): Promise<HospitalRecord | null> {
    const list = await hospitalService.getNearbyHospitals(22.5726, 88.3639, 100);
    return list.find((h) => h.id === id || (id === "h2_amri" && (h.id === "h2" || h.id === "amri"))) || list[0] || null;
  },
};
