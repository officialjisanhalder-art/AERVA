-- ==========================================================
-- AERVA Hospital Discovery View Migration
-- Migration: 20261024000002_aerva_hospital_directory_view.sql
-- Adapts existing NearER hospital tables to AERVA Hospital Discovery API
-- Zero duplicate tables, zero data duplication, read-only view
-- ==========================================================

-- 1. Ensure required columns exist on hospitals table
ALTER TABLE public.hospitals
    ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'AERVA_VERIFIED_CURRENT',
    ADD COLUMN IF NOT EXISTS verification_source TEXT DEFAULT 'authorized_hospital',
    ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS resource_updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_hospitals_google_place_id ON public.hospitals(google_place_id);

-- 2. Create read-only view matching starter API schema
CREATE OR REPLACE VIEW public.aerva_hospital_directory AS
SELECT 
    h.id AS hospital_id,
    h.google_place_id,
    CASE 
        WHEN h.is_verified IS TRUE OR h.verification_status IN ('verified', 'AERVA_VERIFIED_CURRENT') THEN 'verified'
        ELSE 'pending'
    END AS verification_status,
    COALESCE(h.identity_verified_at, h.created_at, NOW()) AS identity_verified_at,
    COALESCE(h.verification_source, 'authorized_hospital') AS resource_source,
    COALESCE(h.resource_updated_at, c.updated_at, h.last_updated, NOW()) AS resources_updated_at,
    COALESCE(c.er_beds_available, 0) AS general_beds_available,
    COALESCE(c.icu_beds_available, 0) AS icu_beds_available,
    COALESCE(c.ventilators_available, 0) AS ventilators_available,
    (COALESCE(c.ventilators_available, 0) > 0) AS oxygen_support_available
FROM public.hospitals h
LEFT JOIN public.hospital_capacity c ON c.hospital_id = h.id
WHERE h.google_place_id IS NOT NULL;

-- 3. Document permissions (read-only view access)
COMMENT ON VIEW public.aerva_hospital_directory IS 'Read-only view joining NearER hospitals and hospital_capacity for Google Places verification. Zero data duplication.';
