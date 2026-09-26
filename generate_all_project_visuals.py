import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs(r"d:\NearER\portfolio_assets", exist_ok=True)

# Common styling for light mode diagrams
BG_COLOR = '#FFFFFF'
BORDER_COLOR = '#E2E8F0'
HEADER_BG = '#F1F5F9'

def save_fig(fig, filename):
    plt.tight_layout()
    plt.savefig(os.path.join(r"d:\NearER\portfolio_assets", filename), bbox_inches='tight', facecolor=BG_COLOR, dpi=300)
    plt.close()

# 1. NearER Visual
def create_nearer_visual():
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    # Title bar
    hdr = patches.FancyBboxPatch((0.2, 3.7), 7.6, 0.6, boxstyle="round,pad=0.08", fc='#0A2540', ec='#0052FF', lw=1.5)
    ax.add_patch(hdr)
    ax.text(4.0, 4.0, "NearER — Emergency Healthcare & Decision Engine Platform", color='white', weight='bold', fontsize=11, ha='center', va='center')
    
    # 4 Portals (Light Theme Cards)
    cards = [
        ("Patient App\n(SOS / GPS Intake)", 0.6, 2.3, '#0052FF', '#EFF6FF'),
        ("Ambulance App\n(GPS & ETA)", 2.4, 2.3, '#0284C7', '#F0F9FF'),
        ("Hospital Portal\n(Live Bed/ICU)", 4.2, 2.3, '#059669', '#ECFDF5'),
        ("Control Booth\n(Operator SOP)", 6.0, 2.3, '#D97706', '#FFFBEB')
    ]
    for title, x, y, border_col, bg_col in cards:
        box = patches.FancyBboxPatch((x, y), 1.4, 1.0, boxstyle="round,pad=0.05", fc=bg_col, ec=border_col, lw=1.5)
        ax.add_patch(box)
        ax.text(x+0.7, y+0.5, title, color='#0F172A', weight='bold', fontsize=8, ha='center', va='center')
    
    # Decision Engine Banner
    engine_box = patches.FancyBboxPatch((1.0, 0.4), 6.0, 1.2, boxstyle="round,pad=0.08", fc='#F8FAFC', ec='#0052FF', lw=1.5)
    ax.add_patch(engine_box)
    ax.text(4.0, 1.2, "Multi-Criteria Decision Engine Algorithm", color='#0A2540', weight='bold', fontsize=10, ha='center', va='center')
    ax.text(4.0, 0.8, "Suitability = ER Beds + ICU + Ventilators + Specialists + Blood - Travel ETA - Load", color='#475569', fontsize=7.5, ha='center', va='center')
    ax.text(4.0, 0.5, "Result: Nearest Suitable & Available Hospital Routing", color='#059669', weight='bold', fontsize=8, ha='center', va='center')

    save_fig(fig, "visual_nearer.png")
    print("Created visual_nearer.png")

# 2. CarePulse Visual
def create_carepulse_visual():
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    hdr = patches.FancyBboxPatch((0.2, 3.7), 7.6, 0.6, boxstyle="round,pad=0.08", fc='#0284C7', ec='#0284C7', lw=1.5)
    ax.add_patch(hdr)
    ax.text(4.0, 4.0, "CarePulse — Telehealth & Remote Patient Monitoring Suite", color='white', weight='bold', fontsize=11, ha='center', va='center')
    
    # Components
    boxes = [
        ("WebRTC Video Consult", 0.5, 2.0, "HD Encrypted Doctor Video Call"),
        ("AI Symptom Triage", 2.4, 2.0, "Automated Patient Intake & Risk Assessment"),
        ("Digital EHR & Rx", 4.3, 2.0, "E-Prescriptions & Clinical Notes"),
        ("IoT Vitals Monitor", 6.2, 2.0, "Real-time SpO2, HR & BP Telemetry")
    ]
    for title, x, y, desc in boxes:
        box = patches.FancyBboxPatch((x, y), 1.4, 1.3, boxstyle="round,pad=0.05", fc='#F0F9FF', ec='#0284C7', lw=1.2)
        ax.add_patch(box)
        ax.text(x+0.7, y+0.9, title, color='#0369A1', weight='bold', fontsize=8.5, ha='center', va='center')
        ax.text(x+0.7, y+0.4, desc, color='#334155', fontsize=7, ha='center', va='center', wrap=True)
        
    save_fig(fig, "visual_carepulse.png")
    print("Created visual_carepulse.png")

# 3. FleetPulse Visual
def create_fleetpulse_visual():
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    hdr = patches.FancyBboxPatch((0.2, 3.7), 7.6, 0.6, boxstyle="round,pad=0.08", fc='#059669', ec='#059669', lw=1.5)
    ax.add_patch(hdr)
    ax.text(4.0, 4.0, "FleetPulse — Real-Time Fleet Tracking & Dispatch Engine", color='white', weight='bold', fontsize=11, ha='center', va='center')
    
    boxes = [
        ("Live Telemetry Streaming", 0.5, 2.0, "WebSocket GPS Updates Every 2s"),
        ("Geofence Alerts", 2.4, 2.0, "Automated Entry/Exit Notifications"),
        ("Dynamic Route Engine", 4.3, 2.0, "Reduces Fuel Overhead by 18%"),
        ("Driver Mobile Dispatch", 6.2, 2.0, "Flutter App Turn-by-Turn Jobs")
    ]
    for title, x, y, desc in boxes:
        box = patches.FancyBboxPatch((x, y), 1.4, 1.3, boxstyle="round,pad=0.05", fc='#ECFDF5', ec='#059669', lw=1.2)
        ax.add_patch(box)
        ax.text(x+0.7, y+0.9, title, color='#047857', weight='bold', fontsize=8.5, ha='center', va='center')
        ax.text(x+0.7, y+0.4, desc, color='#334155', fontsize=7, ha='center', va='center', wrap=True)
        
    save_fig(fig, "visual_fleetpulse.png")
    print("Created visual_fleetpulse.png")

# 4. SmartDash Visual
def create_smartdash_visual():
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    hdr = patches.FancyBboxPatch((0.2, 3.7), 7.6, 0.6, boxstyle="round,pad=0.08", fc='#4F46E5', ec='#4F46E5', lw=1.5)
    ax.add_patch(hdr)
    ax.text(4.0, 4.0, "SmartDash — Enterprise SaaS Analytics & Revenue System", color='white', weight='bold', fontsize=11, ha='center', va='center')
    
    boxes = [
        ("Drag-and-Drop UI", 0.5, 2.0, "Customizable Widget Layouts"),
        ("Revenue & Churn Charts", 2.4, 2.0, "Recharts Interactive Graphs"),
        ("Role-Based Security", 4.3, 2.0, "Granular RBAC User Permissions"),
        ("Export Engine", 6.2, 2.0, "Automated PDF & Excel Reporting")
    ]
    for title, x, y, desc in boxes:
        box = patches.FancyBboxPatch((x, y), 1.4, 1.3, boxstyle="round,pad=0.05", fc='#EEF2FF', ec='#4F46E5', lw=1.2)
        ax.add_patch(box)
        ax.text(x+0.7, y+0.9, title, color='#4338CA', weight='bold', fontsize=8.5, ha='center', va='center')
        ax.text(x+0.7, y+0.4, desc, color='#334155', fontsize=7, ha='center', va='center', wrap=True)
        
    save_fig(fig, "visual_smartdash.png")
    print("Created visual_smartdash.png")

# 5. EduFlow Visual
def create_eduflow_visual():
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    hdr = patches.FancyBboxPatch((0.2, 3.7), 7.6, 0.6, boxstyle="round,pad=0.08", fc='#D97706', ec='#D97706', lw=1.5)
    ax.add_patch(hdr)
    ax.text(4.0, 4.0, "EduFlow — AI Learning Platform & Skill Assessment LMS", color='white', weight='bold', fontsize=11, ha='center', va='center')
    
    boxes = [
        ("AI Course Generator", 0.5, 2.0, "Automated Curriculum & Quiz Creation"),
        ("Interactive Video LMS", 2.4, 2.0, "Progress Tracking & Video Lectures"),
        ("Live Proctored Exams", 4.3, 2.0, "Browser Lock & AI Suspicion Detection"),
        ("Digital Certificates", 6.2, 2.0, "Verifiable QR Code Completion Badges")
    ]
    for title, x, y, desc in boxes:
        box = patches.FancyBboxPatch((x, y), 1.4, 1.3, boxstyle="round,pad=0.05", fc='#FFFBEB', ec='#D97706', lw=1.2)
        ax.add_patch(box)
        ax.text(x+0.7, y+0.9, title, color='#B45309', weight='bold', fontsize=8.5, ha='center', va='center')
        ax.text(x+0.7, y+0.4, desc, color='#334155', fontsize=7, ha='center', va='center', wrap=True)
        
    save_fig(fig, "visual_eduflow.png")
    print("Created visual_eduflow.png")

# 6. FoodExpress Visual
def create_foodexpress_visual():
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    hdr = patches.FancyBboxPatch((0.2, 3.7), 7.6, 0.6, boxstyle="round,pad=0.08", fc='#E11D48', ec='#E11D48', lw=1.5)
    ax.add_patch(hdr)
    ax.text(4.0, 4.0, "FoodExpress — Multi-Vendor Delivery Ecosystem", color='white', weight='bold', fontsize=11, ha='center', va='center')
    
    boxes = [
        ("Customer Ordering App", 0.5, 2.0, "Real-time Cart & Payment Gateway"),
        ("Restaurant Admin Portal", 2.4, 2.0, "Live Order Management & Menu Builder"),
        ("Driver Delivery App", 4.3, 2.0, "GPS Navigation & Earnings Dashboard"),
        ("Split Payment Payouts", 6.2, 2.0, "Automated Merchant & Rider Settlement")
    ]
    for title, x, y, desc in boxes:
        box = patches.FancyBboxPatch((x, y), 1.4, 1.3, boxstyle="round,pad=0.05", fc='#FFF1F2', ec='#E11D48', lw=1.2)
        ax.add_patch(box)
        ax.text(x+0.7, y+0.9, title, color='#BE123C', weight='bold', fontsize=8.5, ha='center', va='center')
        ax.text(x+0.7, y+0.4, desc, color='#334155', fontsize=7, ha='center', va='center', wrap=True)
        
    save_fig(fig, "visual_foodexpress.png")
    print("Created visual_foodexpress.png")

create_nearer_visual()
create_carepulse_visual()
create_fleetpulse_visual()
create_smartdash_visual()
create_eduflow_visual()
create_foodexpress_visual()
