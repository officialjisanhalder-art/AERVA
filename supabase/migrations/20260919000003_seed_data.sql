-- ==========================================================
-- NearER Seed Data Migration
-- Migration: 20260919000003_seed_data.sql
-- DEMO HOSPITAL DATA FOR HACKATHON EVALUATION
-- ==========================================================

-- Insert Relay Operators
INSERT INTO public.relay_operators (id, name, email, status) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Priya Sharma', 'priya.sharma@nearer-reach.in', 'ONLINE'),
    ('22222222-2222-2222-2222-222222222222', 'Rajesh Kumar', 'rajesh.kumar@nearer-reach.in', 'ONLINE')
ON CONFLICT (id) DO NOTHING;

-- Insert 12 Hospitals (Delhi-NCR / Gurgaon)
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

-- Insert Hospital Capacity
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

-- Insert Hospital Capabilities
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

-- Insert Blood Inventory
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
