import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs(r"d:\NearER\portfolio_assets", exist_ok=True)

def create_nearer_diagram():
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    ax.set_facecolor('#050B18')
    fig.patch.set_facecolor('#050B18')
    ax.axis('off')
    
    # Header Banner
    rect_hdr = patches.FancyBboxPatch((0.5, 5.2), 9.0, 0.7, boxstyle="round,pad=0.1", fc='#0A2540', ec='#0052FF', lw=2)
    ax.add_patch(rect_hdr)
    ax.text(5.0, 5.55, "NearER — Award-Winning Emergency Healthcare Platform (🥈 2nd Prize Winner)", 
            color='white', weight='bold', fontsize=12, ha='center', va='center')
    
    # 4 Portals
    portals = [
        ("Patient App\n(Flutter / Web)", 1.2, 3.8, '#0052FF'),
        ("Ambulance App\n(GPS Navigation)", 3.7, 3.8, '#00B2FF'),
        ("Hospital Portal\n(Live Bed/ICU)", 6.2, 3.8, '#059669'),
        ("Control Booth\n(NGO / Operator)", 8.7, 3.8, '#D97706')
    ]
    
    for title, x, y, col in portals:
        p_box = patches.FancyBboxPatch((x-1.0, y-0.4), 2.0, 0.8, boxstyle="round,pad=0.1", fc='#0F172A', ec=col, lw=2)
        ax.add_patch(p_box)
        ax.text(x, y, title, color='white', weight='bold', fontsize=9, ha='center', va='center')
    
    # Decision Engine Central Box
    eng_box = patches.FancyBboxPatch((2.5, 1.8), 5.0, 1.0, boxstyle="round,pad=0.15", fc='#1E293B', ec='#0052FF', lw=2.5)
    ax.add_patch(eng_box)
    ax.text(5.0, 2.4, "Multi-Criteria Emergency Decision Engine", color='#00B2FF', weight='bold', fontsize=11, ha='center', va='center')
    ax.text(5.0, 2.0, "Score = Capability + Beds/ICU/Specialists + Data Freshness - Travel ETA - Load", color='#94A3B8', fontsize=8, ha='center', va='center')
    
    # Arrows from portals to engine
    for _, x, y, _ in portals:
        ax.annotate('', xy=(5.0, 2.8), xytext=(x, y-0.4),
                    arrowprops=dict(arrowstyle="->", color="#00B2FF", lw=1.5, connectionstyle="arc3,rad=0.1"))
    
    # Bottom Result Box
    res_box = patches.FancyBboxPatch((2.0, 0.4), 6.0, 0.7, boxstyle="round,pad=0.1", fc='#0A2540', ec='#059669', lw=2)
    ax.add_patch(res_box)
    ax.text(5.0, 0.75, "Optimized Destination: Nearest Suitable & Available Hospital", color='#10B981', weight='bold', fontsize=10, ha='center', va='center')
    
    ax.annotate('', xy=(5.0, 1.1), xytext=(5.0, 1.8),
                arrowprops=dict(arrowstyle="->", color="#059669", lw=2))
    
    plt.tight_layout()
    plt.savefig(r"d:\NearER\portfolio_assets\nearer_diagram.png", bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print("NearER diagram created successfully.")

create_nearer_diagram()
