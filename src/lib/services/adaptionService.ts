/**
 * AERVA — ADAPTION LABS INTEGRATION SERVICE
 * Official docs: https://docs.adaptionlabs.ai/
 * Manages dataset adaptation, multilingual emergency benchmarks, and Nodus accuracy evaluation.
 */

import fs from "fs";
import path from "path";
import { supabase, isSupabaseConfigured } from "../supabase/client";

export interface EmergencyDatasetSample {
  id: string;
  source?: string;
  language: "en" | "hi" | "hinglish";
  dialect_style?: string;
  description: string;
  reported_situation: string;
  reported_symptoms: string[];
  possible_care_requirements: string[];
  hospital_facility_categories: string[];
}

export interface AdaptionReportData {
  run_timestamp: string;
  adaption_run_id: string;
  api_execution_status: string;
  api_metadata: any;
  original_dataset_metrics: {
    sample_count: number;
    total_words: number;
    unique_vocabulary: number;
    type_token_ratio: number;
    language_distribution: Record<string, number>;
  };
  adapted_dataset_metrics: {
    sample_count: number;
    total_words: number;
    unique_vocabulary: number;
    type_token_ratio: number;
    language_distribution: Record<string, number>;
  };
  nodus_benchmark_comparison: {
    original_set: {
      total_evaluated: number;
      correct_identifications: number;
      facility_routing_accuracy_pct: number;
      avg_symptoms_captured: number;
    };
    adapted_set: {
      total_evaluated: number;
      correct_identifications: number;
      facility_routing_accuracy_pct: number;
      avg_symptoms_captured: number;
    };
    delta_accuracy_pct: number;
  };
  linguistic_improvements: string[];
}

export class AdaptionService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ADAPTION_API_KEY || "";
    this.baseUrl = (process.env.ADAPTION_BASE_URL || "https://api.adaptionlabs.ai/api/v1").replace(/\/$/, "");
  }

  /**
   * Retrieves the current Adaption run report & metrics
   */
  getLatestReport(): AdaptionReportData | null {
    try {
      const reportPath = path.join(process.cwd(), "data", "adaption_run_report.json");
      if (fs.existsSync(reportPath)) {
        const raw = fs.readFileSync(reportPath, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("[AdaptionService] Could not read report file:", e);
    }
    return null;
  }

  /**
   * Retrieves the original synthetic dataset v1
   */
  getOriginalDataset(): EmergencyDatasetSample[] {
    try {
      const p = path.join(process.cwd(), "data", "synthetic_emergency_dataset_v1.json");
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, "utf-8"));
      }
    } catch (e) {
      console.warn("[AdaptionService] Could not read original dataset:", e);
    }
    return [];
  }

  /**
   * Retrieves the adapted multilingual dataset v2
   */
  getAdaptedDataset(): EmergencyDatasetSample[] {
    try {
      const p = path.join(process.cwd(), "data", "synthetic_emergency_dataset_v2_adapted.json");
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, "utf-8"));
      }
    } catch (e) {
      console.warn("[AdaptionService] Could not read adapted dataset:", e);
    }
    return [];
  }

  /**
   * Evaluates extraction accuracy against human-reviewed expected outputs
   */
  evaluateExtraction(
    description: string,
    extractedRequirements: string[],
    expectedCategories: string[]
  ): {
    matched: boolean;
    confidence_score: number;
    overlap: string[];
  } {
    const extractedLower = extractedRequirements.map((r) => r.toLowerCase());
    const expectedLower = expectedCategories.map((c) => c.toLowerCase());

    const overlap = expectedLower.filter((exp) =>
      extractedLower.some((ext) => ext.includes(exp) || exp.includes(ext))
    );

    const matched = overlap.length > 0;
    const score = expectedCategories.length > 0
      ? Math.round((overlap.length / expectedCategories.length) * 100)
      : 0;

    return {
      matched,
      confidence_score: score,
      overlap,
    };
  }
}

export const adaptionService = new AdaptionService();
