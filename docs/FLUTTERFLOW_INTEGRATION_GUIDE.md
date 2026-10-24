# AERVA FlutterFlow & Render Integration Guide

This guide details how to connect a FlutterFlow mobile application or companion client to the unified AERVA backend services, and how the platform is deployed to Render.

---

## 1. Overview of Architecture

All AI inference (Nodus Compute), autonomous agent coordination (Agent37), voice transcription (ElevenLabs), and genuine place geofencing (Google Places API New) are executed **server-side** in AERVA's Next.js route handlers.

```
FlutterFlow Mobile App (Patient) 
       │
       │ (REST APIs over HTTPS with Bearer / Anon Key)
       ▼
AERVA Backend Services (Deployed on Render / Next.js)
 ├── /api/v1/ai/interpret       ──> Nodus Compute
 ├── /api/v1/agent/coordinate   ──> Agent37
 ├── /api/v1/places/nearby      ──> Google Places API (New) + Supabase
 ├── /api/v1/voice/transcribe   ──> ElevenLabs
 ├── /api/v1/emergency/match    ──> Routing & Matching Engine
 └── /api/v1/emergency/guidance ──> Clinical First-Aid Protocols
```

---

## 2. FlutterFlow API Calls Configuration

In the FlutterFlow Project Settings, navigate to **API Calls** and configure the following endpoints:

### Call 1: `AERVA_InterpretEmergency` (Nodus Compute Inference)
- **Method**: `POST`
- **Endpoint**: `https://<YOUR-RENDER-APP-DOMAIN>/api/v1/ai/interpret`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body (JSON)**:
  ```json
  {
    "description": "[user_spoken_or_typed_text]",
    "case_id": "[case_id]"
  }
  ```
- **Response JSON Paths**:
  - `$.data.reported_situation` (String)
  - `$.data.potential_care_requirements` (List<String>)
  - `$.data.potential_resource_requirements` (List<String>)
  - `$.data.critical_warning_indicators` (List<String>)
  - `$.request_id` (String - Nodus Request ID)

---

### Call 2: `AERVA_DiscoverNearbyHospitals` (Google Places API New)
- **Method**: `GET`
- **Endpoint**: `https://<YOUR-RENDER-APP-DOMAIN>/api/v1/places/nearby?lat=[latitude]&lng=[longitude]&radius=20000`
- **Headers**:
  - `Content-Type`: `application/json`
- **Response JSON Paths**:
  - `$.hospitals` (List<JSON>)
  - `$.hospitals[:].name` (String)
  - `$.hospitals[:].verification_status` (String: `AERVA_VERIFIED_CURRENT`, `AERVA_VERIFIED_OUTDATED`, `UNVERIFIED`)
  - `$.hospitals[:].distance_km` (Double)
  - `$.hospitals[:].eta_minutes` (Integer)
  - `$.hospitals[:].capacity.er_beds_available` (Integer or Null)

---

### Call 3: `AERVA_CoordinateAgent` (Agent37 Orchestrator)
- **Method**: `POST`
- **Endpoint**: `https://<YOUR-RENDER-APP-DOMAIN>/api/v1/agent/coordinate`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body (JSON)**:
  ```json
  {
    "case_id": "[case_id]",
    "patient_name": "[patient_name]",
    "patient_phone": "[patient_phone]",
    "emergency_type": "[emergency_type]",
    "latitude": [latitude],
    "longitude": [longitude],
    "blood_group": "[blood_group]"
  }
  ```
- **Response JSON Paths**:
  - `$.execution_id` (String)
  - `$.recommended_hospital.hospital.name` (String)
  - `$.recommended_hospital.metrics.erBedsOpen` (Integer)
  - `$.prepared_request.requires_patient_confirmation` (Boolean: `true`)
  - `$.coordination_summary` (String)

---

### Call 4: `AERVA_VoiceTranscribe` (ElevenLabs Speech-to-Text)
- **Method**: `POST`
- **Endpoint**: `https://<YOUR-RENDER-APP-DOMAIN>/api/v1/voice/transcribe`
- **Body Type**: `Multipart / Form Data`
- **Field**: `audio` (File / Bytes)
- **Response JSON Paths**:
  - `$.transcript` (String)
  - `$.provider` (String)

---

## 3. Render Deployment Setup

1. **Link Repository**: Link your GitHub repository branch `aerva-migration` (or `main`) in Render Dashboard.
2. **Use Blueprint or Web Service**:
   - The included `render.yaml` automatically configures the Node environment, build command `npm install && npm run build`, and start command `npm run start`.
3. **Environment Variables on Render**:
   - Set secrets in Render Dashboard → Environment:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NODUS_API_KEY`
     - `NODUS_MODEL` (default: `nodus/gpt-oss-120b`)
     - `AGENT37_API_KEY`
     - `AGENT37_INSTANCE_URL`
     - `GOOGLE_PLACES_API_KEY`
     - `ELEVENLABS_API_KEY`
4. **Health Check**:
   - Set health check path to `/api/v1/evidence`.
