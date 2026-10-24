-- ==========================================================
-- AERVA Extension Migration
-- Migration: 20261024000001_aerva_extension.sql
-- Non-destructive extension of NearER schema to AERVA
-- ==========================================================

-- 1. Extend hospitals table
ALTER TABLE public.hospitals
    ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'AERVA_VERIFIED_CURRENT',
    ADD COLUMN IF NOT EXISTS verification_source TEXT DEFAULT 'OPERATOR_PORTAL',
    ADD COLUMN IF NOT EXISTS resource_updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW());

-- Index on google_place_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_hospitals_google_place_id ON public.hospitals(google_place_id);

-- 2. Extend emergency_requests table
ALTER TABLE public.emergency_requests
    ADD COLUMN IF NOT EXISTS nodus_request_id TEXT,
    ADD COLUMN IF NOT EXISTS agent37_execution_id TEXT,
    ADD COLUMN IF NOT EXISTS clinical_requirements JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS structured_interpretation JSONB DEFAULT '{}'::jsonb;

-- 3. Create integration_event_logs table for Hackathon Presentation Evidence & Audit
CREATE TABLE IF NOT EXISTS public.integration_event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL, -- NODUS, AGENT37, ELEVENLABS, GOOGLE_PLACES, ROUTER
    event_type TEXT NOT NULL,   -- INFERENCE_REQUEST, TOOL_CALL, DISCOVERY, STATUS_CHANGE, TRANSCRIPTION
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

-- Index for timeline and case queries
CREATE INDEX IF NOT EXISTS idx_integration_logs_case_id ON public.integration_event_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_service ON public.integration_event_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON public.integration_event_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.integration_event_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow public reads & inserts for seamless coordination
CREATE POLICY "Allow public read of integration event logs" ON public.integration_event_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert of integration event logs" ON public.integration_event_logs
    FOR INSERT WITH CHECK (true);

-- 4. Populate Google Place IDs for existing demo hospitals
UPDATE public.hospitals SET 
    google_place_id = 'ChIJw87_example_apollo_kol',
    verification_status = 'AERVA_VERIFIED_CURRENT',
    verification_source = 'AERVA_AUTHORIZED_REGISTRY',
    resource_updated_at = NOW()
WHERE id IN ('h1', 'apollo');

UPDATE public.hospitals SET 
    google_place_id = 'ChIJe99_example_amri_saltlake',
    verification_status = 'AERVA_VERIFIED_CURRENT',
    verification_source = 'AERVA_AUTHORIZED_REGISTRY',
    resource_updated_at = NOW()
WHERE id IN ('h2', 'medanta');

UPDATE public.hospitals SET 
    google_place_id = 'ChIJb12_example_fortis',
    verification_status = 'AERVA_VERIFIED_CURRENT',
    verification_source = 'AERVA_AUTHORIZED_REGISTRY',
    resource_updated_at = NOW()
WHERE id IN ('h3', 'fortis');

UPDATE public.hospitals SET 
    google_place_id = 'ChIJc34_example_artemis',
    verification_status = 'AERVA_VERIFIED_CURRENT',
    verification_source = 'AERVA_AUTHORIZED_REGISTRY',
    resource_updated_at = NOW()
WHERE id IN ('h4', 'artemis');
