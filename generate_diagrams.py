import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

# Create diagrams directory
os.makedirs("diagrams", exist_ok=True)

# Common styling constants
NAVY = "#0A2540"
BLUE = "#0052FF"
CYAN = "#00B2FF"
DARK_SLATE = "#1E293B"
LIGHT_BG = "#F8FAFC"
WHITE = "#FFFFFF"
AMBER = "#D97706"
GREEN = "#059669"
BORDER_GRAY = "#CBD5E1"

plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['font.family'] = 'sans-serif'

# -------------------------------------------------------------
# DIAGRAM 1: Overall Ecosystem Architecture
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
ax.set_facecolor(LIGHT_BG)
ax.set_xlim(0, 10)
ax.set_ylim(0, 7)
ax.axis('off')

plt.title("NearER Overall System & Ecosystem Architecture", fontsize=14, fontweight='bold', color=NAVY, pad=15)

# Central Core
rect = patches.FancyBboxPatch((3.5, 2.5), 3.0, 2.0, boxstyle="round,pad=0.2", facecolor=NAVY, edgecolor=CYAN, linewidth=2)
ax.add_patch(rect)
ax.text(5.0, 3.7, "NearER Core Backend\n& Realtime Server", color=WHITE, weight='bold', fontsize=11, ha='center', va='center')
ax.text(5.0, 2.9, "Supabase DB • Realtime Engine\nMaps API • Auth Services", color=CYAN, fontsize=8, ha='center', va='center')

# Satellite Nodes
nodes = [
    (1.2, 5.2, "Patient App / Web\n(Intake, SOS, Tracking)", BLUE),
    (5.0, 5.8, "Hospital ER Dashboard\n(Bed Status, Pre-Arrival)", DARK_SLATE),
    (8.8, 5.2, "Ambulance Driver App\n(GPS Navigation, ETA)", BLUE),
    (1.2, 1.2, "NGO Control Booth\n(Manual Intake & Escort)", AMBER),
    (5.0, 0.6, "Decision Matching Engine\n(Capability & Bed Gating)", GREEN),
    (8.8, 1.2, "Admin & Analytics Desk\n(KPIs & Service Audit)", DARK_SLATE),
]

for x, y, label, col in nodes:
    box = patches.FancyBboxPatch((x-1.3, y-0.5), 2.6, 1.0, boxstyle="round,pad=0.1", facecolor=WHITE, edgecolor=col, linewidth=2)
    ax.add_patch(box)
    ax.text(x, y, label, color=NAVY, weight='bold', fontsize=9, ha='center', va='center')

# Connection Lines
connections = [(2.5, 5.0, 3.6, 4.3), (5.0, 5.2, 5.0, 4.6), (7.5, 5.0, 6.4, 4.3),
               (2.5, 1.5, 3.7, 2.6), (5.0, 1.2, 5.0, 2.4), (7.5, 1.5, 6.3, 2.6)]

for x1, y1, x2, y2 in connections:
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="<->", color=BLUE, lw=1.5, ls="--"))

plt.tight_layout()
plt.savefig("diagrams/diagram_1_ecosystem_architecture.png", dpi=300)
plt.close()

# -------------------------------------------------------------
# DIAGRAM 2: End-to-End Emergency Workflow
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 7.5), dpi=300)
ax.set_facecolor(LIGHT_BG)
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')

plt.title("NearER End-to-End Emergency Lifecycle Workflow", fontsize=14, fontweight='bold', color=NAVY, pad=15)

steps = [
    "1. Emergency Event / Patient SOS",
    "2. GPS & Locality Detection",
    "3. Clinical Category & Voice Brief",
    "4. NearER Decision Engine Search",
    "5. Resource & Bed Capacity Gate",
    "6. Travel Time & Traffic Check",
    "7. Optimal Hospital Candidate Match",
    "8. Pre-Arrival Alert to Hospital Desk",
    "9. Hospital Accepts / Reserves Bed",
    "10. Transport Dispatch (Ambulance/Self)",
    "11. Live Transit Telemetry & Radar",
    "12. Green Corridor Traffic Clearance",
    "13. Direct Triage Admission at ER",
    "14. Case Resolution & Feedback Log"
]

for i, step in enumerate(steps):
    col = 0 if i < 7 else 1
    row = 6 - (i % 7)
    x = 1.8 if col == 0 else 7.2
    y = row * 1.3 + 0.8
    
    bg = NAVY if i in [0, 6, 8, 12, 13] else WHITE
    tc = WHITE if i in [0, 6, 8, 12, 13] else NAVY
    ec = BLUE if i in [0, 6, 8, 12, 13] else BORDER_GRAY
    
    box = patches.FancyBboxPatch((x-1.6, y-0.45), 3.2, 0.9, boxstyle="round,pad=0.1", facecolor=bg, edgecolor=ec, linewidth=1.5)
    ax.add_patch(box)
    ax.text(x, y, step, color=tc, weight='bold', fontsize=8.5, ha='center', va='center')
    
    # Arrows
    if i < 6:
        ax.annotate("", xy=(x, y - 0.5), xytext=(x, y - 0.85), arrowprops=dict(arrowstyle="->", color=BLUE, lw=1.5))
    elif i == 6:
        ax.annotate("", xy=(7.2, y), xytext=(x + 1.6, y), arrowprops=dict(arrowstyle="->", color=AMBER, lw=2))
    elif i > 6 and i < 13:
        ax.annotate("", xy=(x, y - 0.5), xytext=(x, y - 0.85), arrowprops=dict(arrowstyle="->", color=BLUE, lw=1.5))

plt.tight_layout()
plt.savefig("diagrams/diagram_2_emergency_workflow.png", dpi=300)
plt.close()

# -------------------------------------------------------------
# DIAGRAM 3: Emergency Decision Engine Flowchart
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
ax.set_facecolor(LIGHT_BG)
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')

plt.title("NearER Emergency Decision Engine Logic & Scoring Pipeline", fontsize=14, fontweight='bold', color=NAVY, pad=15)

de_steps = [
    ("Step 1: Geofenced Retrieval", "Fetch candidate hospitals within 30km radius"),
    ("Step 2: Specialty Capability Filter", "HARD GATE: Exclude hospitals lacking required specialty"),
    ("Step 3: Live Bed & ICU Check", "HARD GATE: Exclude hospitals with ER Beds = 0"),
    ("Step 4: Data Freshness Audit", "Flag & penalty for unverified capacity > 30 mins"),
    ("Step 5: Multi-Factor Scoring", "Score = Capability + Beds + Readiness - TravelDelay - Queue"),
    ("Step 6: Rank & Candidate Selection", "Identify Primary Match + Backup Alternatives"),
    ("Step 7: Pre-Arrival Case Offer", "Transmit alert to Primary Hospital ER Desk"),
    ("Step 8: Hospital Confirm / Decline", "If Accepted -> Lock; If Declined -> Push Backup"),
    ("Step 9: Real-time Telemetry Monitor", "Track transit ETA and ER bed stability"),
    ("Step 10: Dynamic Reroute Trigger", "If Primary capacity drops to 0 -> Reroute Alert")
]

for i, (heading, desc) in enumerate(de_steps):
    y = 9.0 - i * 0.88
    bg = NAVY if i in [1, 2, 4, 7, 9] else WHITE
    tc = WHITE if i in [1, 2, 4, 7, 9] else NAVY
    ec = CYAN if i in [1, 2] else (AMBER if i in [4, 9] else BLUE)
    
    box = patches.FancyBboxPatch((1.5, y-0.35), 7.0, 0.7, boxstyle="round,pad=0.1", facecolor=bg, edgecolor=ec, linewidth=1.5)
    ax.add_patch(box)
    ax.text(2.0, y+0.1, heading, color=tc, weight='bold', fontsize=9.5, ha='left', va='center')
    ax.text(2.0, y-0.12, desc, color=CYAN if tc==WHITE else DARK_SLATE, fontsize=8, ha='left', va='center')
    
    if i < 9:
        ax.annotate("", xy=(5.0, y - 0.4), xytext=(5.0, y - 0.53), arrowprops=dict(arrowstyle="->", color=BLUE, lw=1.5))

plt.tight_layout()
plt.savefig("diagrams/diagram_3_decision_engine_flowchart.png", dpi=300)
plt.close()

# -------------------------------------------------------------
# DIAGRAM 4: Role of NGO in NearER Ecosystem
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 7), dpi=300)
ax.set_facecolor(LIGHT_BG)
ax.set_xlim(0, 10)
ax.set_ylim(0, 7)
ax.axis('off')

plt.title("Multi-Branch Role of NGO Partners in NearER Ecosystem", fontsize=14, fontweight='bold', color=NAVY, pad=15)

# Central Node
rect = patches.FancyBboxPatch((3.5, 2.7), 3.0, 1.6, boxstyle="round,pad=0.2", facecolor=NAVY, edgecolor=AMBER, linewidth=2.5)
ax.add_patch(rect)
ax.text(5.0, 3.6, "NGO PARTNER", color=WHITE, weight='bold', fontsize=12, ha='center', va='center')
ax.text(5.0, 3.0, "Community Outreach, Awareness\n& Control Booth Operations", color=AMBER, fontsize=8.5, ha='center', va='center')

ngo_roles = [
    (1.2, 5.8, "1. Community Awareness\n& Educational Campaigns"),
    (5.0, 6.2, "2. School/College & Society\nPreparedness Workshops"),
    (8.8, 5.8, "3. NGO Emergency Control\nBooth Facilities Operation"),
    (1.2, 3.5, "4. Hospital Network\nIntroductions & Onboarding"),
    (8.8, 3.5, "5. Local Fleet & Ambulance\nNetwork Mobilization"),
    (1.2, 1.2, "6. Volunteer Recruitment\n& Operator Staffing"),
    (5.0, 0.8, "7. Elderly & Non-Digital\nCitizen Assistance"),
    (8.8, 1.2, "8. Field Feedback &\nService Gap Audit Log")
]

for x, y, label in ngo_roles:
    box = patches.FancyBboxPatch((x-1.3, y-0.45), 2.6, 0.9, boxstyle="round,pad=0.1", facecolor=WHITE, edgecolor=BLUE, linewidth=1.5)
    ax.add_patch(box)
    ax.text(x, y, label, color=NAVY, weight='bold', fontsize=8, ha='center', va='center')
    
    ax.annotate("", xy=(x, y), xytext=(5.0, 3.5),
                arrowprops=dict(arrowstyle="<-", color=BLUE, lw=1.2, ls="--"))

plt.tight_layout()
plt.savefig("diagrams/diagram_4_ngo_role_diagram.png", dpi=300)
plt.close()

# -------------------------------------------------------------
# DIAGRAM 5: Awareness & Promotion Cycle
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 6.5), dpi=300)
ax.set_facecolor(LIGHT_BG)
ax.set_xlim(0, 10)
ax.set_ylim(0, 7)
ax.axis('off')

plt.title("NGO Community Emergency Awareness Cycle", fontsize=14, fontweight='bold', color=NAVY, pad=15)

cycle_steps = [
    (5.0, 6.0, "1. Community Identification\n(Target Societies, Camps, Clubs)"),
    (8.5, 4.5, "2. Awareness Campaign\n(Posters, Flyers, Media)"),
    (8.0, 1.8, "3. NearER Demonstration\n(Live Emergency Flow Demo)"),
    (5.0, 0.8, "4. Registration & Profile Pre-fill\n(Blood group, Allergies, Kin)"),
    (2.0, 1.8, "5. Emergency Preparedness\n(When to use / When NOT to)"),
    (1.5, 4.5, "6. Community Feedback &\nAudit Incident Log")
]

for x, y, label in cycle_steps:
    box = patches.FancyBboxPatch((x-1.4, y-0.45), 2.8, 0.9, boxstyle="round,pad=0.1", facecolor=NAVY, edgecolor=CYAN, linewidth=1.5)
    ax.add_patch(box)
    ax.text(x, y, label, color=WHITE, weight='bold', fontsize=8, ha='center', va='center')

arrows = [
    (6.3, 5.8, 7.3, 4.9),
    (8.4, 3.9, 8.1, 2.4),
    (6.7, 1.3, 6.3, 1.0),
    (3.7, 0.9, 3.3, 1.3),
    (1.7, 2.4, 1.6, 3.9),
    (2.7, 5.0, 3.7, 5.7)
]

for x1, y1, x2, y2 in arrows:
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="->", color=BLUE, lw=2, mutation_scale=15))

plt.tight_layout()
plt.savefig("diagrams/diagram_5_awareness_cycle.png", dpi=300)
plt.close()

# -------------------------------------------------------------
# DIAGRAM 6: Control Booth Incident Operations Workflow
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
ax.set_facecolor(LIGHT_BG)
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')

plt.title("NGO NearER Control Booth Incident Operations Workflow", fontsize=14, fontweight='bold', color=NAVY, pad=15)

cb_steps = [
    "1. Call / Distress Walk-in Received",
    "2. Operator Confirms Caller & Location",
    "3. Capture Triage Data (Voice/Text)",
    "4. Operator Initiates NearER Case",
    "5. Decision Engine Recommends ER",
    "6. Verify Destination Capacity Desk",
    "7. Confirm Hospital Accepts Patient",
    "8. Assign & Coordinate Fleet Ambulance",
    "9. Share Admission Pass & Route",
    "10. Monitor Transit Radar Telemetry",
    "11. Escalate Delays if Capacity Drops",
    "12. Confirm Arrival at Hospital Desk",
    "13. Case Closure & Log Incident Data"
]

for i, step in enumerate(cb_steps):
    y = 9.1 - i * 0.67
    bg = AMBER if i in [0, 5, 10, 12] else (NAVY if i in [3, 4, 6, 7] else WHITE)
    tc = WHITE if bg != WHITE else NAVY
    ec = BLUE if bg == WHITE else CYAN
    
    box = patches.FancyBboxPatch((1.8, y-0.27), 6.4, 0.54, boxstyle="round,pad=0.08", facecolor=bg, edgecolor=ec, linewidth=1.2)
    ax.add_patch(box)
    ax.text(5.0, y, step, color=tc, weight='bold', fontsize=8.5, ha='center', va='center')
    
    if i < 12:
        ax.annotate("", xy=(5.0, y - 0.28), xytext=(5.0, y - 0.39), arrowprops=dict(arrowstyle="->", color=BLUE, lw=1.2))

plt.tight_layout()
plt.savefig("diagrams/diagram_6_control_booth_workflow.png", dpi=300)
plt.close()

# -------------------------------------------------------------
# DIAGRAM 7: Control Booth Escalation Hierarchy
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 6), dpi=300)
ax.set_facecolor(LIGHT_BG)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6)
ax.axis('off')

plt.title("Control Booth Incident Escalation Hierarchy", fontsize=14, fontweight='bold', color=NAVY, pad=15)

tiers = [
    ("Tier 5: Statutory Emergency Services (108 / 112 / Police)", AMBER, 8.6, 5.0),
    ("Tier 4: Hospital CMO & Ambulance Liaison Officer", DARK_SLATE, 7.2, 4.0),
    ("Tier 3: NearER Technical & Cloud Operations Team", NAVY, 5.8, 3.0),
    ("Tier 2: NGO Control Booth Supervisor", BLUE, 4.4, 2.0),
    ("Tier 1: Frontline Volunteer Operator", WHITE, 3.0, 1.0),
]

for title, bg, width, y in tiers:
    tc = NAVY if bg == WHITE else WHITE
    box = patches.FancyBboxPatch((5.0 - width/2, y-0.35), width, 0.7, boxstyle="round,pad=0.1", facecolor=bg, edgecolor=NAVY, linewidth=1.5)
    ax.add_patch(box)
    ax.text(5.0, y, title, color=tc, weight='bold', fontsize=9, ha='center', va='center')
    
    if y > 1.0:
        ax.annotate("", xy=(5.0, y + 0.35), xytext=(5.0, y + 0.65), arrowprops=dict(arrowstyle="<-", color=BLUE, lw=1.5))

plt.tight_layout()
plt.savefig("diagrams/diagram_7_escalation_hierarchy.png", dpi=300)
plt.close()

# -------------------------------------------------------------
# DIAGRAM 8: Pilot Implementation Timeline
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
ax.set_facecolor(LIGHT_BG)
ax.set_xlim(0, 10)
ax.set_ylim(0, 9)
ax.axis('off')

plt.title("NearER 8-Phase Pilot Implementation Timeline (Months 1-6)", fontsize=14, fontweight='bold', color=NAVY, pad=15)

phases = [
    ("Phase 1: Institutional Partner Onboarding", 0.5, 2.0, 8.0, BLUE),
    ("Phase 2: Hospital Capacity & Map Integration", 1.5, 2.5, 7.0, DARK_SLATE),
    ("Phase 3: Volunteer Recruitment & Training", 2.0, 3.5, 6.0, NAVY),
    ("Phase 4: Control Booth Infrastructure Setup", 3.0, 4.0, 5.0, AMBER),
    ("Phase 5: Dry-Run Simulations & Audits", 3.5, 4.5, 4.0, GREEN),
    ("Phase 6: Public Awareness & Registration Drive", 4.0, 5.5, 3.0, BLUE),
    ("Phase 7: Live Pilot Operation & Incident Tracking", 4.5, 6.0, 2.0, NAVY),
    ("Phase 8: Pilot Evaluation & Expansion Plan", 5.5, 6.0, 1.0, DARK_SLATE),
]

for title, start, end, y, col in phases:
    ax.text(0.2, y, title, color=NAVY, weight='bold', fontsize=8.5, ha='left', va='center')
    rect = patches.FancyBboxPatch((4.2 + start*0.9, y-0.25), (end-start)*0.9, 0.5, boxstyle="round,pad=0.05", facecolor=col, edgecolor=NAVY, linewidth=1)
    ax.add_patch(rect)
    ax.text(4.2 + (start+(end-start)/2)*0.9, y, f"M{start:.1f}-M{end:.1f}", color=WHITE, weight='bold', fontsize=7.5, ha='center', va='center')

# Month Axis
ax.plot([4.2, 9.6], [0.3, 0.3], color=NAVY, lw=2)
for m in range(1, 7):
    x = 4.2 + (m-1)*0.9
    ax.plot([x, x], [0.2, 0.4], color=NAVY, lw=1.5)
    ax.text(x, -0.1, f"Month {m}", color=NAVY, weight='bold', fontsize=8, ha='center')

plt.tight_layout()
plt.savefig("diagrams/diagram_8_pilot_timeline.png", dpi=300)
plt.close()

# -------------------------------------------------------------
# DIAGRAM 9: Long-Term Expansion Roadmap
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 4.5), dpi=300)
ax.set_facecolor(LIGHT_BG)
ax.set_xlim(0, 10)
ax.set_ylim(0, 5)
ax.axis('off')

plt.title("NearER Scalable Long-Term Expansion Roadmap", fontsize=14, fontweight='bold', color=NAVY, pad=15)

stages = [
    ("Stage 1: Local Pilot", "3-5 Hospitals\n1-3 Booths\n10-20 Volunteers", BLUE, 1.0),
    ("Stage 2: City Network", "15-20 Hospitals\n5-10 Booths\nFull City Coverage", DARK_SLATE, 3.0),
    ("Stage 3: District Scale", "District-wide Hospital\n& Fleet Integration", NAVY, 5.0),
    ("Stage 4: State Network", "State Health Dept.\n& 108/112 Sync", GREEN, 7.0),
    ("Stage 5: Multi-State", "National Emergency\nGrid Integration", AMBER, 9.0)
]

for title, desc, col, x in stages:
    box = patches.FancyBboxPatch((x-0.85, 2.0-0.7), 1.7, 1.4, boxstyle="round,pad=0.1", facecolor=col, edgecolor=NAVY, linewidth=1.5)
    ax.add_patch(box)
    ax.text(x, 2.3, title, color=WHITE, weight='bold', fontsize=8.5, ha='center', va='center')
    ax.text(x, 1.7, desc, color=WHITE if col!=WHITE else NAVY, fontsize=7.5, ha='center', va='center')
    
    if x < 9.0:
        ax.annotate("", xy=(x + 1.1, 2.0), xytext=(x + 0.85, 2.0), arrowprops=dict(arrowstyle="->", color=BLUE, lw=2.5))

plt.tight_layout()
plt.savefig("diagrams/diagram_9_expansion_roadmap.png", dpi=300)
plt.close()

print("All 9 diagrams generated successfully in diagrams/ directory!")
