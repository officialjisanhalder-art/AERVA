# AERVA — AI-Powered Emergency Healthcare Discovery & Coordination Platform

<div align="center">

![AERVA Full Logo](public/aerva-full-logo.png)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-aerva--app.vercel.app-0052FF?style=for-the-badge&logo=vercel&logoColor=white)](https://aerva-app.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.5%20Turbopack-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Nodus Compute](https://img.shields.io/badge/Nodus%20Compute-AI%20Inference-8B5CF6?style=for-the-badge&logo=openai&logoColor=white)](https://nodus-compute.ai)
[![Agent37](https://img.shields.io/badge/Agent37-Autonomous%20Coordinator-10B981?style=for-the-badge&logo=probot&logoColor=white)](https://www.agent37.com)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-AERVA%20Sense%20Voice-F59E0B?style=for-the-badge&logo=audio&logoColor=white)](https://elevenlabs.io)
[![Google Places New](https://img.shields.io/badge/Google%20Places%20(New)-Discovery%20API-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![Adaption Labs](https://img.shields.io/badge/Adaption%20Labs-Adaptive%20Data-6366F1?style=for-the-badge&logo=databricks&logoColor=white)](https://adaptionlabs.ai)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime%20%26%20Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

**Every second counts. AERVA eliminates emergency room guesswork by interconnecting patients, live hospital capacity, verified Google Places discovery, Nodus Compute inference, Agent37 autonomous orchestration, and ElevenLabs voice triage into a single unified emergency healthcare network.**

[Explore Live Web App](https://aerva-app.vercel.app) • [Hospital Partner Portal](https://aerva-app.vercel.app/partner) • [AERVA Reach (Rural SOS)](https://aerva-app.vercel.app/reach) • [Nearby Emergency Locator](https://aerva-app.vercel.app/nearby) • [AI Evidence Console](https://aerva-app.vercel.app/evidence)

</div>

---

## 📌 Architecture & Integration Overview

```
Patient Voice / Text Input (AERVA Sense)
       │
       ▼
Speech Transcription (ElevenLabs Scribe)
       │
       ▼
Nodus Compute AI Inference (Structured Medical Requirements & Symptoms)
       │
       ▼
Agent37 Emergency Coordination Agent (6 Authenticated AERVA Tools)
       │
       ▼
Google Places API (New) + AERVA Authorized Hospital Registry
       │
       ▼
Suitability Decision Engine (ER/ICU Beds, Freshness & Operational Status)
       │
       ▼
Patient Confirmation Safety Gate
       │
       ▼
Hospital Dashboard Real-time Acknowledgement (Supabase Realtime)
```

---

## 🚀 Key Modules & AI Stack

1. **Nodus Compute (`/api/v1/ai/interpret`)**:
   - OpenAI-compatible inference at `https://inference.nodus-compute.ai/v1`.
   - Strict clinical JSON schema validation.
   - Live model catalog discovery and `Nodus-Request-Id` tracking.
   - Non-diagnostic triage parsing (symptoms, required hospital resources, critical flags).

2. **Agent37 Coordination Agent (`/api/v1/agent/coordinate`)**:
   - Autonomous emergency coordination agent executing 6 authenticated tools:
     - `search_nearby_hospitals`
     - `get_verified_hospital_record`
     - `get_hospital_resources`
     - `filter_hospitals_by_requirements`
     - `prepare_emergency_request`
     - `get_emergency_request_status`
   - Strict patient confirmation required prior to case dispatch.

3. **Google Places API (New) Discovery (`/api/v1/places/nearby`)**:
   - Zero SerpApi dependency.
   - Place ID correlation with authorized hospital database.
   - 3-tier classification: `AERVA Verified — Current Data`, `AERVA Verified — Outdated Data`, and `Unverified`.
   - Zero-fabrication guarantee: unverified hospitals never display mock bed numbers.

4. **ElevenLabs Voice Triage (`/api/v1/voice/transcribe` & `/api/v1/voice/speak`)**:
   - Speech-to-text with review and inline transcript editing.
   - Synthesized voice readback for bystander reassurance.
   - Graceful fallback to typed complaint.

5. **Adaption Adaptive Data Integration**:
   - Multilingual emergency dataset optimization across English, Hindi, and Hinglish.
   - Dataset quality improvement and evaluation using Adaption Adaptive Data APIs.
   - Nodus prompt & extraction evaluation benchmarks.

6. **Live Evidence & Presentation Console (`/evidence`)**:
   - Interactive diagnostic probe runner.
   - Live Nodus request IDs, Agent37 execution traces, and audit logs.

---

## 🧪 Testing & Verification

Run the comprehensive integration test suite:

```bash
npm run test:integration
```
