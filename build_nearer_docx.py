import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def create_document():
    doc = docx.Document()
    
    # -------------------------------------------------------------
    # Page Setup (A4, 1-inch margins)
    # -------------------------------------------------------------
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)
    
    # Colors
    NAVY_RGB = RGBColor(10, 37, 64)       # #0A2540
    BLUE_RGB = RGBColor(0, 82, 255)       # #0052FF
    DARK_SLATE_RGB = RGBColor(30, 41, 59) # #1E293B
    GRAY_TEXT_RGB = RGBColor(71, 85, 105) # #475569
    
    # Configure default style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Segoe UI'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = DARK_SLATE_RGB
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(5)

    # -------------------------------------------------------------
    # Helper Functions for Styling
    # -------------------------------------------------------------
    def set_cell_background(cell, hex_color):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_cell_border(cell, **kwargs):
        """ kwargs: top, bottom, left, right
            values: dict(sz=12, val='single', color='0052FF', space='0') """
        tcPr = cell._tc.get_or_add_tcPr()
        tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}/>')
        for border_name, border_props in kwargs.items():
            if border_props:
                node = parse_xml(f'<w:{border_name} {nsdecls("w")} w:val="{border_props.get("val", "single")}" w:sz="{border_props.get("sz", 4)}" w:space="{border_props.get("space", 0)}" w:color="{border_props.get("color", "auto")}"/>')
                tcBorders.append(node)
        tcPr.append(tcBorders)

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Segoe UI'
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = NAVY_RGB
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Segoe UI'
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = BLUE_RGB
        return p

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Segoe UI'
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = DARK_SLATE_RGB
        return p

    def add_callout(text, title=None, bg_hex="EFF6FF", border_hex="0052FF"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, bg_hex)
        set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
        set_cell_border(cell, left=dict(sz=24, val='single', color=border_hex),
                              top=dict(val='none'), right=dict(val='none'), bottom=dict(val='none'))
        p = cell.paragraphs[0]
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(0)
        if title:
            run_title = p.add_run(f"📌 {title}\n")
            run_title.font.bold = True
            run_title.font.size = Pt(10.5)
            run_title.font.color.rgb = NAVY_RGB
        run_text = p.add_run(text)
        run_text.font.size = Pt(10)
        run_text.font.color.rgb = DARK_SLATE_RGB
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_diagram(img_path, caption):
        if os.path.exists(img_path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run()
            run.add_picture(img_path, width=Inches(6.1))
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(8)
            run_cap = p_cap.add_run(f"Figure: {caption}")
            run_cap.font.italic = True
            run_cap.font.size = Pt(9)
            run_cap.font.color.rgb = GRAY_TEXT_RGB

    def add_styled_table(headers, rows, col_widths=None):
        table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        
        # Header Row
        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            set_cell_background(hdr_cells[i], "0A2540")
            set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
                run.font.size = Pt(9.5)
        
        # Body Rows
        for r_idx, row_data in enumerate(rows):
            row_cells = table.rows[r_idx + 1].cells
            bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, cell_value in enumerate(row_data):
                row_cells[c_idx].text = str(cell_value)
                set_cell_background(row_cells[c_idx], bg_color)
                set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=140, right=140)
                set_cell_border(row_cells[c_idx], 
                                top=dict(sz=2, val='single', color='E2E8F0'),
                                bottom=dict(sz=2, val='single', color='E2E8F0'),
                                left=dict(val='none'), right=dict(val='none'))
                p = row_cells[c_idx].paragraphs[0]
                p.paragraph_format.line_spacing = 1.1
                p.paragraph_format.space_after = Pt(0)
                for run in p.runs:
                    run.font.size = Pt(9)
                    run.font.color.rgb = DARK_SLATE_RGB
        
        # Set widths if supplied
        if col_widths:
            for row in table.rows:
                for i, w in enumerate(col_widths):
                    row.cells[i].width = Inches(w)
                    
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # =============================================================
    # COVER PAGE
    # =============================================================
    p_top_spacer = doc.add_paragraph()
    p_top_spacer.paragraph_format.space_before = Pt(40)

    # Title Callout Box / Banner
    tbl_banner = doc.add_table(rows=1, cols=1)
    tbl_banner.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_banner = tbl_banner.cell(0, 0)
    set_cell_background(c_banner, "0A2540")
    set_cell_margins(c_banner, top=300, bottom=300, left=300, right=300)
    set_cell_border(c_banner, left=dict(sz=36, val='single', color='0052FF'),
                             top=dict(val='none'), right=dict(val='none'), bottom=dict(val='none'))
    
    p_b1 = c_banner.paragraphs[0]
    r_b1 = p_b1.add_run("NearER\n")
    r_b1.font.size = Pt(36)
    r_b1.font.bold = True
    r_b1.font.color.rgb = RGBColor(255, 255, 255)
    
    r_b2 = p_b1.add_run("NGO Partnership, Community Awareness & Emergency Control Booth Framework\n\n")
    r_b2.font.size = Pt(15)
    r_b2.font.bold = True
    r_b2.font.color.rgb = RGBColor(0, 178, 255)
    
    r_b3 = p_b1.add_run("“Finding the right emergency care, not just the nearest hospital.”")
    r_b3.font.size = Pt(12)
    r_b3.font.italic = True
    r_b3.font.color.rgb = RGBColor(226, 232, 240)

    doc.add_paragraph().paragraph_format.space_after = Pt(30)

    # Metadata Block Table
    add_styled_table(
        headers=["DOCUMENT METADATA", "DETAILS & SPECIFICATION"],
        rows=[
            ["Document Title", "NearER – NGO Partnership, Community Awareness & Emergency Control Booth Framework"],
            ["Document Type", "Institutional Partnership & Operational Implementation Proposal"],
            ["Target Audience", "NGO Leaders, Hospital Directors, Healthcare Authorities, Ambulance Networks & Sponsors"],
            ["Platform Core Concept", "Healthcare Coordination & Decision-Support System (Non-Clinical Routing Engine)"],
            ["Key Shift", "Shifting Emergency Dispatch from 'Nearest Hospital' to 'Nearest Suitable and Available Hospital'"],
            ["Version / Date", "Version 2.0 • September 2026 Release"],
            ["Prepared By", "NearER Global Engineering & Healthcare Social Impact Directorate"]
        ],
        col_widths=[2.2, 4.07]
    )

    doc.add_page_break()

    # Configure Header & Footer for remaining pages
    header = section.header
    hp = header.paragraphs[0]
    hp.text = "NearER — NGO Partnership, Community Awareness & Emergency Control Booth Framework"
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hp.runs[0].font.size = Pt(8.5)
    hp.runs[0].font.color.rgb = GRAY_TEXT_RGB

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.text = "CONFIDENTIAL & PROPRIETARY — FOR INSTITUTIONAL & NGO PARTNER REVIEW ONLY"
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fp.runs[0].font.size = Pt(8.5)
    fp.runs[0].font.color.rgb = GRAY_TEXT_RGB

    # =============================================================
    # TABLE OF CONTENTS / OUTLINE
    # =============================================================
    add_heading_1("Table of Contents & Framework Overview")
    
    toc_rows = [
        ["Section 1", "Executive Summary", "Page 3"],
        ["Section 2", "Problem Statement & Emergency Redirection Analysis", "Page 4"],
        ["Section 3", "NearER Solution & Core Operating Principles", "Page 5"],
        ["Section 4", "Complete Ecosystem Architecture & Flowcharts", "Page 6"],
        ["Section 5", "Patient Application Framework", "Page 7"],
        ["Section 6", "Hospital Emergency Department Portal", "Page 8"],
        ["Section 7", "Ambulance & Emergency Transport System", "Page 9"],
        ["Section 8", "Emergency Decision Engine (Step-by-Step Logic)", "Page 10"],
        ["Section 9", "NGO Partnership Model & Multi-Branch Roles", "Page 11"],
        ["Section 10", "Community Awareness & Promotion Plan", "Page 12"],
        ["Section 11", "NearER Control Booth Infrastructure & Setup", "Page 13"],
        ["Section 12", "Control Booth Incident Operations Workflow", "Page 14"],
        ["Section 13", "Control Booth SOP & Escalation Hierarchy", "Page 15"],
        ["Section 14", "Volunteer Training & Certification Framework", "Page 16"],
        ["Section 15", "NGO and NearER Responsibility Matrix", "Page 17"],
        ["Section 16", "Data Privacy, Consent & Information Security", "Page 18"],
        ["Section 17", "Safety, Risk Management & Fallback Protocols", "Page 19"],
        ["Section 18", "Pilot Implementation Plan & Timeline", "Page 20"],
        ["Section 19", "NGO Community Promotion & Awareness Campaigns", "Page 21"],
        ["Section 20", "Measurable Key Performance Indicators (KPIs)", "Page 22"],
        ["Section 21", "Long-Term Vision & Scalability Roadmap", "Page 23"],
        ["Section 22", "Expected Social Impact Assessment", "Page 24"],
        ["Section 23", "Official Partnership Proposal & Invitation to NGO", "Page 25"]
    ]
    add_styled_table(["SECTION", "FRAMEWORK MODULE", "LOCATION"], toc_rows, [1.1, 4.27, 0.9])

    doc.add_page_break()

    # =============================================================
    # SECTION 1 — EXECUTIVE SUMMARY
    # =============================================================
    add_heading_1("Section 1 — Executive Summary")
    
    add_callout(
        "NearER shifts emergency healthcare routing from the nearest hospital to the nearest suitable and available hospital. "
        "Its primary objective is to drastically reduce avoidable delays between an emergency occurring and appropriate medical treatment beginning.",
        title="CENTRAL PARADIGM SHIFT"
    )

    doc.add_paragraph(
        "In medical emergencies, every minute lost directly impacts patient survival and recovery. "
        "During the critical 'Golden Hour'—particularly in severe trauma, cardiac arrest, acute stroke, pediatric emergencies, and severe burns—the speed of arriving at a medical facility that is fully equipped, staffed, and immediately ready to admit the patient is the single most decisive factor in saving lives."
    )
    doc.add_paragraph(
        "Across urban, suburban, and rural healthcare ecosystems globally, a systemic failure persists: "
        "patients, family members, and traditional emergency vehicles instinctively navigate to the geographically nearest hospital. "
        "However, upon arrival, victims frequently discover that the nearest facility lacks available Intensive Care Unit (ICU) beds, functional mechanical ventilators, on-duty specialized surgeons, emergency blood supplies, or immediate resuscitation capacity. "
        "This leads to catastrophic secondary and tertiary inter-hospital transfers ('hospital ping-ponging'), during which clinical deterioration accelerates and precious time expires."
    )
    doc.add_paragraph(
        "NearER is an innovative, non-clinical emergency healthcare coordination and decision-support platform designed to bridge this information gap. "
        "By real-time interconnecting Patients, Emergency Transport Fleets, Hospital Control Rooms, and NGO Community Control Booths, NearER dynamically identifies, verifies, and routes patients to the most suitable available hospital."
    )
    doc.add_paragraph(
        "Crucially, NearER is NOT an AI doctor. It does not provide clinical diagnoses, prescribe treatment, or replace qualified medical professionals. "
        "Instead, NearER acts as an intelligent logistics and decision-support pipeline, structuring emergency data, verifying hospital capability, calculating real-time traffic delays, and pre-alerting emergency departments prior to patient arrival."
    )

    # =============================================================
    # SECTION 2 — PROBLEM STATEMENT
    # =============================================================
    add_heading_1("Section 2 — Problem Statement & Emergency Redirection Analysis")
    
    doc.add_paragraph(
        "The traditional emergency response ecosystem suffers from profound structural inefficiencies that cause thousands of avoidable fatalities annually. "
        "These core systemic failures include:"
    )

    prob_items = [
        ("Information Asymmetry during Crisis", "Patients and distressed relatives have zero real-time visibility into hospital capabilities, bed availability, or specialist attendance when an emergency strikes."),
        ("Manual & Fragmented Ambulance Coordination", "Ambulance operators frequently rely on manual phone calls to hospital reception desks while driving, leading to delayed responses, unanswered calls, and uncoordinated drop-offs."),
        ("Dynamic & Rapidly Fluctuating Hospital Capacity", "Hospital Emergency Department (ED) bed capacity, ICU availability, ventilator counts, and blood bank stocks change continuously. Static directories are useless during live emergencies."),
        ("Catastrophic Golden Hour Depletion", "Patients spending 30–90 minutes traveling to an unsuitable hospital must be re-triaged, stabilized, and transferred to a secondary facility, exhausting the clinical Golden Hour."),
        ("Severe Emergency Room Overcrowding", "Unannounced patient arrivals overload specific famous tertiary hospitals while neighboring equipped centers remain underutilized."),
        ("Digital Exclusion of Vulnerable Populations", "Elderly citizens, low-income families, and non-digital users are excluded from modern emergency platforms without community coordination infrastructure.")
    ]
    for title, desc in prob_items:
        add_heading_3(title)
        doc.add_paragraph(desc)

    # =============================================================
    # SECTION 3 — NEARER SOLUTION & CORE PRINCIPLES
    # =============================================================
    add_heading_1("Section 3 — NearER Solution & Core Principles")
    
    doc.add_paragraph(
        "NearER addresses these structural failures by deploying an integrated digital-and-physical emergency coordination ecosystem. "
        "The platform establishes a seamless, verified chain of information from the moment an emergency is triggered to definitive clinical admission."
    )

    add_callout(
        "Patient / Citizen (App / NGO Booth / Web)\n"
        "       │\n"
        "       ▼\n"
        "NearER Emergency Cloud Platform\n"
        "       │\n"
        "       ▼\n"
        "Hospital Suitability & Live Resource Matching Engine\n"
        "       │\n"
        "       ▼\n"
        "Optimal Available Hospital (Pre-Arrival Alert & Bed Lock)\n"
        "       │\n"
        "       ▼\n"
        "Ambulance Coordination & Traffic Escort (Green Corridor)\n"
        "       │\n"
        "       ▼\n"
        "Direct Emergency Department Triage Admission",
        title="HIGH-LEVEL SYSTEM FLOW"
    )

    add_heading_2("Core Operating Principles & Non-Clinical Boundaries")
    doc.add_paragraph("NearER adheres to strict institutional and healthcare ethical boundaries:")
    
    principles = [
        "Non-Clinical Support System: NearER never diagnoses medical conditions or prescribes pharmaceutical interventions.",
        "Clinical Authority Preservation: All medical decisions, triage grading, and treatment protocols remain 100% under the authority of qualified hospital physicians.",
        "Zero Friction Intake: Emergency reporting requires minimal steps—supporting 1-tap SOS, voice brief recording, and automatic GPS capture.",
        "Complementary Ecosystem: NearER complements and integrates with existing statutory emergency numbers (e.g., 108 / 112 / 911), rather than replacing them.",
        "Total Transparency & Data Integrity: Capacity data is verified with strict timestamp audits to prevent outdated routing."
    ]
    for p in principles:
        doc.add_paragraph(f"• {p}")

    # =============================================================
    # SECTION 4 — COMPLETE ECOSYSTEM ARCHITECTURE
    # =============================================================
    add_heading_1("Section 4 — Complete Ecosystem Architecture")
    
    doc.add_paragraph(
        "The NearER ecosystem unites nine specialized software modules and physical operational units into a synchronized real-time emergency network."
    )

    add_diagram("diagrams/diagram_1_ecosystem_architecture.png", "NearER Overall System & Multi-Node Architecture")
    add_diagram("diagrams/diagram_2_emergency_workflow.png", "NearER End-to-End Emergency Lifecycle Workflow (14 Steps)")

    add_heading_2("Detailed System Nodes")
    node_desc = [
        ("1. Patient Mobile App (Android/iOS)", "Provides 1-tap SOS, voice briefing, live GPS capture, emergency category selection, and real-time transit tracking."),
        ("2. Patient Web Emergency Portal", "Browser-based intake for instant access without app installation, providing locality selection and turn-by-turn routing."),
        ("3. Hospital Emergency Department Dashboard", "Control room interface for ER staff to receive pre-arrival alerts, review patient audio notes, accept/decline cases, and manage live ER/ICU bed capacity."),
        ("4. Ambulance Driver Application", "Provides drivers with pickup navigation, clinical condition briefs, target hospital locking, and direct ETA broadcasting."),
        ("5. NearER Backend Cloud Server", "Secure Supabase/PostgreSQL backend handling authentication, data encryption, real-time WebSockets, and state persistence."),
        ("6. Decision Matching Engine", "Algorithmic pipeline performing capability filtering, bed capacity gating, data freshness checks, and travel delay scoring."),
        ("7. Maps & Telemetry Routing Engine", "Integrates OpenStreetMap/Google Maps telemetry for live travel time calculation and traffic corridor alerts."),
        ("8. NGO Control Booth Operator Desk", "Specialized dashboard allowing trained NGO volunteers to log emergency requests for non-digital or distressed citizens."),
        ("9. Admin & Analytics Executive Suite", "Provides health authorities and NGO leadership with regional emergency metrics, response times, and capacity audit logs.")
    ]
    for name, desc in node_desc:
        add_heading_3(name)
        doc.add_paragraph(desc)

    # =============================================================
    # SECTION 5 — PATIENT APPLICATION FRAMEWORK
    # =============================================================
    add_heading_1("Section 5 — Patient Application Framework")
    
    doc.add_paragraph(
        "The patient application is engineered under the 'Zero Panic Friction' design philosophy. "
        "During extreme stress, users cannot navigate complex menus or complete lengthy forms."
    )

    add_heading_2("Key Patient Application Capabilities")
    app_caps = [
        ("1-Tap Instant Emergency SOS", "Single button press immediately broadcasts high-accuracy GPS coordinates, user mobile number, and default profile metrics to nearby hospital desks."),
        ("Automated GPS & Manual Locality Override", "Uses high-accuracy device GPS with intelligent reverse-geocoding, backed by an instant 1-tap manual locality picker (e.g., 'Salt Lake, Sector V') if GPS is disabled or indoors."),
        ("Voice Brief Emergency Recorder", "Allows patients or bystanders to record up to 30 seconds of audio describing the situation. Audio is encoded and transmitted to the ER triage team prior to arrival."),
        ("Conditional Transport Selector", "Offers two distinct choices: (a) Emergency ALS ICU Ambulance Required (with live radar tracking and driver call) OR (b) Self-Transport (direct Google Maps navigation to ER door)."),
        ("Dynamic Escalation Trigger", "Self-transporting patients can tap 'NEED AMBULANCE' at any point during travel if their medical condition deteriorates, dispatching an ALS unit to their moving location."),
        ("Digital Admission Pass & QR Code", "Generates a unique Case ID (e.g., 'NR-10482') and scannable QR passport containing blood group, emergency contact details, and registered medical history for instant hospital check-in.")
    ]
    for title, desc in app_caps:
        add_heading_3(title)
        doc.add_paragraph(desc)

    # =============================================================
    # SECTION 6 — HOSPITAL PORTAL
    # =============================================================
    add_heading_1("Section 6 — Hospital Emergency Department Portal")
    
    doc.add_paragraph(
        "The Hospital Portal serves as the emergency department's command center, converting surprise arrivals into pre-planned clinical admissions."
    )

    add_heading_2("Hospital Dashboard Management Scope")
    add_styled_table(
        headers=["RESOURCE / FEATURE", "CONTROL ROOM FUNCTIONALITY", "CLINICAL IMPACT"],
        rows=[
            ["ER Resuscitation Beds", "Live count toggles (+ / -) for open emergency beds", "Prevents over-booking and redirects cases when full"],
            ["ICU & Ventilator Capacity", "Real-time tracker for Intensive Care Unit beds and vents", "Ensures critical respiratory/trauma cases find open ICUs"],
            ["On-Duty Specialist Shifts", "Checklist for Cardiologists, Trauma Surgeons, Neurologists", "Guarantees relevant specialty care is present before arrival"],
            ["Blood Bank Inventory", "Units available by group (O+, O-, A+, AB+, etc.)", "Critical for severe hemorrhage and trauma resuscitation"],
            ["Incoming Case Queue", "Live cards with patient vitals, audio notes, ETA, and transport mode", "Allows ER triage team to pre-assign resuscitation bays"],
            ["Accept / Decline Action", "Explicit confirmation buttons for incoming requests", "Locks bed reservation or triggers automatic system backup match"],
            ["Data Freshness Monitor", "Timestamp indicator showing last capacity verification", "Alerts staff if data is stale (> 30 mins unconfirmed)"]
        ],
        col_widths=[1.8, 2.5, 1.97]
    )

    # =============================================================
    # SECTION 7 — AMBULANCE & DRIVER SYSTEM
    # =============================================================
    add_heading_1("Section 7 — Ambulance & Emergency Transport System")
    
    doc.add_paragraph(
        "The Ambulance Driver Interface turns emergency transport fleets into connected mobile ICUs."
    )

    driver_feats = [
        ("Driver Duty Authentication", "Secure login allowing driver to toggle status: Available, En-Route Pickup, Patient Onboard, At Hospital, or Maintenance."),
        ("Automated Dispatch Alerts", "Receives instant pop-up assignments containing patient GPS coordinates, age/gender, medical brief, and assigned hospital."),
        ("Turn-by-Turn Navigation", "Direct integration with Google Maps and native geo-navigation for fast pickup and hospital routing."),
        ("Hospital Pre-Arrival Link", "Broadcasts live vehicle telemetry to the hospital dashboard, allowing ER staff to watch the incoming vehicle's ETA countdown."),
        ("Strict Non-Clinical Boundaries", "Driver interface is strictly for navigation and transport telemetry; drivers do not perform clinical triage or diagnostic input.")
    ]
    for title, desc in driver_feats:
        add_heading_3(title)
        doc.add_paragraph(desc)

    # =============================================================
    # SECTION 8 — EMERGENCY DECISION ENGINE
    # =============================================================
    add_heading_1("Section 8 — Emergency Decision Engine (Step-by-Step Logic)")
    
    doc.add_paragraph(
        "The Emergency Decision Engine is the core algorithmic intelligence of NearER. "
        "It evaluates multi-dimensional spatial, clinical capability, and resource availability metrics to identify the optimal hospital."
    )

    add_diagram("diagrams/diagram_3_decision_engine_flowchart.png", "NearER Emergency Decision Engine Logic & Scoring Pipeline (Steps 1–10)")

    add_heading_2("Step-by-Step Decision Logic")
    
    steps_logic = [
        ("Step 1: Geofenced Candidate Retrieval", "Queries database for verified hospitals within a 30km driving radius of the patient's GPS location."),
        ("Step 2: Specialty Capability Filter (HARD GATE)", "Excludes any hospital that does not possess primary surgical/clinical capabilities required for the specific emergency category (e.g., excluding facilities without cath labs for cardiac cases)."),
        ("Step 3: Live Bed & ICU Capacity Gate (HARD GATE)", "Excludes any hospital where ER Available Beds <= 0. If a hospital is full, it CANNOT accept emergency cases."),
        ("Step 4: Data Freshness Audit", "Applies confidence penalties if hospital capacity data has not been updated within the last 30 minutes."),
        ("Step 5: Multi-Factor Suitability Scoring", "Calculates a dynamic suitability score using the scoring framework below."),
        ("Step 6: Rank & Candidate Selection", "Identifies the Primary Optimal Match plus up to 3 verified backup alternatives."),
        ("Step 7: Pre-Arrival Case Transmission", "Dispatches emergency notification to the Primary Hospital control desk."),
        ("Step 8: Hospital Confirmation Loop", "If Primary accepts -> lock reservation. If Primary declines -> automatically push to Backup Match #1."),
        ("Step 9: Real-time Telemetry Monitoring", "Continuously monitors travel ETA and destination bed status during patient transit."),
        ("Step 10: Dynamic Reroute Trigger", "If Primary hospital capacity drops to 0 during transit, the engine immediately prompts a mandatory reroute alert.")
    ]
    for title, desc in steps_logic:
        add_heading_3(title)
        doc.add_paragraph(desc)

    add_callout(
        "Hospital Suitability Score =\n"
        "  + Specialty Capability Match (Weight: 40%)\n"
        "  + ER & ICU Bed Availability (Weight: 30%)\n"
        "  + On-Duty Specialist & Blood Readiness (Weight: 15%)\n"
        "  + Data Freshness Confidence (Weight: 15%)\n"
        "  - Estimated Travel & Traffic Delay Penalty\n"
        "  - Hospital Current Triage Queue Penalty\n\n"
        "*Disclaimer: This scoring logic is an operational routing model, not a medically validated clinical formula. "
        "Final parameter weights are refined continuously in collaboration with medical advisory boards and pilot empirical data.",
        title="SUITABILITY SCORING MODEL"
    )

    # =============================================================
    # SECTION 9 — NGO PARTNERSHIP MODEL
    # =============================================================
    add_heading_1("Section 9 — NGO Partnership Model & Multi-Branch Roles")
    
    doc.add_paragraph(
        "NGO partners are not merely promotional sponsors; they are the essential operational, community, and human delivery arm of NearER. "
        "Without NGO community integration, digital platforms fail to reach non-digital, elderly, or socio-economically disadvantaged populations."
    )

    add_diagram("diagrams/diagram_4_ngo_role_diagram.png", "Multi-Branch Role of NGO Partners in the NearER Ecosystem")

    add_heading_2("15 Core NGO Responsibilities")
    ngo_resp = [
        "1. Community Awareness: Leading local public campaigns on emergency preparedness.",
        "2. NearER Platform Promotion: Educating citizens on downloading and using the platform.",
        "3. School & College Workshops: Conducting emergency response training in educational institutions.",
        "4. Residential Society Drives: Partnering with housing associations to pre-register profiles.",
        "5. Hospital Introductions: Facilitating meetings with local private and public hospitals.",
        "6. Ambulance Fleet Onboarding: Connecting private, trust, and charity ambulance providers.",
        "7. NGO Control Booth Operation: Establishing and staffing physical/virtual emergency help desks.",
        "8. Volunteer Recruitment: Mobilizing dedicated community youth and health volunteers.",
        "9. Volunteer Training Execution: Ensuring operators complete all 10 training modules.",
        "10. Elderly Citizen Support: Assisting senior citizens with profile pre-filling and QR badges.",
        "11. Non-Digital Accessibility: Providing telephone assistance for users without smartphones.",
        "12. Field Data Verification: Verifying physical addresses and contact numbers of local providers.",
        "13. Feedback & Audit Logging: Documenting operational gaps, delay bottlenecks, and user feedback.",
        "14. Public Health Camp Integration: Setting up NearER demo booths at blood drives and health camps.",
        "15. Institutional Coordination: Interfacing with local municipal health and disaster authorities."
    ]
    for r in ngo_resp:
        doc.add_paragraph(f"• {r}")

    # =============================================================
    # SECTION 10 — PROMOTION & AWARENESS PLAN
    # =============================================================
    add_heading_1("Section 10 — Community Awareness & Promotion Plan")
    
    doc.add_paragraph(
        "A technology platform is only effective if citizens know how to use it before crisis strikes. "
        "The NGO partner leads a structured 7-stage community awareness cycle."
    )

    add_diagram("diagrams/diagram_5_awareness_cycle.png", "7-Stage NGO Community Emergency Awareness Cycle")

    add_heading_2("Key Educational Messages for Public Campaigns")
    messages = [
        "Why the nearest hospital is not always the right hospital: Educating the public on capacity and specialized care.",
        "Know Before the Emergency: Pre-registering family blood groups, allergies, and contacts in the app.",
        "How Voice Briefing Works: Demonstrating 30-second audio symptom reporting.",
        "Complementing Statutory Services: Explaining that NearER works alongside 108/112 to optimize hospital selection.",
        "Clear Boundaries: Emphasizing that NearER is an emergency logistics network, not a virtual doctor."
    ]
    for m in messages:
        doc.add_paragraph(f"✔ {m}")

    # =============================================================
    # SECTION 11 — NEARER CONTROL BOOTH SETUP
    # =============================================================
    add_heading_1("Section 11 — NearER Control Booth Infrastructure & Setup")
    
    doc.add_paragraph(
        "To ensure universal access, NGO partners establish physical or virtual NearER Control Booths. "
        "These booths serve as assistance hubs for elderly, distressed, or digitally inexperienced citizens."
    )

    add_heading_2("Control Booth Deployment Locations")
    locations = [
        "NGO Central Offices and Community Welfare Centers",
        "Public Hospitals Coordination Desks & Outpatient Waiting Halls",
        "Major Public Gatherings, Festivals, Cultural Events, and Sports Meets",
        "Target Pilot Neighborhoods and Health Awareness Camps"
    ]
    for loc in locations:
        doc.add_paragraph(f"📍 {loc}")

    add_heading_2("Standard Control Booth Equipment & Hardware Specifications")
    add_styled_table(
        headers=["EQUIPMENT / RESOURCE", "MINIMUM SPECIFICATION", "OPERATIONAL PURPOSE"],
        rows=[
            ["Workstation / Laptop", "Intel i5/8GB RAM, Windows 11 / Linux", "Runs NearER Control Booth Web Dashboard"],
            ["Primary Internet", "Fiber Broadband (Min 50 Mbps)", "Real-time WebSocket streaming & database updates"],
            ["Backup Internet", "4G/5G Cellular Mobile Wi-Fi Dongle", "Instant failover if primary broadband drops"],
            ["Telephony & Headset", "Dedicated Smartphone + Noise-Canceling Headset", "Receiving incoming calls & talking to hospitals/drivers"],
            ["Power Backup", "1000VA UPS / Inverter (Min 2-Hour Backup)", "Ensures booth stays operational during power cuts"],
            ["SOP & Reference Folder", "Printed Workflows, Hospital Directories & Contact Lists", "Offline reference during system or network outages"],
            ["Incident Logbook", "Physical / Digital Incident Register", "Audit trail for all handled emergency calls"],
            ["First Aid & Comfort Kit", "Basic First Aid Supplies & Emergency Water", "Immediate assistance for walk-in distress cases"]
        ],
        col_widths=[1.8, 2.5, 1.97]
    )

    add_heading_2("Booth Staffing Architecture & Roles")
    staff_roles = [
        ("Booth Supervisor (1 Per Shift)", "Senior NGO staff member overseeing operations, quality compliance, and handling complex escalations."),
        ("Volunteer Operators (1–2 Per Shift)", "Trained NGO volunteers operating the NearER dashboard, taking calls, and entering patient data."),
        ("Technical Support Liaison", "Dedicated NearER engineer available on-call for immediate platform troubleshooting."),
        ("Hospital & Ambulance Network Liaison", "Designated contact person at participating healthcare facilities for rapid coordination.")
    ]
    for title, desc in staff_roles:
        add_heading_3(title)
        doc.add_paragraph(desc)

    # =============================================================
    # SECTION 12 — CONTROL BOOTH WORKFLOW
    # =============================================================
    add_heading_1("Section 12 — Control Booth Incident Operations Workflow")
    
    doc.add_paragraph(
        "Control Booth operators follow a rigorous, standardized 13-stage workflow for every emergency incident."
    )

    add_diagram("diagrams/diagram_6_control_booth_workflow.png", "NGO NearER Control Booth Incident Operations Workflow (15 Stages)")

    add_callout(
        "CRITICAL SAFETY & OPERATIONAL BOUNDARIES FOR BOOTH OPERATORS:\n\n"
        "1. DO NOT DIAGNOSE: Operators must NEVER offer clinical opinions or diagnose illnesses.\n"
        "2. DO NOT PRESCRIBE: Operators must NEVER recommend pharmaceuticals or medical treatments.\n"
        "3. DO NOT OVERRIDE PHYSICIANS: Clinical authority belongs 100% to hospital doctors.\n"
        "4. DO NOT GUARANTEE BED AVAILABILITY: Operators report live system data, not absolute medical guarantees.\n"
        "5. DO NOT DELAY STATUTORY SERVICES: Statutory emergency numbers (108/112) must be dialed immediately for critical life threats.",
        title="MANDATORY OPERATOR BOUNDARIES",
        bg_hex="FFFBEB",
        border_hex="D97706"
    )

    # =============================================================
    # SECTION 13 — CONTROL BOOTH SOP & ESCALATION HIERARCHY
    # =============================================================
    add_heading_1("Section 13 — Control Booth SOP & Escalation Hierarchy")
    
    doc.add_paragraph(
        "When an emergency request encounters roadblocks—such as hospital rejections, sudden bed capacity drops, or fleet delays—operators follow a strict 5-tier escalation hierarchy."
    )

    add_diagram("diagrams/diagram_7_escalation_hierarchy.png", "Control Booth Incident Escalation Hierarchy (Tiers 1–5)")

    add_heading_2("5-Tier Escalation SOP")
    tiers_desc = [
        ("Tier 1: Frontline Volunteer Operator", "Handles initial intake, data entry, system recommendation, and standard hospital pre-arrival notification."),
        ("Tier 2: Booth Supervisor", "Escalated if Primary Hospital declines request, or if user is severely distressed and requires manual intervention."),
        ("Tier 3: NearER Technical & Operations Team", "Escalated if system technical errors, app crashes, or mapping telecommunication glitches occur."),
        ("Tier 4: Hospital CMO & Ambulance Liaison", "Direct institutional escalation to senior hospital medical officers when bed disputes or urgent capacity overrides occur."),
        ("Tier 5: Statutory Emergency Services (108 / 112)", "Immediate escalation to government emergency services for mass casualties, crime scenes, or disaster scenarios.")
    ]
    for title, desc in tiers_desc:
        add_heading_3(title)
        doc.add_paragraph(desc)

    # =============================================================
    # SECTION 14 — VOLUNTEER TRAINING FRAMEWORK
    # =============================================================
    add_heading_1("Section 14 — Volunteer Training & Certification Framework")
    
    doc.add_paragraph(
        "All NGO volunteer operators must complete a comprehensive 10-module training curriculum before being authorized to staff a NearER Control Booth."
    )

    add_heading_2("10-Module Training Curriculum")
    modules = [
        ("Module 1: NearER Overview & Mission", "Understanding the shift from nearest to nearest suitable hospital."),
        ("Module 2: Emergency Communication Etiquette", "De-escalation techniques, active listening, and concise information gathering under stress."),
        ("Module 3: Patient Privacy & Data Ethics", "Handling sensitive medical data, consent protocols, and confidentiality rules."),
        ("Module 4: Control Booth Dashboard Mastery", "Hands-on software operation, case creation, map navigation, and logging."),
        ("Module 5: Hospital & Ambulance Coordination", "Professional communication protocols when interfacing with ER desks and drivers."),
        ("Module 6: Escalation Hierarchy & SOPs", "Knowing exactly when and how to escalate cases to Supervisors or 108/112."),
        ("Module 7: Handling Distressed & Hysterical Callers", "Psychological first aid, staying calm, and maintaining control of the call."),
        ("Module 8: Cyber Security & Data Protection", "Password safety, secure logins, auto-logout compliance, and avoiding personal device usage."),
        ("Module 9: Non-Clinical Boundaries & 'What NOT to Say'", "Strict prohibition against medical advice, diagnosing, or promising outcomes."),
        ("Module 10: Simulation Exercises & Competency Audit", "Live mock-emergency scenarios tested against real-time evaluation rubrics.")
    ]
    for title, desc in modules:
        add_heading_3(title)
        doc.add_paragraph(desc)

    # =============================================================
    # SECTION 15 — NGO AND NEARER RESPONSIBILITY MATRIX
    # =============================================================
    add_heading_1("Section 15 — NGO and NearER Responsibility Matrix")
    
    doc.add_paragraph(
        "To ensure seamless collaboration, operational responsibilities are clearly demarcated across all ecosystem partners."
    )

    matrix_rows = [
        ["Platform Software Development & Maintenance", "LEAD", "Support", "None", "None"],
        ["Community Awareness & Local Campaigns", "Support", "LEAD", "Support", "Support"],
        ["Control Booth Installation & Operations", "Support", "LEAD", "None", "None"],
        ["Hospital Capacity Data Accuracy & Updates", "Audit", "None", "LEAD", "None"],
        ["Ambulance Fleet Availability & Location", "Audit", "None", "None", "LEAD"],
        ["Volunteer Recruitment & Staffing", "None", "LEAD", "None", "None"],
        ["Volunteer Training & Certification", "LEAD", "Co-Lead", "None", "None"],
        ["Technical Support & Cloud Hosting", "LEAD", "None", "None", "None"],
        ["Hospital Onboarding & Clinical Alignment", "Co-Lead", "Co-Lead", "LEAD", "None"],
        ["Clinical Decision-Making & Patient Triage", "NONE", "NONE", "LEAD", "NONE"],
        ["Patient Data Privacy & Security Compliance", "LEAD", "Support", "Support", "Support"],
        ["Incident Logging & Service Audit Reports", "Co-Lead", "Co-Lead", "Support", "Support"]
    ]
    add_styled_table(
        headers=["ACTIVITY / DOMAIN", "NearER TEAM", "NGO PARTNER", "HOSPITAL", "AMBULANCE"],
        rows=matrix_rows,
        col_widths=[2.1, 1.0, 1.1, 1.0, 1.07]
    )

    # =============================================================
    # SECTION 16 — DATA PRIVACY & SECURITY
    # =============================================================
    add_heading_1("Section 16 — Data Privacy, Consent & Information Security")
    
    doc.add_paragraph(
        "Patient emergency data is highly sensitive. NearER implements enterprise-grade data protection and privacy safeguards."
    )

    privacy_points = [
        ("Minimum Necessary Data Principle", "NearER collects only the data essential for emergency routing (Location, Category, Contact, Vitals/Voice Note)."),
        ("Explicit User & Relative Consent", "Data capture requires user authorization via app prompt or verbal phone consent logged by operators."),
        ("Role-Based Access Control (RBAC)", "Hospital desks only see incoming patients; volunteers only see active booth cases; admin metrics are anonymized."),
        ("End-to-End Data Encryption", "All data in transit is encrypted using TLS 1.3, and database storage is secured using AES-256 encryption."),
        ("Strict Personal Device Restrictions", "Volunteer operators are strictly prohibited from recording patient details on personal phones or paper scratchpads."),
        ("Automated Session Expiry", "Control Booth workstations automatically log out after 10 minutes of inactivity to prevent unauthorized access.")
    ]
    for title, desc in privacy_points:
        add_heading_3(title)
        doc.add_paragraph(desc)

    # =============================================================
    # SECTION 17 — SAFETY & RISK MANAGEMENT
    # =============================================================
    add_heading_1("Section 17 — Safety, Risk Management & Fallback Protocols")
    
    doc.add_paragraph(
        "A comprehensive risk management matrix identifies potential operational hazards and establishes mitigations."
    )

    risk_rows = [
        ["Outdated Hospital Capacity Data", "High", "30-min data freshness audit; automatic score penalty; operator manual verification call."],
        ["Mobile Network / Broadband Failure", "High", "Automatic 4G/5G dongle failover at booth; SMS fallback dispatch; offline directory SOP."],
        ["GPS Accuracy / Drift Errors", "Medium", "3-second GPS timeout; instant 1-tap manual locality picker; landmark verification by operator."],
        ["Hospital Rejects Emergency Request", "High", "Engine automatically routes request to pre-calculated Backup Hospital Candidate #1."],
        ["Ambulance Fleet Unavailable", "High", "System immediately switches patient to Self-Transport mode with direct ER routing."],
        ["Operator Miscommunication / Error", "Medium", "Mandatory 10-module training certification; live booth supervisor monitoring; incident audits."],
        ["Statutory Emergency Service Conflict", "Medium", "NearER acts as non-clinical decision support; statutory 108/112 services are never delayed or replaced."]
    ]
    add_styled_table(
        headers=["RISK SCENARIO", "SEVERITY", "MITIGATION & FALLBACK PROTOCOL"],
        rows=risk_rows,
        col_widths=[1.8, 0.9, 3.57]
    )

    # =============================================================
    # SECTION 18 — PILOT IMPLEMENTATION PLAN
    # =============================================================
    add_heading_1("Section 18 — Pilot Implementation Plan & Timeline")
    
    doc.add_paragraph(
        "NearER will be deployed in a controlled 6-month pilot zone to validate operational metrics before wider scaling."
    )

    add_diagram("diagrams/diagram_8_pilot_timeline.png", "NearER 8-Phase Pilot Implementation Timeline (Months 1–6)")

    add_heading_2("Baseline Target Metrics for Pilot Phase")
    add_styled_table(
        headers=["METRIC CATEGORY", "PILOT BASELINE TARGET"],
        rows=[
            ["Participating Hospitals Onboarded", "3 to 5 Verified Tertiary & Secondary Hospitals"],
            ["Emergency Ambulance Units Mapped", "5 to 10 ALS / BLS Ambulance Fleets"],
            ["NGO Control Booths Established", "1 to 3 Operational Community Help Desks"],
            ["Trained & Certified NGO Volunteers", "10 to 20 Operator Candidates"],
            ["Community Awareness Reach", "500 to 1,000 Citizens Registered & Educated"],
            ["Target Pilot Region", "Designated Urban / Suburban Municipal Zone"]
        ],
        col_widths=[2.8, 3.47]
    )

    # =============================================================
    # SECTION 19 — NGO PROMOTION & CAMPAIGN STRATEGY
    # =============================================================
    add_heading_1("Section 19 — NGO Community Promotion & Awareness Campaigns")
    
    doc.add_paragraph(
        "The NGO partner leads creative, high-impact public awareness campaigns under responsible messaging guidelines."
    )

    add_heading_2("Core Campaign Themes")
    campaigns = [
        ("Campaign 1: 'Know Before the Emergency'", "Focuses on pre-registering family blood groups, emergency contacts, and allergies into the NearER profile."),
        ("Campaign 2: 'Right Hospital. Right Time.'", "Educates citizens on why going to the nearest hospital can cause dangerous delays if beds or specialists are lacking."),
        ("Campaign 3: 'Emergency Preparedness with NearER'", "Community workshops teaching youth, college students, and society leaders how to trigger SOS requests.")
    ]
    for title, desc in campaigns:
        add_heading_3(title)
        doc.add_paragraph(desc)

    add_callout(
        "RESPONSIBLE MESSAGING RULES:\n"
        "• NEVER claim: 'NearER guarantees to save every life.'\n"
        "• ALWAYS claim: 'NearER is designed to reduce avoidable emergency coordination delays.'\n"
        "• ALWAYS emphasize that clinical medical treatment is delivered by qualified hospital doctors.",
        title="PUBLIC MESSAGING GUIDELINES"
    )

    # =============================================================
    # SECTION 20 — MEASURABLE KPIS
    # =============================================================
    add_heading_1("Section 20 — Measurable Key Performance Indicators (KPIs)")
    
    doc.add_paragraph(
        "Program success is evaluated across four quantitative metric domains."
    )

    kpi_rows = [
        ["Community Outreach", "Citizens Reached in Awareness Campaigns", ">= 1,000 Citizens in Pilot Zone"],
        ["User Adoption", "NearER App Profiles Registered & Pre-filled", ">= 500 Pre-registered Profiles"],
        ["Operational Speed", "Average Decision Engine Hospital Search Time", "< 2.0 Seconds per Request"],
        ["Hospital Responsiveness", "Hospital Control Desk Acknowledgment Rate", ">= 90% Case Review within 60s"],
        ["Data Quality", "Hospital Capacity Data Freshness Compliance", ">= 85% Updated within 30 mins"],
        ["Control Booth Impact", "Assisted Emergency Requests Handled by Booth", "100% Logged with Zero Errors"],
        ["User Satisfaction", "Patient & Relatives System Satisfaction Rating", ">= 85% Positive Feedback Score"]
    ]
    add_styled_table(
        headers=["DOMAIN", "KEY PERFORMANCE INDICATOR (KPI)", "TARGET BENCHMARK"],
        rows=kpi_rows,
        col_widths=[1.5, 2.7, 2.07]
    )

    # =============================================================
    # SECTION 21 — LONG-TERM VISION & SCALABILITY
    # =============================================================
    add_heading_1("Section 21 — Long-Term Vision & Scalability Roadmap")
    
    doc.add_paragraph(
        "NearER is designed to scale progressively from a local municipal pilot into a state and national emergency coordination grid."
    )

    add_diagram("diagrams/diagram_9_expansion_roadmap.png", "NearER Scalable Long-Term Expansion Roadmap (Stages 1–5)")

    doc.add_paragraph(
        "*Note: Multi-state and governmental integration phases require formal regulatory, healthcare authority, and institutional approvals."
    )

    # =============================================================
    # SECTION 22 — EXPECTED SOCIAL IMPACT
    # =============================================================
    add_heading_1("Section 22 — Expected Social Impact Assessment")
    
    doc.add_paragraph(
        "NearER delivers profound social return on investment (SROI) across public health ecosystems:"
    )

    impact_items = [
        ("Reduction in Avoidable Hospital Ping-Ponging", "Prevents critical trauma and cardiac patients from being turned away at full emergency rooms."),
        ("Golden Hour Optimization", "Saves an estimated 20–45 minutes in initial emergency response and hospital placement."),
        ("Democratized Health Access for Senior Citizens", "NGO Control Booths ensure digitally inexperienced and elderly citizens receive equal access to emergency coordination."),
        ("Optimized Resource Utilization for Hospitals", "Distributes emergency patient load evenly across municipal networks, preventing single-hospital congestion.")
    ]
    for title, desc in impact_items:
        add_heading_3(title)
        doc.add_paragraph(desc)

    # =============================================================
    # SECTION 23 — PARTNERSHIP PROPOSAL TO NGO
    # =============================================================
    add_heading_1("Section 23 — Official Partnership Proposal & Invitation to NGO")
    
    doc.add_paragraph(
        "We formally invite your esteemed organization to join NearER as an official institutional partner."
    )

    add_callout(
        "PROPOSED NGO PARTNER DESIGNATION:\n"
        "“NearER Community Outreach & Emergency Coordination Partner”",
        title="OFFICIAL DESIGNATION OFFER",
        bg_hex="EFF6FF",
        border_hex="0052FF"
    )

    add_heading_2("Bilateral Contributions Matrix")
    add_styled_table(
        headers=["NearER PLATFORM CONTRIBUTIONS", "NGO PARTNER CONTRIBUTIONS"],
        rows=[
            ["Complete NearER Cloud Software & Mobile Apps", "Community Volunteer Mobilization & Staffing"],
            ["Control Booth Web Dashboard Access", "Control Booth Physical / Office Location Space"],
            ["10-Module Volunteer Training Curriculum & Materials", "Local Community Awareness & School/College Drives"],
            ["24/7 Technical Support & Cloud Server Maintenance", "Hospital & Local Ambulance Network Introductions"],
            ["Promotional Banners, Digital Graphics & Flyer Templates", "Field Feedback, Audit Logging & Service Monitoring"],
            ["Executive Analytics & Social Impact Audit Reports", "Support for Elderly & Non-Digital Citizens"]
        ],
        col_widths=[3.13, 3.14]
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(20)

    # Endorsement Block Table
    add_styled_table(
        headers=["ACCEPTED & ENDORSED BY NEARER TEAM", "ACCEPTED & ENDORSED BY NGO PARTNER"],
        rows=[
            ["Signature: ___________________________\n\nName: NearER Project Directorate\nTitle: Chief Operations Officer\nDate: September 23, 2026",
             "Signature: ___________________________\n\nName: _________________________________\nTitle: Executive Director / Secretary\nDate: _________________________________"]
        ],
        col_widths=[3.13, 3.14]
    )

    # Save document
    filename = "NearER_NGO_Partnership_Framework.docx"
    doc.save(filename)
    print(f"Document successfully created: {filename}")

if __name__ == "__main__":
    create_document()
