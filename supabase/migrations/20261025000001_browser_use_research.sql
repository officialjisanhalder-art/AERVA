-- ==========================================================
-- AERVA Browser Use Cloud Integration Migration
-- Migration: 20261025000001_browser_use_research.sql
-- Isolated hospital website research & verification store.
-- Clinical Safety Guarantee: Website research NEVER populates or
-- overwrites hospital-authorized live resource capacity.
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.hospital_website_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id TEXT NOT NULL,
    google_place_id TEXT,
    hospital_name TEXT NOT NULL,
    target_url TEXT,
    task_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED, STALE
    is_task_successful BOOLEAN DEFAULT false,
    
    -- Public findings extracted by Browser Use Cloud
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
    
    -- Provenance & Verification Label
    verification_label TEXT NOT NULL DEFAULT 'WEBSITE_INFORMATION_FOUND', -- WEBSITE_INFORMATION_FOUND, UNVERIFIED, STALE
    disclaimer TEXT NOT NULL DEFAULT 'Public website information only. NOT confirmed live capacity or bed availability. Requires clinical review.',
    live_url TEXT,
    step_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_website_research_hospital_id ON public.hospital_website_research(hospital_id);
CREATE INDEX IF NOT EXISTS idx_website_research_task_id ON public.hospital_website_research(task_id);
CREATE INDEX IF NOT EXISTS idx_website_research_status ON public.hospital_website_research(status);
CREATE INDEX IF NOT EXISTS idx_website_research_retrieved_at ON public.hospital_website_research(retrieved_at DESC);

-- Enable RLS
ALTER TABLE public.hospital_website_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of hospital website research" ON public.hospital_website_research
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert of hospital website research" ON public.hospital_website_research
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update of hospital website research" ON public.hospital_website_research
    FOR UPDATE USING (true);
