import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs(r"d:\NearER\portfolio_assets", exist_ok=True)

BG_COLOR = '#FFFFFF'

def save_fig(fig, filename):
    plt.tight_layout()
    plt.savefig(os.path.join(r"d:\NearER\portfolio_assets", filename), bbox_inches='tight', facecolor=BG_COLOR, dpi=300)
    plt.close()

# 1. NearER Visual
def create_nearer_visual():
    fig, ax = plt.subplots(figsize=(8, 4.2), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    hdr = patches.FancyBboxPatch((0.2, 3.4), 7.6, 0.6, boxstyle="round,pad=0.08", fc='#0A2540', ec='#0052FF', lw=1.5)
    ax.add_patch(hdr)
    ax.text(4.0, 3.7, "NearER — Emergency Healthcare & Decision Engine Platform (🥈 2nd Prize Winner)", color='white', weight='bold', fontsize=10, ha='center', va='center')
    
    cards = [
        ("Patient App\n(SOS / GPS)", 0.5, 1.8, '#0052FF', '#EFF6FF'),
        ("Driver App\n(Navigation & ETA)", 2.4, 1.8, '#0284C7', '#F0F9FF'),
        ("Hospital Portal\n(Live Bed/ICU)", 4.3, 1.8, '#059669', '#ECFDF5'),
        ("Control Booth\n(Operator Intake)", 6.2, 1.8, '#D97706', '#FFFBEB')
    ]
    for title, x, y, border_col, bg_col in cards:
        box = patches.FancyBboxPatch((x, y), 1.3, 1.1, boxstyle="round,pad=0.05", fc=bg_col, ec=border_col, lw=1.5)
        ax.add_patch(box)
        ax.text(x+0.65, y+0.55, title, color='#0F172A', weight='bold', fontsize=8, ha='center', va='center')
    
    engine_box = patches.FancyBboxPatch((1.0, 0.2), 6.0, 1.1, boxstyle="round,pad=0.08", fc='#F8FAFC', ec='#0052FF', lw=1.5)
    ax.add_patch(engine_box)
    ax.text(4.0, 0.9, "Multi-Criteria Emergency Decision Engine", color='#0A2540', weight='bold', fontsize=9.5, ha='center', va='center')
    ax.text(4.0, 0.55, "Suitability = ER Capability + Beds/ICU/Specialists + Data Freshness - ETA - Load", color='#475569', fontsize=7.5, ha='center', va='center')
    ax.text(4.0, 0.3, "Result: Nearest Suitable & Available Hospital Routing", color='#059669', weight='bold', fontsize=8, ha='center', va='center')

    save_fig(fig, "visual_nearer.png")
    print("Created visual_nearer.png")

# 2. Zerviqo Visual
def create_zerviqo_visual():
    fig, ax = plt.subplots(figsize=(8, 4.2), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    hdr = patches.FancyBboxPatch((0.2, 3.4), 7.6, 0.6, boxstyle="round,pad=0.08", fc='#4F46E5', ec='#4F46E5', lw=1.5)
    ax.add_patch(hdr)
    ax.text(4.0, 3.7, "Zerviqo — High-Performance Service & Enterprise Automation Platform", color='white', weight='bold', fontsize=10.5, ha='center', va='center')
    
    boxes = [
        ("Service Dispatch", 0.5, 1.8, "Automated Task & Booking Intake"),
        ("Real-Time Telemetry", 2.4, 1.8, "Live WebSocket Job Updates"),
        ("Vendor Portal", 4.3, 1.8, "Partner Management & Payouts"),
        ("Analytics Hub", 6.2, 1.8, "Executive KPI & Performance Metrics")
    ]
    for title, x, y, desc in boxes:
        box = patches.FancyBboxPatch((x, y), 1.3, 1.2, boxstyle="round,pad=0.05", fc='#EEF2FF', ec='#4F46E5', lw=1.2)
        ax.add_patch(box)
        ax.text(x+0.65, y+0.85, title, color='#4338CA', weight='bold', fontsize=8.5, ha='center', va='center')
        ax.text(x+0.65, y+0.4, desc, color='#334155', fontsize=7, ha='center', va='center', wrap=True)
        
    save_fig(fig, "visual_zerviqo.png")
    print("Created visual_zerviqo.png")

# 3. Delivery App Visual
def create_delivery_app_visual():
    fig, ax = plt.subplots(figsize=(8, 4.2), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    hdr = patches.FancyBboxPatch((0.2, 3.4), 7.6, 0.6, boxstyle="round,pad=0.08", fc='#0284C7', ec='#0284C7', lw=1.5)
    ax.add_patch(hdr)
    ax.text(4.0, 3.7, "Delivery App — On-Demand GPS Tracking & Rider Dispatch System", color='white', weight='bold', fontsize=10.5, ha='center', va='center')
    
    boxes = [
        ("Customer Booking", 0.5, 1.8, "Live Pickup & Drop Off Points"),
        ("Rider Mobile App", 2.4, 1.8, "Turn-by-Turn GPS Navigation"),
        ("Route Engine", 4.3, 1.8, "Dynamic Traffic & ETA Calculation"),
        ("Instant Settlements", 6.2, 1.8, "Automated Wallet & Earnings Payout")
    ]
    for title, x, y, desc in boxes:
        box = patches.FancyBboxPatch((x, y), 1.3, 1.2, boxstyle="round,pad=0.05", fc='#F0F9FF', ec='#0284C7', lw=1.2)
        ax.add_patch(box)
        ax.text(x+0.65, y+0.85, title, color='#0369A1', weight='bold', fontsize=8.5, ha='center', va='center')
        ax.text(x+0.65, y+0.4, desc, color='#334155', fontsize=7, ha='center', va='center', wrap=True)
        
    save_fig(fig, "visual_delivery_app.png")
    print("Created visual_delivery_app.png")

# 4. Ecomesh Visual
def create_ecomesh_visual():
    fig, ax = plt.subplots(figsize=(8, 4.2), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    hdr = patches.FancyBboxPatch((0.2, 3.4), 7.6, 0.6, boxstyle="round,pad=0.08", fc='#059669', ec='#059669', lw=1.5)
    ax.add_patch(hdr)
    ax.text(4.0, 3.7, "Ecomesh — Multi-Merchant E-Commerce Mesh Marketplace", color='white', weight='bold', fontsize=10.5, ha='center', va='center')
    
    boxes = [
        ("Storefront Network", 0.5, 1.8, "Multi-Vendor Product Catalog"),
        ("Inventory Mesh", 2.4, 1.8, "Cross-Warehouse Stock Sync"),
        ("Payment Gateway", 4.3, 1.8, "Secure Multi-Party Split Checkout"),
        ("Order Logistics", 6.2, 1.8, "Automated Merchant Fulfillment")
    ]
    for title, x, y, desc in boxes:
        box = patches.FancyBboxPatch((x, y), 1.3, 1.2, boxstyle="round,pad=0.05", fc='#ECFDF5', ec='#059669', lw=1.2)
        ax.add_patch(box)
        ax.text(x+0.65, y+0.85, title, color='#047857', weight='bold', fontsize=8.5, ha='center', va='center')
        ax.text(x+0.65, y+0.4, desc, color='#334155', fontsize=7, ha='center', va='center', wrap=True)
        
    save_fig(fig, "visual_ecomesh.png")
    print("Created visual_ecomesh.png")

# 5. DMBH Visual
def create_dmbh_visual():
    fig, ax = plt.subplots(figsize=(8, 4.2), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    hdr = patches.FancyBboxPatch((0.2, 3.4), 7.6, 0.6, boxstyle="round,pad=0.08", fc='#2563EB', ec='#2563EB', lw=1.5)
    ax.add_patch(hdr)
    ax.text(4.0, 3.7, "DMBH — Digital Medical & Business Healthcare Suite", color='white', weight='bold', fontsize=10.5, ha='center', va='center')
    
    boxes = [
        ("Hospital PMS", 0.5, 1.8, "Patient Records & Bed Management"),
        ("Clinical Triage", 2.4, 1.8, "OPD & IPD Doctor Schedules"),
        ("Billing & Claims", 4.3, 1.8, "Automated Medical Insurance Claims"),
        ("Health Analytics", 6.2, 1.8, "Enterprise Healthcare Dashboard")
    ]
    for title, x, y, desc in boxes:
        box = patches.FancyBboxPatch((x, y), 1.3, 1.2, boxstyle="round,pad=0.05", fc='#EFF6FF', ec='#2563EB', lw=1.2)
        ax.add_patch(box)
        ax.text(x+0.65, y+0.85, title, color='#1D4ED8', weight='bold', fontsize=8.5, ha='center', va='center')
        ax.text(x+0.65, y+0.4, desc, color='#334155', fontsize=7, ha='center', va='center', wrap=True)
        
    save_fig(fig, "visual_dmbh.png")
    print("Created visual_dmbh.png")

# 6. Highway Mirchi Visual
def create_highway_mirchi_visual():
    fig, ax = plt.subplots(figsize=(8, 4.2), dpi=300)
    ax.set_facecolor(BG_COLOR)
    fig.patch.set_facecolor(BG_COLOR)
    ax.axis('off')
    
    hdr = patches.FancyBboxPatch((0.2, 3.4), 7.6, 0.6, boxstyle="round,pad=0.08", fc='#E11D48', ec='#E11D48', lw=1.5)
    ax.add_patch(hdr)
    ax.text(4.0, 3.7, "Highway Mirchi — Highway Dining, Online Ordering & Hospitality System", color='white', weight='bold', fontsize=10, ha='center', va='center')
    
    boxes = [
        ("Online Ordering", 0.5, 1.8, "Pre-Order Meals En-Route on Highways"),
        ("KDS & Kitchen Sync", 2.4, 1.8, "Kitchen Display Order Queueing"),
        ("Table & POS System", 4.3, 1.8, "Express Highway Table Ordering"),
        ("Loyalty Rewards", 6.2, 1.8, "Traveler Coupons & Special Discounts")
    ]
    for title, x, y, desc in boxes:
        box = patches.FancyBboxPatch((x, y), 1.3, 1.2, boxstyle="round,pad=0.05", fc='#FFF1F2', ec='#E11D48', lw=1.2)
        ax.add_patch(box)
        ax.text(x+0.65, y+0.85, title, color='#BE123C', weight='bold', fontsize=8.5, ha='center', va='center')
        ax.text(x+0.65, y+0.4, desc, color='#334155', fontsize=7, ha='center', va='center', wrap=True)
        
    save_fig(fig, "visual_highway_mirchi.png")
    print("Created visual_highway_mirchi.png")

create_nearer_visual()
create_zerviqo_visual()
create_delivery_app_visual()
create_ecomesh_visual()
create_dmbh_visual()
create_highway_mirchi_visual()
