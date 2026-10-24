import { NextRequest, NextResponse } from "next/server";
import { adaptionService } from "@/lib/services/adaptionService";

export async function GET(req: NextRequest) {
  try {
    const report = adaptionService.getLatestReport();
    const original = adaptionService.getOriginalDataset();
    const adapted = adaptionService.getAdaptedDataset();

    return NextResponse.json({
      success: true,
      service: "Adaption Labs Adaptive Data Optimizer",
      documentation: "https://docs.adaptionlabs.ai/",
      report: report || null,
      dataset_summary: {
        original_samples_count: original.length,
        adapted_samples_count: adapted.length,
        languages_covered: ["English", "Hindi (Devanagari)", "Hinglish (Colloquial)"],
        multilingual_expansion_pct: original.length > 0
          ? Math.round(((adapted.length - original.length) / original.length) * 100)
          : 0,
      },
      original_samples: original,
      adapted_samples: adapted,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to retrieve Adaption report" },
      { status: 500 }
    );
  }
}
