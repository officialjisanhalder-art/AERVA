import { NextRequest, NextResponse } from "next/server";
import { browserUseService } from "@/lib/services/browserUseService";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: hospitalId, taskId } = await context.params;
    if (!hospitalId || !taskId) {
      return NextResponse.json(
        { error: "Both 'id' and 'taskId' path parameters are required" },
        { status: 400 }
      );
    }

    const record = await browserUseService.getTaskStatus(hospitalId, taskId);

    return NextResponse.json(record, {
      status: 200,
      headers: {
        "X-AERVA-Service": "Browser-Use-Cloud",
        "X-AERVA-Task-Id": taskId,
        "X-AERVA-Verification-Label": record.verification_label,
        "Cache-Control": record.status === "COMPLETED" ? "public, max-age=60" : "no-store",
      },
    });
  } catch (error: any) {
    console.error("[AERVA Browser Use API] Task status check error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve research task status", details: error?.message },
      { status: 500 }
    );
  }
}
