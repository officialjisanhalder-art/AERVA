-- ==========================================================
-- NearER Core Database Schema Migration
-- Migration: 20260919000001_core_schema.sql
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
    user_id UUID UNIQUE,
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
    document_type TEXT NOT NULL, -- prescription, report, discharge_summary, other
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
    capability_type TEXT NOT NULL, -- e.g. Specialty, Facility, Service
    capability_name TEXT NOT NULL, -- Cardiology, Trauma, Neurology, Burn Care, etc.
    is_available BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Hospital Capacity
CREATE TABLE IF NOT EXISTS public.hospital_capacity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    er_status TEXT DEFAULT 'OPEN', -- OPEN, FULL, DIVERTING
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
    blood_group TEXT NOT NULL, -- A+, A-, B+, B-, AB+, AB-, O+, O-
    availability_status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, LIMITED, UNAVAILABLE
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Emergency Requests (The Central Case Entity)
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
    status TEXT DEFAULT 'DRAFT' NOT NULL, -- DRAFT, ANALYSING, BEST_MATCH_FOUND, REQUEST_SENT, HOSPITAL_REVIEWING, REQUEST_VERIFIED, HOSPITAL_ACCEPTED, CAPACITY_RESERVED, EN_ROUTE, ARRIVED, COMPLETED, CANCELLED
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 10. Emergency Voice Notes (Original Audio Storage)
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
    sender_type TEXT NOT NULL, -- PATIENT, HOSPITAL
    sender_id TEXT NOT NULL,
    message_type TEXT DEFAULT 'TEXT', -- TEXT, VOICE, SYSTEM
    message_text TEXT,
    voice_file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    read_at TIMESTAMPTZ
);

-- 13. Emergency Location Updates (Active Navigation Breadcrumbs)
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
    event_type TEXT NOT NULL, -- LOCATION_CAPTURED, VOICE_NOTE_ADDED, BEST_MATCH_FOUND, REQUEST_SENT, HOSPITAL_VERIFIED, HOSPITAL_ACCEPTED, NAVIGATION_STARTED, ARRIVED, COMPLETED
    event_description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_messages ENABLE ROW LEVEL SECURITY;

-- Public read access for verified hospitals and capacities
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of hospitals" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "Allow public read of capabilities" ON public.hospital_capabilities FOR SELECT USING (true);
CREATE POLICY "Allow public read of capacity" ON public.hospital_capacity FOR SELECT USING (true);
CREATE POLICY "Allow public read of blood inventory" ON public.blood_inventory FOR SELECT USING (true);

-- User-scoped policies
CREATE POLICY "Users can manage their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own emergency profile" ON public.emergency_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their prescriptions" ON public.prescriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their medical documents" ON public.medical_documents
    FOR ALL USING (auth.uid() = user_id);

-- Emergency requests: users can see their own, guests can create via service role or public insert
CREATE POLICY "Allow anyone to create an emergency request" ON public.emergency_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read access to emergency case by case_id" ON public.emergency_requests
    FOR SELECT USING (true);

CREATE POLICY "Allow updates to emergency case" ON public.emergency_requests
    FOR UPDATE USING (true);

CREATE POLICY "Allow messages read for emergency case" ON public.emergency_messages
    FOR SELECT USING (true);

CREATE POLICY "Allow messages insert for emergency case" ON public.emergency_messages
    FOR INSERT WITH CHECK (true);
