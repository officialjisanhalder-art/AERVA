import { HospitalRecord } from "./hospitalService";

export interface MatchScoreResult {
  hospital: HospitalRecord;
  totalScore: number; // 0 to 100
  isRecommended: boolean;
  reasons: {
    passed: string[];
    warnings: string[];
  };
  metrics: {
    capabilityMatch: boolean;
    erBedsOpen: number;
    icuBedsOpen: number;
    bloodAvailable: boolean;
    etaMinutes: number;
  };
}

// Map emergency types to required capabilities
const EMERGENCY_REQUIREMENTS: Record<string, { specialty: string; requiresICU: boolean; defaultBlood?: string }> = {
  cardiac: { specialty: "Cardiology", requiresICU: true, defaultBlood: "O+" },
  stroke: { specialty: "Neurology", requiresICU: true },
  trauma: { specialty: "Trauma", requiresICU: true, defaultBlood: "O-" },
  burns: { specialty: "Burn Care", requiresICU: true },
  bleeding: { specialty: "Severe Bleeding", requiresICU: true, defaultBlood: "O+" },
  respiratory: { specialty: "Respiratory", requiresICU: false },
  general: { specialty: "General Emergency", requiresICU: false },
};

export const hospitalMatchingService = {
  scoreHospital(
    hospital: HospitalRecord,
    emergencyType: string,
    preferredBloodGroup = "O+"
  ): MatchScoreResult {
    let score = 0;
    const passed: string[] = [];
    const warnings: string[] = [];

    const req = EMERGENCY_REQUIREMENTS[emergencyType.toLowerCase()] || EMERGENCY_REQUIREMENTS.general;

    // 1. Specialty / Capability Match (35 pts)
    const hasSpecialty = hospital.capabilities.some(
      (c) => c.toLowerCase().includes(req.specialty.toLowerCase()) || c.toLowerCase().includes("trauma")
    );
    if (hasSpecialty) {
      score += 35;
      passed.push(`Specialist on duty: ${req.specialty}`);
    } else {
      score += 10; // general emergency fallback
      warnings.push(`No dedicated ${req.specialty} department on-site`);
    }

    // 2. ER Bed Availability (25 pts)
    const erBeds = hospital.capacity.er_beds_available;
    if (erBeds > 3) {
      score += 25;
      passed.push(`Immediate ER intake (${erBeds} open beds)`);
    } else if (erBeds > 0) {
      score += 15;
      passed.push(`Limited ER intake (${erBeds} beds available)`);
    } else {
      warnings.push("ER capacity at maximum, possible triage hold");
    }

    // 3. ICU Availability (20 pts)
    const icuBeds = hospital.capacity.icu_beds_available;
    if (icuBeds >= 2) {
      score += 20;
      passed.push(`Critical ICU beds reserved (${icuBeds} ready)`);
    } else if (icuBeds === 1) {
      score += 12;
      passed.push(`1 ICU bed open`);
    } else if (req.requiresICU) {
      warnings.push("No ICU beds currently available");
    } else {
      score += 10;
    }

    // 4. Blood Availability (10 pts)
    const bloodMatch = hospital.blood_inventory.find(
      (b) => b.blood_group === preferredBloodGroup && b.availability_status === "AVAILABLE"
    );
    if (bloodMatch) {
      score += 10;
      passed.push(`Blood bank: ${preferredBloodGroup} in stock`);
    } else {
      score += 4;
      warnings.push(`Blood group ${preferredBloodGroup} limited / verification pending`);
    }

    // 5. Travel Time / ETA (10 pts)
    const eta = hospital.etaMinutes ?? 15;
    if (eta <= 10) {
      score += 10;
      passed.push(`Rapid transit ETA: ~${eta} mins`);
    } else if (eta <= 20) {
      score += 7;
      passed.push(`Transit ETA: ~${eta} mins`);
    } else {
      score += 3;
      warnings.push(`Transit time: ~${eta} mins (consider closer triage)`);
    }

    return {
      hospital,
      totalScore: Math.min(score, 100),
      isRecommended: score >= 75,
      reasons: { passed, warnings },
      metrics: {
        capabilityMatch: hasSpecialty,
        erBedsOpen: erBeds,
        icuBedsOpen: icuBeds,
        bloodAvailable: Boolean(bloodMatch),
        etaMinutes: eta,
      },
    };
  },

  // Rank a list of hospitals and return the best match
  findBestMatch(
    hospitals: HospitalRecord[],
    emergencyType: string,
    preferredBloodGroup = "O+"
  ): { bestMatch: MatchScoreResult | null; allRanked: MatchScoreResult[] } {
    if (hospitals.length === 0) {
      return { bestMatch: null, allRanked: [] };
    }

    const scored = hospitals.map((h) =>
      this.scoreHospital(h, emergencyType, preferredBloodGroup)
    );

    // Sort by highest score first, then by lowest ETA
    scored.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return a.metrics.etaMinutes - b.metrics.etaMinutes;
    });

    return {
      bestMatch: scored[0] || null,
      allRanked: scored,
    };
  },
};
