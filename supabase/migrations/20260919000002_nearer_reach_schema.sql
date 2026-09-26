-- ==========================================================
-- NearER Reach Database Schema Migration
-- Migration: 20260919000002_nearer_reach_schema.sql
-- ==========================================================

-- 1. Relay Operators (Desk personnel managing rural SOS calls)
CREATE TABLE IF NOT EXISTS public.relay_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ONLINE', -- ONLINE, BUSY, OFFLINE
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Rural SOS Cases (Voice-first Keypad / Low-Connectivity Emergency Cases)
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
    status TEXT DEFAULT 'SOS_RECEIVED' NOT NULL, -- SOS_RECEIVED, VOICE_CAPTURED, LOCATION_IDENTIFIED, MATCHING, FACILITY_IDENTIFIED, FACILITY_ALERTED, ACKNOWLEDGED, CALLER_CONNECTED, ESCALATING, MANUAL_ESCALATION, COMPLETED
    assigned_operator_id UUID REFERENCES public.relay_operators(id),
    selected_facility_id TEXT REFERENCES public.hospitals(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Rural Voice Recordings (Keep original audio for location & emergency)
CREATE TABLE IF NOT EXISTS public.rural_voice_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rural_sos_case_id UUID REFERENCES public.rural_sos_cases(id) ON DELETE CASCADE,
    recording_type TEXT NOT NULL, -- LOCATION, EMERGENCY
    file_path TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Facility Alerts (Alert queue per facility with timeout/response tracking)
CREATE TABLE IF NOT EXISTS public.facility_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rural_sos_case_id UUID REFERENCES public.rural_sos_cases(id) ON DELETE CASCADE,
    hospital_id TEXT REFERENCES public.hospitals(id),
    alert_order INTEGER DEFAULT 1,
    status TEXT DEFAULT 'PENDING' NOT NULL, -- PENDING, ACKNOWLEDGED, DECLINED, NO_RESPONSE
    sent_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    acknowledged_at TIMESTAMPTZ
);

-- 5. Escalation Events (Adaptive Radius / Facility Handoff Tracking)
CREATE TABLE IF NOT EXISTS public.escalation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rural_sos_case_id UUID REFERENCES public.rural_sos_cases(id) ON DELETE CASCADE,
    from_hospital_id TEXT,
    to_hospital_id TEXT,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.relay_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rural_sos_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rural_voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read relay operators" ON public.relay_operators FOR SELECT USING (true);
CREATE POLICY "Allow public insert rural cases" ON public.rural_sos_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read rural cases" ON public.rural_sos_cases FOR SELECT USING (true);
CREATE POLICY "Allow update rural cases" ON public.rural_sos_cases FOR UPDATE USING (true);
CREATE POLICY "Allow manage rural recordings" ON public.rural_voice_recordings FOR ALL USING (true);
CREATE POLICY "Allow manage facility alerts" ON public.facility_alerts FOR ALL USING (true);
CREATE POLICY "Allow manage escalation events" ON public.escalation_events FOR ALL USING (true);
