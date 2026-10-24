import { NextRequest, NextResponse } from "next/server";

const VERIFIED_FIRST_AID_GUIDANCE: Record<string, { title: string; immediate_action: string; instructions: string[] }> = {
  cardiac: {
    title: "Cardiac Emergency Protocol",
    immediate_action: "Keep the patient calm, seated upright. Check responsiveness and normal breathing.",
    instructions: [
      "Call emergency ambulance immediately if not yet dispatched.",
      "If unresponsive and not breathing normally, begin Hands-Only CPR: push hard and fast in the center of the chest (100-120 bpm).",
      "If an AED (automated external defibrillator) is nearby, turn it on and follow verbal prompts.",
      "Do not give food or drink while awaiting paramedic crew.",
    ],
  },
  stroke: {
    title: "Acute Stroke FAST Protocol",
    immediate_action: "Note the exact time symptoms started. Time is brain cells.",
    instructions: [
      "Check FAST: Face drooping, Arm weakness, Speech difficulty, Time to call emergency.",
      "Position the patient safely on their side if vomiting or unconscious, keeping airways open.",
      "Do NOT administer aspirin or blood thinners until hospital CT scan rules out intracranial hemorrhage.",
      "Keep patient resting flat or slightly elevated.",
    ],
  },
  trauma: {
    title: "Trauma & Heavy Bleeding Protocol",
    immediate_action: "Apply continuous firm pressure to external bleeding sites with clean dressing.",
    instructions: [
      "If a limb has catastrophic arterial bleeding, apply an approved tourniquet 2-3 inches above the wound.",
      "Do not remove embedded objects; stabilize them in place.",
      "Keep the patient warm to prevent traumatic shock.",
      "Avoid unnecessary movement of neck or spinal column.",
    ],
  },
  burns: {
    title: "Thermal Burn First Aid",
    immediate_action: "Cool the burn immediately with cool running tap water for 10-20 minutes.",
    instructions: [
      "Do not use ice, iced water, or greasy ointments/butter.",
      "Gently remove tight clothing or jewelry before swelling starts; do not pull adhered fabric.",
      "Cover loosely with sterile, non-adherent dressing or clean plastic film.",
      "Protect from hypothermia, especially in large surface area burns.",
    ],
  },
  respiratory: {
    title: "Acute Respiratory Distress Protocol",
    immediate_action: "Help patient sit upright to ease chest expansion. Loosen tight neck clothing.",
    instructions: [
      "Assist patient with their prescribed rescue inhaler or nebulizer if available.",
      "Ensure adequate fresh air flow; avoid crowded surroundings.",
      "Monitor for blue discoloration around lips or fingernails (cyanosis).",
      "Stay calm; reassure the patient to prevent hyperventilation panic.",
    ],
  },
  general: {
    title: "General Emergency Triage Guidance",
    immediate_action: "Assess responsiveness, open airway, and observe chest rise for breathing.",
    instructions: [
      "Keep patient in a safe, quiet location away from environmental hazards.",
      "Do not leave the patient unattended while awaiting ambulance arrival.",
      "Gather medical passport, chronic disease history, or current medications for receiving doctors.",
    ],
  },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || searchParams.get("q") || "general").toLowerCase();

    const guidance = VERIFIED_FIRST_AID_GUIDANCE[type] || VERIFIED_FIRST_AID_GUIDANCE.general;

    return NextResponse.json({
      success: true,
      emergency_type: type,
      title: guidance.title,
      immediate_action: guidance.immediate_action,
      instructions: guidance.instructions,
      summary: guidance.immediate_action,
      disclaimer: "AERVA Clinical Guidance Protocol — Verified Pre-arrival Triage Instructions.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to retrieve guidance", details: err?.message },
      { status: 500 }
    );
  }
}
