import { HospitalRecord } from "./hospitalService";
import { UnifiedHospitalResult, VerificationClassification } from "./googlePlacesService";

export interface MatchScoreResult {
  hospital: HospitalRecord | (UnifiedHospitalResult & { capabilities: string[] });
  totalScore: number; // 0 to 100
  isRecommended: boolean;
  isEligibleForDispatch: boolean;
  verificationStatus: VerificationClassification;
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
    dataFreshnessStatus: VerificationClassification;
  };
}

// Map emergency types to required capabilities
export const EMERGENCY_REQUIREMENTS: Record<
  string,
  { specialty: string; requiresICU: boolean; defaultBlood?: string; requiredKeywords: string[] }
> = {
  cardiac: {
    specialty: "Cardiology",
    requiresICU: true,
    defaultBlood: "O+",
    requiredKeywords: ["cardiology", "cardiac", "cath lab"],
  },
  stroke: {
    specialty: "Neurology",
    requiresICU: true,
    requiredKeywords: ["neurology", "neuro", "stroke"],
  },
  trauma: {
    specialty: "Trauma",
    requiresICU: true,
    defaultBlood: "O-",
    requiredKeywords: ["trauma", "orthopedics", "surgery"],
  },
  burns: {
    specialty: "Burn Care",
    requiresICU: true,
    requiredKeywords: ["burn", "critical care", "plastic surgery"],
  },
  bleeding: {
    specialty: "Severe Bleeding",
    requiresICU: true,
    defaultBlood: "O+",
    requiredKeywords: ["bleeding", "trauma", "blood bank"],
  },
  respiratory: {
    specialty: "Respiratory",
    requiresICU: false,
    requiredKeywords: ["respiratory", "pulmonology", "ventilator"],
  },
  general: {
    specialty: "General Emergency",
    requiresICU: false,
    requiredKeywords: ["general", "emergency", "physician"],
  },
};

export const hospitalMatchingService = {
  scoreHospital(
    hospital: any,
    emergencyType: string,
    preferredBloodGroup = "O+",
    requiredResourceList?: string[]
  ): MatchScoreResult {
    let score = 0;
    const passed: string[] = [];
    const warnings: string[] = [];

    const req = EMERGENCY_REQUIREMENTS[emergencyType.toLowerCase()] || EMERGENCY_REQUIREMENTS.general;
    const verificationStatus: VerificationClassification =
      hospital.verification_status ||
      (hospital.is_verified ? "AERVA_VERIFIED_CURRENT" : "UNVERIFIED");

    // CRITICAL CLINICAL SAFETY RULE:
    // If UNVERIFIED, the hospital has no confirmed AERVA telemetry.
    // It remains discoverable, but CANNOT be recommended or confirmed capable.
    if (verificationStatus === "UNVERIFIED") {
      const eta = hospital.eta_minutes ?? hospital.etaMinutes ?? 15;
      return {
        hospital,
        totalScore: Math.min(30, Math.max(10, 40 - Math.round(eta))),
        isRecommended: false,
        isEligibleForDispatch: false,
        verificationStatus: "UNVERIFIED",
        reasons: {
          passed: ["Google Places public facility listing confirmed"],
          warnings: [
            "Unverified facility — no authorized AERVA live telemetry",
            "ER and ICU bed numbers are UNKNOWN (never fabricated)",
            "Manual phone verification required before direct admission",
          ],
        },
        metrics: {
          capabilityMatch: false,
          erBedsOpen: 0,
          icuBedsOpen: 0,
          bloodAvailable: false,
          etaMinutes: eta,
          dataFreshnessStatus: "UNVERIFIED",
        },
      };
    }

    const capabilities: string[] = hospital.capabilities || [];
    const capacity = hospital.capacity || {
      er_status: "OPEN",
      er_beds_available: 0,
      icu_beds_available: 0,
    };

    // 1. Specialty / Capability Match (30 pts)
    const hasSpecialty = capabilities.some((c: string) => {
      const lower = c.toLowerCase();
      return (
        lower.includes(req.specialty.toLowerCase()) ||
        req.requiredKeywords.some((kw) => lower.includes(kw))
      );
    });

    if (hasSpecialty) {
      score += 30;
      passed.push(`Specialist & Department Verified: ${req.specialty}`);
    } else {
      score += 10;
      warnings.push(`No dedicated ${req.specialty} department registered`);
    }

    // 2. ER Operational Status & Bed Availability (25 pts)
    const erStatus = capacity.er_status || "OPEN";
    const erBeds = capacity.er_beds_available ?? 0;

    if (erStatus === "FULL" || erStatus === "DIVERTING") {
      warnings.push(`ER intake status is ${erStatus} — triage diversion in effect`);
      score = Math.max(0, score - 20);
    } else if (erBeds >= 3) {
      score += 25;
      passed.push(`Immediate ER intake (${erBeds} open beds)`);
    } else if (erBeds > 0) {
      score += 15;
      passed.push(`Limited ER intake (${erBeds} beds available)`);
    } else {
      warnings.push("ER at zero open beds, potential triage delay");
    }

    // 3. ICU & Critical Equipment (20 pts)
    const icuBeds = capacity.icu_beds_available ?? 0;
    if (icuBeds >= 2) {
      score += 20;
      passed.push(`Critical ICU capability confirmed (${icuBeds} open)`);
    } else if (icuBeds === 1) {
      score += 12;
      passed.push(`1 ICU bed open`);
    } else if (req.requiresICU) {
      warnings.push("No ICU beds currently available on site");
    } else {
      score += 10;
    }

    // 4. Blood Inventory Match (10 pts)
    const bloodInventory = hospital.blood_inventory || [];
    const bloodMatch = bloodInventory.find(
      (b: any) =>
        b.blood_group === preferredBloodGroup &&
        (b.availability_status === "AVAILABLE" || b.status === "AVAILABLE")
    );
    if (bloodMatch) {
      score += 10;
      passed.push(`Blood bank: ${preferredBloodGroup} confirmed available`);
    } else {
      score += 3;
      warnings.push(`Blood group ${preferredBloodGroup} not in active bank stock`);
    }

    // 5. Travel Time / ETA (15 pts)
    const eta = hospital.eta_minutes ?? hospital.etaMinutes ?? 15;
    if (eta <= 10) {
      score += 15;
      passed.push(`Rapid transit: ~${eta} mins`);
    } else if (eta <= 20) {
      score += 10;
      passed.push(`Transit ETA: ~${eta} mins`);
    } else {
      score += 4;
      warnings.push(`Transit time ~${eta} mins — consider closer triage`);
    }

    // 6. Data Freshness Adjustment
    if (verificationStatus === "AERVA_VERIFIED_OUTDATED") {
      score = Math.max(0, score - 10);
      warnings.push("Hospital telemetry stale (>15 mins) — telemetry re-verification pending");
    }

    const isRecommended = score >= 70 && erBeds > 0 && erStatus === "OPEN";

    return {
      hospital,
      totalScore: Math.min(100, Math.max(0, score)),
      isRecommended,
      isEligibleForDispatch: erBeds > 0 && erStatus === "OPEN",
      verificationStatus,
      reasons: { passed, warnings },
      metrics: {
        capabilityMatch: hasSpecialty,
        erBedsOpen: erBeds,
        icuBedsOpen: icuBeds,
        bloodAvailable: Boolean(bloodMatch),
        etaMinutes: eta,
        dataFreshnessStatus: verificationStatus,
      },
    };
  },

  findBestMatch(
    hospitals: any[],
    emergencyType: string,
    preferredBloodGroup = "O+",
    requiredResourceList?: string[]
  ): { bestMatch: MatchScoreResult | null; allRanked: MatchScoreResult[] } {
    if (!hospitals || hospitals.length === 0) {
      return { bestMatch: null, allRanked: [] };
    }

    const scored = hospitals.map((h) =>
      this.scoreHospital(h, emergencyType, preferredBloodGroup, requiredResourceList)
    );

    // Sort: Verified recommended first, then highest score, then lowest ETA
    scored.sort((a, b) => {
      if (a.isRecommended !== b.isRecommended) {
        return a.isRecommended ? -1 : 1;
      }
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
