-- ==============================================================================
-- AERVA / NearER All-In-One Unified Database Setup & Seed Script
-- Project ID: yhrcmowjsuagrhxlchvr
-- Supabase Dashboard URL: https://supabase.com/dashboard/project/yhrcmowjsuagrhxlchvr/sql/new
--
-- Instructions:
-- 1. Open your Supabase Dashboard SQL Editor at the URL above.
-- 2. Paste this entire script and click "RUN".
-- 3. All tables, views, RLS policies, realtime publications, and verified
--    hospital seed telemetry will be initialized cleanly with idempotency.
-- ==============================================================================

-- 0. Enable Essential PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- SECTION 1: CORE HEALTHCARE & PATIENT ACCOUNT TABLES
-- ==============================================================================

-- 1. Profiles (Patient Account Base)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    email TEXT,
    date_of_birth DATE,
    gender TEXT,
    blood_group TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Emergency Profiles (Saved Emergency-ready Health Passport)
CREATE TABLE IF NOT EXISTS public.emergency_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE,
    blood_group TEXT,
    known_allergies JSONB DEFAULT '[]'::jsonb,
    medical_conditions JSONB DEFAULT '[]'::jsonb,
    current_medications JSONB DEFAULT '[]'::jsonb,
    emergency_notes TEXT,
    profile_completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Medical Documents (Digital Document Vault)
CREATE TABLE IF NOT EXISTS public.medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL, -- prescription, report, discharge_summary, other
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- SECTION 2: HOSPITAL DIRECTORY & LIVE CAPACITY TABLES
-- ==============================================================================

-- 5. Hospitals Table (Authorized Registry & Google Places Correlation)
CREATE TABLE IF NOT EXISTS public.hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_verified BOOLEAN DEFAULT true,
    verification_status TEXT DEFAULT 'AERVA_VERIFIED_CURRENT', -- AERVA_VERIFIED_CURRENT, verified, unverified, pending
    verification_source TEXT DEFAULT 'authorized_hospital',
    emergency_available BOOLEAN DEFAULT true,
    is_24x7 BOOLEAN DEFAULT true,
    google_place_id TEXT,
    identity_verified_at TIMESTAMPTZ DEFAULT NOW(),
    resource_updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_google_place_id ON public.hospitals(google_place_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_verification ON public.hospitals(verification_status);

-- 6. Hospital Capabilities
CREATE TABLE IF NOT EXISTS public.hospital_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    capability_type TEXT NOT NULL, -- Specialty, Facility, Service
    capability_name TEXT NOT NULL, -- Cardiology, Trauma, Stroke Unit, ICU, Burn Care
    is_available BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Hospital Capacity (Authorized Live Resource Telemetry)
CREATE TABLE IF NOT EXISTS public.hospital_capacity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id TEXT UNIQUE REFERENCES public.hospitals(id) ON DELETE CASCADE,
    er_status TEXT DEFAULT 'OPEN', -- OPEN, FULL, SURGE, DIVERTING
    er_beds_available INTEGER DEFAULT 0,
    er_beds_total INTEGER DEFAULT 0,
    icu_beds_available INTEGER DEFAULT 0,
    icu_beds_total INTEGER DEFAULT 0,
    ventilators_available INTEGER DEFAULT 0,
    ventilators_total INTEGER DEFAULT 0,
    ot_rooms_available INTEGER DEFAULT 0,
    ot_rooms_total INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hospital_capacity_hospital ON public.hospital_capacity(hospital_id);

-- 8. Blood Inventory
CREATE TABLE IF NOT EXISTS public.blood_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    blood_group TEXT NOT NULL, -- A+, A-, B+, B-, AB+, AB-, O+, O-
    availability_status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, LIMITED, UNAVAILABLE
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- SECTION 3: EMERGENCY CASE COORDINATION & MESSAGING TABLES
-- ==============================================================================

-- 9. Emergency Requests (Central Emergency Case Entity)
CREATE TABLE IF NOT EXISTS public.emergency_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT UNIQUE NOT NULL, -- e.g. NR-10482
    user_id UUID,
    patient_name TEXT NOT NULL,
    patient_mobile TEXT NOT NULL,
    number_of_patients INTEGER DEFAULT 1,
    emergency_type TEXT NOT NULL, -- cardiac, trauma, stroke, burns, respiratory, other
    description TEXT,
    origin_latitude DOUBLE PRECISION NOT NULL,
    origin_longitude DOUBLE PRECISION NOT NULL,
    origin_text TEXT,
    selected_hospital_id TEXT REFERENCES public.hospitals(id),
    status TEXT DEFAULT 'DRAFT' NOT NULL, -- DRAFT, REQUEST_SENT, HOSPITAL_REVIEWING, REQUEST_VERIFIED, HOSPITAL_ACCEPTED, CAPACITY_RESERVED, EN_ROUTE, ARRIVED, COMPLETED, DECLINED
    nodus_request_id TEXT,
    agent37_execution_id TEXT,
    clinical_requirements JSONB DEFAULT '{}'::jsonb,
    structured_interpretation JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_emergency_requests_case_id ON public.emergency_requests(case_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON public.emergency_requests(status);

-- 10. Emergency Voice Notes (AERVA Sense Audio Storage)
CREATE TABLE IF NOT EXISTS public.emergency_voice_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_request_id UUID REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    user_id UUID,
    file_path TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Emergency Shared Documents
CREATE TABLE IF NOT EXISTS public.emergency_shared_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_request_id UUID REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    document_id UUID NOT NULL,
    document_type TEXT NOT NULL,
    shared_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. Emergency Messages (Realtime Patient <-> Hospital Triage Chat)
CREATE TABLE IF NOT EXISTS public.emergency_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_request_id UUID REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL, -- PATIENT, HOSPITAL, DISPATCHER, SYSTEM
    sender_id TEXT NOT NULL,
    message_type TEXT DEFAULT 'TEXT', -- TEXT, VOICE, SYSTEM
    message_text TEXT,
    voice_file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    read_at TIMESTAMPTZ
);

-- 13. Emergency Location Updates (Ambulance & Patient Navigation Breadcrumbs)
CREATE TABLE IF NOT EXISTS public.emergency_location_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_request_id UUID REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 14. Emergency Case Events (Timeline Audit Log)
CREATE TABLE IF NOT EXISTS public.emergency_case_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_request_id UUID REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- SECTION 4: AERVA REACH (108 DISPATCH & RURAL LOW-CONNECTIVITY)
-- ==============================================================================

-- 15. Relay Operators (108 Dispatch Personnel)
CREATE TABLE IF NOT EXISTS public.relay_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ONLINE', -- ONLINE, BUSY, OFFLINE
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 16. Rural SOS Cases (Voice-first Keypad / Low-Connectivity Emergency Cases)
CREATE TABLE IF NOT EXISTS public.rural_sos_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT UNIQUE NOT NULL, -- e.g. NR-R-10482
    caller_number TEXT NOT NULL,
    language TEXT DEFAULT 'Hindi (hi-IN)',
    reported_location_text TEXT,
    resolved_latitude DOUBLE PRECISION,
    resolved_longitude DOUBLE PRECISION,
    location_confidence TEXT DEFAULT 'HIGH', -- HIGH, MEDIUM, NEEDS_CONFIRMATION
    emergency_summary TEXT,
    status TEXT DEFAULT 'SOS_RECEIVED' NOT NULL,
    assigned_operator_id UUID REFERENCES public.relay_operators(id),
    selected_facility_id TEXT REFERENCES public.hospitals(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 17. Rural Voice Recordings
CREATE TABLE IF NOT EXISTS public.rural_voice_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rural_sos_case_id UUID REFERENCES public.rural_sos_cases(id) ON DELETE CASCADE,
    recording_type TEXT NOT NULL, -- LOCATION, EMERGENCY
    file_path TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 18. Facility Alerts (Alert queue per facility with timeout/response tracking)
CREATE TABLE IF NOT EXISTS public.facility_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rural_sos_case_id UUID REFERENCES public.rural_sos_cases(id) ON DELETE CASCADE,
    hospital_id TEXT REFERENCES public.hospitals(id),
    alert_order INTEGER DEFAULT 1,
    status TEXT DEFAULT 'PENDING' NOT NULL, -- PENDING, ACKNOWLEDGED, DECLINED, NO_RESPONSE
    sent_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    acknowledged_at TIMESTAMPTZ
);

-- 19. Escalation Events
CREATE TABLE IF NOT EXISTS public.escalation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rural_sos_case_id UUID REFERENCES public.rural_sos_cases(id) ON DELETE CASCADE,
    from_hospital_id TEXT,
    to_hospital_id TEXT,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- SECTION 5: AERVA MULTI-AGENT AUDIT LOGS & BROWSER USE RESEARCH
-- ==============================================================================

-- 20. Integration Event Logs (Nodus, Agent37, ElevenLabs, Router Audit)
CREATE TABLE IF NOT EXISTS public.integration_event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL, -- NODUS, AGENT37, ELEVENLABS, GOOGLE_PLACES, ROUTER, BROWSER_USE
    event_type TEXT NOT NULL,   -- INFERENCE_REQUEST, TOOL_CALL, DISCOVERY, STATUS_CHANGE, TRANSCRIPTION, RESEARCH
    request_id TEXT,
    execution_id TEXT,
    case_id TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    response_summary JSONB DEFAULT '{}'::jsonb,
    latency_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILED, FALLBACK
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_case_id ON public.integration_event_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_service ON public.integration_event_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON public.integration_event_logs(created_at DESC);

-- 21. Hospital Website Research (Browser Use Cloud Autonomous Research & Verification)
-- Clinical Safety Rule: Public website research NEVER populates live medical bed capacity.
CREATE TABLE IF NOT EXISTS public.hospital_website_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id TEXT NOT NULL,
    google_place_id TEXT,
    hospital_name TEXT NOT NULL,
    target_url TEXT,
    task_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED, STALE
    is_task_successful BOOLEAN DEFAULT false,
    findings JSONB DEFAULT '{
        "official_website": null,
        "phone_number": null,
        "address": null,
        "listed_emergency_department": null,
        "listed_icu": null,
        "listed_ambulance": null,
        "listed_oxygen": null,
        "key_specialties": [],
        "facilities_summary": ""
    }'::jsonb,
    source_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    retrieved_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    freshness_status TEXT NOT NULL DEFAULT 'FRESH', -- FRESH, STALE, UNKNOWN
    verification_label TEXT NOT NULL DEFAULT 'WEBSITE_INFORMATION_FOUND',
    disclaimer TEXT NOT NULL DEFAULT 'Public website information only. NOT confirmed live capacity or bed availability. Requires clinical review.',
    live_url TEXT,
    step_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_website_research_hospital_id ON public.hospital_website_research(hospital_id);
CREATE INDEX IF NOT EXISTS idx_website_research_task_id ON public.hospital_website_research(task_id);

-- ==============================================================================
-- SECTION 6: AERVA HOSPITAL DIRECTORY VIEW (Zero-Duplication Adapter)
-- ==============================================================================

CREATE OR REPLACE VIEW public.aerva_hospital_directory AS
SELECT 
    h.id AS hospital_id,
    h.name AS hospital_name,
    h.google_place_id,
    CASE 
        WHEN h.is_verified IS TRUE OR h.verification_status IN ('verified', 'AERVA_VERIFIED_CURRENT') THEN 'verified'
        ELSE 'unverified'
    END AS verification_status,
    COALESCE(h.identity_verified_at, h.created_at, NOW()) AS identity_verified_at,
    COALESCE(h.verification_source, 'authorized_hospital') AS resource_source,
    COALESCE(h.resource_updated_at, c.updated_at, h.last_updated, NOW()) AS resources_updated_at,
    COALESCE(c.er_beds_available, 0) AS general_beds_available,
    COALESCE(c.icu_beds_available, 0) AS icu_beds_available,
    COALESCE(c.ventilators_available, 0) AS ventilators_available,
    (COALESCE(c.ventilators_available, 0) > 0) AS oxygen_support_available
FROM public.hospitals h
LEFT JOIN public.hospital_capacity c ON c.hospital_id = h.id;

-- ==============================================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rural_sos_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rural_voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_website_research ENABLE ROW LEVEL SECURITY;

-- Drop prior policies cleanly if re-running
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read hospitals" ON public.hospitals;
    DROP POLICY IF EXISTS "Public update hospitals" ON public.hospitals;
    DROP POLICY IF EXISTS "Public read capabilities" ON public.hospital_capabilities;
    DROP POLICY IF EXISTS "Public read capacity" ON public.hospital_capacity;
    DROP POLICY IF EXISTS "Public update capacity" ON public.hospital_capacity;
    DROP POLICY IF EXISTS "Public read blood" ON public.blood_inventory;
    DROP POLICY IF EXISTS "Public manage emergency_requests" ON public.emergency_requests;
    DROP POLICY IF EXISTS "Public manage emergency_messages" ON public.emergency_messages;
    DROP POLICY IF EXISTS "Public manage emergency_profiles" ON public.emergency_profiles;
    DROP POLICY IF EXISTS "Public manage relay_operators" ON public.relay_operators;
    DROP POLICY IF EXISTS "Public manage rural_sos_cases" ON public.rural_sos_cases;
    DROP POLICY IF EXISTS "Public manage integration_event_logs" ON public.integration_event_logs;
    DROP POLICY IF EXISTS "Public manage hospital_website_research" ON public.hospital_website_research;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Permissive Demonstration / Hackathon Policies
CREATE POLICY "Public read hospitals" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "Public update hospitals" ON public.hospitals FOR ALL USING (true);
CREATE POLICY "Public read capabilities" ON public.hospital_capabilities FOR SELECT USING (true);
CREATE POLICY "Public read capacity" ON public.hospital_capacity FOR SELECT USING (true);
CREATE POLICY "Public update capacity" ON public.hospital_capacity FOR ALL USING (true);
CREATE POLICY "Public read blood" ON public.blood_inventory FOR SELECT USING (true);

CREATE POLICY "Public manage emergency_requests" ON public.emergency_requests FOR ALL USING (true);
CREATE POLICY "Public manage emergency_messages" ON public.emergency_messages FOR ALL USING (true);
CREATE POLICY "Public manage emergency_profiles" ON public.emergency_profiles FOR ALL USING (true);

CREATE POLICY "Public manage relay_operators" ON public.relay_operators FOR ALL USING (true);
CREATE POLICY "Public manage rural_sos_cases" ON public.rural_sos_cases FOR ALL USING (true);
CREATE POLICY "Public manage integration_event_logs" ON public.integration_event_logs FOR ALL USING (true);
CREATE POLICY "Public manage hospital_website_research" ON public.hospital_website_research FOR ALL USING (true);

-- ==============================================================================
-- SECTION 8: REALTIME PUBLICATION SUBSCRIPTION
-- ==============================================================================

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_messages;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_capacity;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rural_sos_cases;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_event_logs;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==============================================================================
-- SECTION 9: SEED DATA (VERIFIED HEALTHCARE HUBS & DISPATCH STATIONS)
-- ==============================================================================

-- 1. Relay Operators (108 Emergency Control)
INSERT INTO public.relay_operators (id, name, email, status) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Priya Sharma (108 Lead)', 'priya.sharma@assam.108.gov.in', 'ONLINE'),
    ('22222222-2222-2222-2222-222222222222', 'Rajesh Kumar (Senior Dispatcher)', 'rajesh.kumar@assam.108.gov.in', 'ONLINE')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Verified Hospitals: Guwahati Regional Hub, Kolkata Regional Hub & National Demo Hubs
INSERT INTO public.hospitals (
    id, name, phone_number, email, address, city, state, postal_code,
    latitude, longitude, is_verified, verification_status, verification_source,
    emergency_available, is_24x7, google_place_id, identity_verified_at, last_updated
) VALUES
    -- Guwahati (Assam) Healthcare Network
    ('h_gmch_guw', 'Gauhati Medical College and Hospital (GMCH)', '+91 361 252 9457', 'er@gmch.assam.gov.in', 'Narakasur Hilltop, Bhangagarh', 'Guwahati', 'Assam', '781032', 26.1558, 91.7695, true, 'verified', 'authorized_hospital', true, true, 'osm_gmch_guw', NOW(), NOW()),
    ('gmch', 'Gauhati Medical College and Hospital (GMCH)', '+91 361 252 9457', 'er@gmch.assam.gov.in', 'Narakasur Hilltop, Bhangagarh', 'Guwahati', 'Assam', '781032', 26.1558, 91.7695, true, 'verified', 'authorized_hospital', true, true, 'osm_gmch_guw', NOW(), NOW()),
    ('h_satribari_guw', 'Satribari Christian Hospital', '+91 361 260 0300', 'emergency@satribari.org', 'Assam Trunk Road, Paltan Bazaar', 'Guwahati', 'Assam', '781008', 26.1769, 91.7465, true, 'verified', 'authorized_hospital', true, true, 'osm_239459798', NOW(), NOW()),
    ('satribari', 'Satribari Christian Hospital', '+91 361 260 0300', 'emergency@satribari.org', 'Assam Trunk Road, Paltan Bazaar', 'Guwahati', 'Assam', '781008', 26.1769, 91.7465, true, 'verified', 'authorized_hospital', true, true, 'osm_239459798', NOW(), NOW()),
    ('h_apollo_guw', 'Apollo Excelcare Hospital', '+91 361 234 5555', 'er@apollo-excelcare.com', 'Paschim Boragaon, NH-37 Bypass', 'Guwahati', 'Assam', '781033', 26.1388, 91.7012, true, 'verified', 'authorized_hospital', true, true, 'osm_apollo_guw', NOW(), NOW()),
    ('apollo_ghy', 'Apollo Excelcare Hospital', '+91 361 234 5555', 'er@apollo-excelcare.com', 'Paschim Boragaon, NH-37 Bypass', 'Guwahati', 'Assam', '781033', 26.1388, 91.7012, true, 'verified', 'authorized_hospital', true, true, 'osm_apollo_guw', NOW(), NOW()),
    ('marwari_ghy', 'Marwari Hospitals', '+91 361 260 2784', 'info@marwari.org', 'Sati Jaimati Road, Athgaon', 'Guwahati', 'Assam', '781001', 26.1780, 91.7410, false, 'unverified', 'public_discovery', false, false, 'osm_marwari_ghy', NOW(), NOW()),
    ('mmc_ghy', 'Mahendra Mohan Choudhury Hospital (MMC)', '+91 361 254 3998', 'info@mmc-guwahati.gov.in', 'MG Road, Panbazar', 'Guwahati', 'Assam', '781001', 26.1860, 91.7430, false, 'unverified', 'public_discovery', false, false, 'osm_mmc_ghy', NOW(), NOW()),
    ('city_care_web', 'City Care Emergency Clinic', '+91 361 245 8899', 'info@citycare.example.org', 'GS Road, Dispur', 'Guwahati', 'Assam', '781005', 26.1430, 91.7910, false, 'unverified', 'web_research', false, false, 'web_city_care', NOW(), NOW()),

    -- Kolkata (West Bengal) Healthcare Network
    ('h1', 'Apollo Multispeciality Hospitals', '+91 33 2320 3040', 'er@apollo-kolkata.org', '58 Canal Circular Road, Kadapara, Phool Bagan', 'Kolkata', 'West Bengal', '700054', 22.5694, 88.3986, true, 'verified', 'authorized_hospital', true, true, 'ChIJw87_example_apollo_kol', NOW(), NOW()),
    ('h2', 'AMRI Hospital Salt Lake', '+91 33 2335 7710', 'triage@amri-saltlake.org', 'JC - 16 & 17, Sector III, Salt Lake City', 'Kolkata', 'West Bengal', '700098', 22.5645, 88.4069, true, 'verified', 'authorized_hospital', true, true, 'ChIJe99_example_amri_saltlake', NOW(), NOW()),
    ('h3', 'Columbia Asia Hospital (Manipal)', '+91 33 6607 0000', 'er@columbia-kolkata.org', 'IB-193, Broadway Rd, Sector III, Salt Lake', 'Kolkata', 'West Bengal', '700098', 22.5683, 88.4087, true, 'verified', 'authorized_hospital', true, true, 'ChIJ_columbia_kol', NOW(), NOW()),
    ('h4', 'Subodh Mitra Cancer Hospital & Clinic', '+91 33 2337 1212', 'info@subodh-mitra.org', 'Block IB, Sector III, Salt Lake', 'Kolkata', 'West Bengal', '700098', 22.5670, 88.4112, false, 'unverified', 'public_discovery', false, false, 'ChIJ_subodh_kol', NOW(), NOW()),
    ('h5', 'Fortis Hospital Anandapur', '+91 33 6628 4444', 'emergency@fortis-kolkata.org', '730 Anandapur, E.M. Bypass Road', 'Kolkata', 'West Bengal', '700107', 22.5186, 88.4034, true, 'verified', 'authorized_hospital', true, true, 'ChIJb12_example_fortis', NOW(), NOW()),

    -- Delhi-NCR National Demo Network
    ('apollo', 'Apollo City Hospital (DEMO)', '+91 124 456 7890', 'emergency@apollo-demo.org', 'Sector 44, Golf Course Extension Road', 'Gurgaon', 'Haryana', '122003', 28.4595, 77.0724, TRUE, 'verified', 'authorized_hospital', TRUE, TRUE, 'ChIJw87_example_apollo_kol', NOW(), NOW()),
    ('medanta', 'Medanta The Medicity (DEMO)', '+91 124 383 8383', 'er@medanta-demo.org', 'CH Bakhtawar Singh Rd, Sector 38', 'Gurgaon', 'Haryana', '122001', 28.4390, 77.0425, TRUE, 'verified', 'authorized_hospital', TRUE, TRUE, 'ChIJe99_example_amri_saltlake', NOW(), NOW()),
    ('fortis', 'Fortis Memorial Research Institute (DEMO)', '+91 124 492 1021', 'trauma@fortis-demo.org', 'Sector 44, Opp. HUDA City Centre', 'Gurgaon', 'Haryana', '122002', 28.4601, 77.0735, TRUE, 'verified', 'authorized_hospital', TRUE, TRUE, 'ChIJb12_example_fortis', NOW(), NOW()),
    ('artemis', 'Artemis Hospital (DEMO)', '+91 124 451 1111', 'triage@artemis-demo.org', 'Sector 51, Near Artemis Roundabout', 'Gurgaon', 'Haryana', '122001', 28.4367, 77.0864, TRUE, 'verified', 'authorized_hospital', TRUE, TRUE, 'ChIJc34_example_artemis', NOW(), NOW()),
    ('max', 'Max Super Speciality Hospital (DEMO)', '+91 124 662 3000', 'dispatch@max-demo.org', 'B-Block, Sushant Lok Phase I', 'Gurgaon', 'Haryana', '122001', 28.4695, 77.0820, TRUE, 'verified', 'authorized_hospital', TRUE, TRUE, 'ChIJd56_example_max', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    is_verified = EXCLUDED.is_verified,
    verification_status = EXCLUDED.verification_status,
    identity_verified_at = EXCLUDED.identity_verified_at,
    last_updated = EXCLUDED.last_updated;

-- 3. Seed Live Bed Telemetry for Verified Hospitals
INSERT INTO public.hospital_capacity (
    hospital_id, er_beds_available, er_beds_total, icu_beds_available, icu_beds_total,
    ventilators_available, ventilators_total, ot_rooms_available, ot_rooms_total, er_status, updated_at
) VALUES
    ('h_gmch_guw', 16, 40, 6, 20, 10, 25, 4, 8, 'OPEN', NOW()),
    ('h_satribari_guw', 8, 20, 4, 10, 4, 8, 2, 4, 'OPEN', NOW()),
    ('h_apollo_guw', 12, 25, 5, 12, 5, 10, 3, 6, 'OPEN', NOW()),
    ('h1', 14, 30, 4, 18, 5, 20, 3, 6, 'OPEN', NOW()),
    ('h2', 8, 20, 5, 12, 6, 15, 2, 4, 'OPEN', NOW()),
    ('h5', 10, 24, 4, 14, 4, 12, 3, 5, 'OPEN', NOW()),
    ('apollo', 6, 20, 3, 10, 4, 8, 2, 4, 'OPEN', NOW()),
    ('medanta', 10, 30, 6, 16, 8, 14, 4, 8, 'OPEN', NOW()),
    ('fortis', 8, 22, 4, 12, 5, 10, 3, 6, 'OPEN', NOW()),
    ('artemis', 7, 18, 4, 10, 4, 8, 2, 4, 'OPEN', NOW()),
    ('max', 5, 16, 3, 8, 3, 6, 2, 4, 'OPEN', NOW())
ON CONFLICT (hospital_id) DO UPDATE SET
    er_beds_available = EXCLUDED.er_beds_available,
    er_beds_total = EXCLUDED.er_beds_total,
    icu_beds_available = EXCLUDED.icu_beds_available,
    icu_beds_total = EXCLUDED.icu_beds_total,
    ventilators_available = EXCLUDED.ventilators_available,
    er_status = EXCLUDED.er_status,
    updated_at = NOW();

-- 4. Seed Clinical Capabilities
INSERT INTO public.hospital_capabilities (hospital_id, capability_type, capability_name, is_available) VALUES
    ('h_gmch_guw', 'Specialty', 'Trauma Resuscitation', TRUE),
    ('h_gmch_guw', 'Specialty', 'Cardiology & Cath Lab', TRUE),
    ('h_gmch_guw', 'Specialty', 'Critical Care & Neurosurgery', TRUE),
    ('h_satribari_guw', 'Specialty', 'Emergency Triage', TRUE),
    ('h_satribari_guw', 'Specialty', 'Cardiac First Care', TRUE),
    ('h_satribari_guw', 'Specialty', 'Pediatric Emergency', TRUE),
    ('h_apollo_guw', 'Specialty', 'Interventional Cardiology', TRUE),
    ('h_apollo_guw', 'Specialty', 'Comprehensive Stroke Care', TRUE),
    ('h_apollo_guw', 'Specialty', 'Level 1 Trauma', TRUE),
    ('h1', 'Specialty', 'Cardiology', TRUE),
    ('h1', 'Specialty', 'Trauma', TRUE),
    ('h1', 'Specialty', 'Neurology', TRUE),
    ('h2', 'Specialty', 'Cardiology', TRUE),
    ('h2', 'Specialty', 'Stroke Unit', TRUE),
    ('h5', 'Specialty', 'Trauma', TRUE),
    ('h5', 'Specialty', 'Critical Care', TRUE)
ON CONFLICT DO NOTHING;

-- 5. Seed Blood Inventory
INSERT INTO public.blood_inventory (hospital_id, blood_group, availability_status) VALUES
    ('h_gmch_guw', 'O+', 'AVAILABLE'),
    ('h_gmch_guw', 'O-', 'AVAILABLE'),
    ('h_gmch_guw', 'A+', 'AVAILABLE'),
    ('h_gmch_guw', 'B+', 'AVAILABLE'),
    ('h_satribari_guw', 'O+', 'AVAILABLE'),
    ('h_satribari_guw', 'O-', 'LIMITED'),
    ('h_satribari_guw', 'B+', 'AVAILABLE'),
    ('h_apollo_guw', 'O+', 'AVAILABLE'),
    ('h_apollo_guw', 'A+', 'AVAILABLE'),
    ('h_apollo_guw', 'AB+', 'AVAILABLE'),
    ('h1', 'O+', 'AVAILABLE'),
    ('h1', 'O-', 'AVAILABLE'),
    ('h2', 'O+', 'AVAILABLE'),
    ('h5', 'O+', 'AVAILABLE')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- SETUP VERIFICATION QUERY
-- ==============================================================================
SELECT 
    'AERVA Supabase Setup Complete' AS status,
    (SELECT COUNT(*) FROM public.hospitals) AS total_hospitals,
    (SELECT COUNT(*) FROM public.hospital_capacity) AS capacity_records,
    (SELECT COUNT(*) FROM public.relay_operators) AS relay_operators,
    NOW() AS timestamp;
