-- ==========================================================
-- NearER Complete Production Database Schema & Seed Data
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/oqjfknreyifhcdkucdnn/sql/new
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- 4. Medical Documents
CREATE TABLE IF NOT EXISTS public.medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Hospitals
CREATE TABLE IF NOT EXISTS public.hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    emergency_available BOOLEAN DEFAULT TRUE,
    is_24x7 BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Hospital Capabilities
CREATE TABLE IF NOT EXISTS public.hospital_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    capability_type TEXT NOT NULL,
    capability_name TEXT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Hospital Capacity
CREATE TABLE IF NOT EXISTS public.hospital_capacity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    er_status TEXT DEFAULT 'OPEN',
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

-- 8. Blood Inventory
CREATE TABLE IF NOT EXISTS public.blood_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    blood_group TEXT NOT NULL,
    availability_status TEXT DEFAULT 'AVAILABLE',
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Emergency Requests (Central Emergency Case Entity)
CREATE TABLE IF NOT EXISTS public.emergency_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT UNIQUE NOT NULL,
    user_id UUID,
    patient_name TEXT NOT NULL,
    patient_mobile TEXT NOT NULL,
    number_of_patients INTEGER DEFAULT 1,
    emergency_type TEXT NOT NULL,
    description TEXT,
    origin_latitude DOUBLE PRECISION NOT NULL,
    origin_longitude DOUBLE PRECISION NOT NULL,
    origin_text TEXT,
    selected_hospital_id TEXT REFERENCES public.hospitals(id),
    status TEXT DEFAULT 'DRAFT' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 10. Emergency Voice Notes
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

-- 12. Emergency Messages (Case-specific Patient <-> Hospital)
CREATE TABLE IF NOT EXISTS public.emergency_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_request_id UUID REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    message_type TEXT DEFAULT 'TEXT',
    message_text TEXT,
    voice_file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    read_at TIMESTAMPTZ
);

-- 13. Emergency Location Updates
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

-- 15. NearER Reach: Relay Operators
CREATE TABLE IF NOT EXISTS public.relay_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ONLINE',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 16. NearER Reach: Rural SOS Cases
CREATE TABLE IF NOT EXISTS public.rural_sos_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT UNIQUE NOT NULL,
    caller_number TEXT NOT NULL,
    language TEXT DEFAULT 'Hindi (hi-IN)',
    reported_location_text TEXT,
    resolved_latitude DOUBLE PRECISION,
    resolved_longitude DOUBLE PRECISION,
    location_confidence TEXT DEFAULT 'HIGH',
    emergency_summary TEXT,
    status TEXT DEFAULT 'SOS_RECEIVED' NOT NULL,
    assigned_operator_id UUID REFERENCES public.relay_operators(id),
    selected_facility_id TEXT REFERENCES public.hospitals(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 17. NearER Reach: Rural Voice Recordings
CREATE TABLE IF NOT EXISTS public.rural_voice_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rural_sos_case_id UUID REFERENCES public.rural_sos_cases(id) ON DELETE CASCADE,
    recording_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 18. NearER Reach: Facility Alerts
CREATE TABLE IF NOT EXISTS public.facility_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rural_sos_case_id UUID REFERENCES public.rural_sos_cases(id) ON DELETE CASCADE,
    hospital_id TEXT REFERENCES public.hospitals(id),
    alert_order INTEGER DEFAULT 1,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    acknowledged_at TIMESTAMPTZ
);

-- 19. NearER Reach: Escalation Events
CREATE TABLE IF NOT EXISTS public.escalation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rural_sos_case_id UUID REFERENCES public.rural_sos_cases(id) ON DELETE CASCADE,
    from_hospital_id TEXT,
    to_hospital_id TEXT,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================================
-- ROW-LEVEL SECURITY & POLICIES
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rural_sos_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rural_voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_events ENABLE ROW LEVEL SECURITY;

-- Read policies for public health network
CREATE POLICY "Allow public read of hospitals" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "Allow public read of capabilities" ON public.hospital_capabilities FOR SELECT USING (true);
CREATE POLICY "Allow public read of capacity" ON public.hospital_capacity FOR SELECT USING (true);
CREATE POLICY "Allow public read of blood inventory" ON public.blood_inventory FOR SELECT USING (true);
CREATE POLICY "Allow public read of relay operators" ON public.relay_operators FOR SELECT USING (true);

-- Emergency case policies
CREATE POLICY "Allow public insert of emergency requests" ON public.emergency_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select of emergency requests" ON public.emergency_requests FOR SELECT USING (true);
CREATE POLICY "Allow public update of emergency requests" ON public.emergency_requests FOR UPDATE USING (true);

-- Emergency messages policies
CREATE POLICY "Allow public select of messages" ON public.emergency_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert of messages" ON public.emergency_messages FOR INSERT WITH CHECK (true);

-- Rural SOS policies
CREATE POLICY "Allow public insert of rural cases" ON public.rural_sos_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select of rural cases" ON public.rural_sos_cases FOR SELECT USING (true);
CREATE POLICY "Allow public update of rural cases" ON public.rural_sos_cases FOR UPDATE USING (true);
CREATE POLICY "Allow public manage of rural voice" ON public.rural_voice_recordings FOR ALL USING (true);
CREATE POLICY "Allow public manage of alerts" ON public.facility_alerts FOR ALL USING (true);
CREATE POLICY "Allow public manage of escalations" ON public.escalation_events FOR ALL USING (true);

-- Emergency profiles & docs
CREATE POLICY "Allow public manage of emergency profiles" ON public.emergency_profiles FOR ALL USING (true);
CREATE POLICY "Allow public manage of medical documents" ON public.medical_documents FOR ALL USING (true);

-- ==========================================================
-- SEED DATA: OPERATORS & 12 HOSPITALS
-- ==========================================================
INSERT INTO public.relay_operators (id, name, email, status) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Priya Sharma', 'priya.sharma@nearer-reach.in', 'ONLINE'),
    ('22222222-2222-2222-2222-222222222222', 'Rajesh Kumar', 'rajesh.kumar@nearer-reach.in', 'ONLINE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hospitals (id, name, phone_number, email, address, city, state, postal_code, latitude, longitude, is_verified, emergency_available, is_24x7, last_updated) VALUES
    ('apollo', 'Apollo City Hospital (DEMO)', '+91 124 456 7890', 'emergency@apollo-demo.org', 'Sector 44, Golf Course Extension Road', 'Gurgaon', 'Haryana', '122003', 28.4595, 77.0724, TRUE, TRUE, TRUE, NOW()),
    ('medanta', 'Medanta The Medicity (DEMO)', '+91 124 383 8383', 'er@medanta-demo.org', 'CH Bakhtawar Singh Rd, Sector 38', 'Gurgaon', 'Haryana', '122001', 28.4390, 77.0425, TRUE, TRUE, TRUE, NOW()),
    ('fortis', 'Fortis Memorial Research Institute (DEMO)', '+91 124 492 1021', 'trauma@fortis-demo.org', 'Sector 44, Opp. HUDA City Centre', 'Gurgaon', 'Haryana', '122002', 28.4601, 77.0735, TRUE, TRUE, TRUE, NOW()),
    ('artemis', 'Artemis Hospital (DEMO)', '+91 124 451 1111', 'triage@artemis-demo.org', 'Sector 51, Near Artemis Roundabout', 'Gurgaon', 'Haryana', '122001', 28.4367, 77.0864, TRUE, TRUE, TRUE, NOW()),
    ('max', 'Max Super Speciality Hospital (DEMO)', '+91 124 662 3000', 'dispatch@max-demo.org', 'B-Block, Sushant Lok Phase I', 'Gurgaon', 'Haryana', '122001', 28.4695, 77.0820, TRUE, TRUE, TRUE, NOW()),
    ('paras', 'Paras Health (DEMO)', '+91 124 458 5555', 'er@paras-demo.org', 'C-1, Sushant Lok Phase I, Sector 43', 'Gurgaon', 'Haryana', '122002', 28.4623, 77.0910, TRUE, TRUE, TRUE, NOW()),
    ('ck_birla', 'CK Birla Hospital (DEMO)', '+91 124 488 2244', 'emergency@ckbirla-demo.org', 'Block J, Mayfield Garden, Sector 51', 'Gurgaon', 'Haryana', '122018', 28.4285, 77.0678, TRUE, TRUE, TRUE, NOW()),
    ('manipal', 'Manipal Hospital (DEMO)', '+91 124 616 0000', 'codeblue@manipal-demo.org', 'Sector 6, Palam Vihar', 'Gurgaon', 'Haryana', '122017', 28.5082, 77.0392, TRUE, TRUE, TRUE, NOW()),
    ('park', 'Park Hospital (DEMO)', '+91 124 490 0000', 'frontdesk@park-demo.org', 'Q-Block, South City II, Sector 47', 'Gurgaon', 'Haryana', '122018', 28.4250, 77.0450, TRUE, TRUE, TRUE, NOW()),
    ('w_pratiksha', 'W Pratiksha Hospital (DEMO)', '+91 124 413 1010', 'triage@wpratiksha-demo.org', 'Golf Course Ext Rd, Sushant Lok II', 'Gurgaon', 'Haryana', '122052', 28.4380, 77.0980, TRUE, TRUE, TRUE, NOW()),
    ('narayana', 'Narayana Superspeciality (DEMO)', '+91 124 472 8888', 'er@narayana-demo.org', 'Plot 3201, Block - V, DLF Phase 3', 'Gurgaon', 'Haryana', '122022', 28.4890, 77.1020, TRUE, TRUE, TRUE, NOW()),
    ('civil_hospital', 'District Civil Hospital (DEMO)', '+91 124 232 2412', 'civil@haryanahealth-demo.gov.in', 'Civil Lines, Near Mor Chowk', 'Gurgaon', 'Haryana', '122001', 28.4620, 77.0310, TRUE, TRUE, TRUE, NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

INSERT INTO public.hospital_capacity (hospital_id, er_status, er_beds_available, er_beds_total, icu_beds_available, icu_beds_total, ventilators_available, ventilators_total, ot_rooms_available, ot_rooms_total) VALUES
    ('apollo', 'OPEN', 4, 12, 2, 8, 3, 6, 2, 4),
    ('medanta', 'OPEN', 6, 24, 4, 16, 6, 12, 3, 8),
    ('fortis', 'OPEN', 3, 14, 1, 10, 2, 8, 1, 4),
    ('artemis', 'OPEN', 5, 16, 3, 12, 4, 10, 2, 5),
    ('max', 'OPEN', 2, 10, 2, 8, 2, 6, 1, 3),
    ('paras', 'OPEN', 3, 12, 2, 6, 2, 5, 1, 3),
    ('ck_birla', 'OPEN', 4, 10, 1, 5, 1, 4, 2, 3),
    ('manipal', 'OPEN', 5, 18, 3, 10, 3, 8, 2, 4),
    ('park', 'OPEN', 2, 8, 1, 4, 1, 3, 1, 2),
    ('w_pratiksha', 'OPEN', 3, 10, 2, 6, 2, 4, 1, 2),
    ('narayana', 'OPEN', 4, 14, 2, 8, 3, 6, 2, 4),
    ('civil_hospital', 'OPEN', 8, 30, 2, 12, 4, 10, 2, 6);

INSERT INTO public.hospital_capabilities (hospital_id, capability_type, capability_name, is_available) VALUES
    ('apollo', 'Specialty', 'Cardiology', TRUE),
    ('apollo', 'Specialty', 'Trauma', TRUE),
    ('apollo', 'Specialty', 'Neurology', TRUE),
    ('apollo', 'Specialty', 'Respiratory', TRUE),
    ('apollo', 'Facility', 'Cath Lab 24x7', TRUE),
    ('apollo', 'Facility', 'CT/MRI Scan', TRUE),

    ('medanta', 'Specialty', 'Cardiology', TRUE),
    ('medanta', 'Specialty', 'Trauma', TRUE),
    ('medanta', 'Specialty', 'Stroke Unit', TRUE),
    ('medanta', 'Specialty', 'Burn Care', TRUE),
    ('medanta', 'Specialty', 'Organ Transplant', TRUE),

    ('fortis', 'Specialty', 'Cardiology', TRUE),
    ('fortis', 'Specialty', 'Neurology', TRUE),
    ('fortis', 'Specialty', 'Pediatric Emergency', TRUE),
    ('fortis', 'Specialty', 'Trauma', TRUE),

    ('artemis', 'Specialty', 'Cardiology', TRUE),
    ('artemis', 'Specialty', 'Neurology', TRUE),
    ('artemis', 'Specialty', 'Trauma', TRUE),
    ('artemis', 'Specialty', 'Severe Bleeding', TRUE),

    ('max', 'Specialty', 'Cardiology', TRUE),
    ('max', 'Specialty', 'Trauma', TRUE),
    ('max', 'Specialty', 'Breathing Emergency', TRUE),

    ('civil_hospital', 'Specialty', 'General Emergency', TRUE),
    ('civil_hospital', 'Specialty', 'Trauma', TRUE),
    ('civil_hospital', 'Specialty', 'Maternity Emergency', TRUE);

INSERT INTO public.blood_inventory (hospital_id, blood_group, availability_status) VALUES
    ('apollo', 'O+', 'AVAILABLE'),
    ('apollo', 'O-', 'AVAILABLE'),
    ('apollo', 'A+', 'AVAILABLE'),
    ('apollo', 'B+', 'AVAILABLE'),

    ('medanta', 'O+', 'AVAILABLE'),
    ('medanta', 'O-', 'AVAILABLE'),
    ('medanta', 'A+', 'AVAILABLE'),
    ('medanta', 'B+', 'AVAILABLE'),
    ('medanta', 'AB+', 'AVAILABLE'),

    ('fortis', 'O+', 'AVAILABLE'),
    ('fortis', 'O-', 'LIMITED'),
    ('fortis', 'A+', 'AVAILABLE'),

    ('artemis', 'O+', 'AVAILABLE'),
    ('artemis', 'O-', 'AVAILABLE'),
    ('artemis', 'B+', 'AVAILABLE'),

    ('civil_hospital', 'O+', 'AVAILABLE'),
    ('civil_hospital', 'A+', 'AVAILABLE'),
    ('civil_hospital', 'B+', 'AVAILABLE');
