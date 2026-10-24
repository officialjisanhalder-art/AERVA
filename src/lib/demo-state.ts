"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "./supabase/client";

export type EmergencyStatus = 
  | "IDLE" 
  | "SEARCHING"
  | "DRAFT"
  | "REQUEST_SENT"
  | "PENDING" 
  | "HOSPITAL_REVIEWING"
  | "REQUEST_VERIFIED"
  | "VERIFIED" 
  | "HOSPITAL_ACCEPTED"
  | "ACCEPTED" 
  | "CAPACITY_RESERVED"
  | "EN_ROUTE" 
  | "ARRIVED" 
  | "COMPLETED"
  | "DECLINED" 
  | "CONFIRMED";

export type EmergencyMessage = {
  id: string;
  sender: "patient" | "hospital";
  text: string;
  time: string;
  isVoice?: boolean;
  voiceDataUrl?: string;
  voiceDuration?: number;
};

export type EmergencyLocation = {
  lat: number;
  lng: number;
  area: string;
  city: string;
};

export type EmergencyRequest = {
  caseId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: string;
  patientGender?: string;
  bloodGroup?: string;
  patientCount?: number;
  writtenDescription?: string;
  emergencyId: string;
  hasVoiceBrief: boolean;
  audioDataUrl: string;
  recordingDuration: number;
  recordedAt: string;
  transcript: string;
  summary: {
    reportedIssue: string;
    breathingDifficulty: string;
    patientCount: number;
  } | null;
  location: EmergencyLocation | null;
  status: EmergencyStatus;
  hospitalId: string | null;
  messages: EmergencyMessage[];
  createdAt: number;
  isDraft?: boolean;
  greenCorridorAlerted?: boolean;
  assignedBed?: string;
  ambulanceRequired?: boolean;
  ambulanceDispatched?: boolean;
};

const STORAGE_KEY = "aerva_demo_state";

const DEFAULT_STATE: EmergencyRequest = {
  caseId: "",
  patientName: "",
  patientPhone: "+91 98765 43210",
  patientAge: "28",
  patientGender: "Male",
  bloodGroup: "O+",
  patientCount: 1,
  writtenDescription: "",
  emergencyId: "cardiac",
  hasVoiceBrief: false,
  audioDataUrl: "",
  recordingDuration: 0,
  recordedAt: "",
  transcript: "",
  summary: null,
  location: null,
  status: "IDLE",
  hospitalId: null,
  messages: [],
  createdAt: 0,
  isDraft: false,
  ambulanceRequired: true,
  ambulanceDispatched: false,
};

const CASES_STORAGE_KEY = "aerva_demo_cases";
let memoryCases: EmergencyRequest[] = [];
const casesListeners = new Set<(cases: EmergencyRequest[]) => void>();

let memoryState = { ...DEFAULT_STATE };
const listeners = new Set<(state: EmergencyRequest) => void>();

import { realtimeSync, RealtimeEmergencyPayload } from "./realtime-sync";

export function useEmergencyState() {
  const [state, setState] = useState<EmergencyRequest>(DEFAULT_STATE);
  const [cases, setCases] = useState<EmergencyRequest[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState(parsed);
        memoryState = parsed;
      } catch (e) {}
    }

    const storedCases = localStorage.getItem(CASES_STORAGE_KEY);
    if (storedCases) {
      try {
        const parsedCases = JSON.parse(storedCases);
        if (Array.isArray(parsedCases)) {
          setCases(parsedCases);
          memoryCases = parsedCases;
        }
      } catch (e) {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setState(parsed);
          memoryState = parsed;
        } catch (e) {}
      }
      if (e.key === CASES_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCases(parsed);
            memoryCases = parsed;
          }
        } catch (e) {}
      }
    };

    const notify = (newState: EmergencyRequest) => setState(newState);
    const notifyCases = (newCases: EmergencyRequest[]) => setCases(newCases);
    listeners.add(notify);
    casesListeners.add(notifyCases);
    window.addEventListener("storage", handleStorage);

    // Helper: Parse description for structured { text, audio } or plain string
    const parseDescription = (desc?: string | null): { transcript: string; audioDataUrl?: string } => {
      if (!desc) return { transcript: "" };
      const trimmed = desc.trim();
      if (trimmed.startsWith("{") && trimmed.includes('"audio"')) {
        try {
          const parsed = JSON.parse(trimmed);
          let audio = parsed.audio || undefined;
          if (audio && typeof audio === "string") {
            // Normalize audio/aac, audio/m4a to audio/mp4 for standard HTML5 Audio decoding
            if (audio.startsWith("data:audio/aac") || audio.startsWith("data:audio/m4a") || audio.startsWith("data:audio/x-m4a")) {
              audio = audio.replace(/^data:audio\/(aac|m4a|x-m4a)/, "data:audio/mp4");
            }
          }
          return {
            transcript: parsed.text || "",
            audioDataUrl: audio,
          };
        } catch {}
      }
      return { transcript: desc };
    };

    // 1. Fetch & sync active cases from Supabase Database
    const fetchActiveCases = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const { data, error } = await supabase
          .from("emergency_requests")
          .select("*")
          .in("status", [
            "SEARCHING",
            "REQUEST_SENT",
            "PENDING",
            "HOSPITAL_REVIEWING",
            "REQUEST_VERIFIED",
            "VERIFIED",
            "HOSPITAL_ACCEPTED",
            "ACCEPTED",
            "CAPACITY_RESERVED",
            "EN_ROUTE",
            "ARRIVED",
          ])
          .order("created_at", { ascending: false })
          .limit(20);

        if (data && data.length > 0) {
          const now = Date.now();
          const loadedCases: EmergencyRequest[] = data.map((row: any) => {
            const rowTime = row.created_at ? new Date(row.created_at).getTime() : now;
            const existing = memoryCases.find((c) => c.caseId === row.case_id);
            const { transcript, audioDataUrl } = parseDescription(row.description);
            const resolvedAudio = audioDataUrl || existing?.audioDataUrl || "";

            return {
              caseId: row.case_id,
              patientName: row.patient_name || existing?.patientName || "Emergency Patient",
              patientPhone: row.patient_mobile || existing?.patientPhone || "+91 98765 43210",
              patientAge: existing?.patientAge || "28",
              patientGender: existing?.patientGender || "Male",
              bloodGroup: existing?.bloodGroup || "O+",
              emergencyId: (row.emergency_type || existing?.emergencyId || "cardiac").toLowerCase(),
              status: (row.status as EmergencyStatus) || "PENDING",
              hospitalId: row.selected_hospital_id || existing?.hospitalId || null,
              location: (row.origin_latitude && row.origin_longitude) ? {
                lat: row.origin_latitude,
                lng: row.origin_longitude,
                area: row.origin_text?.split(",")[0]?.trim() || "Kolkata",
                city: row.origin_text?.split(",")[1]?.trim() || "Kolkata",
              } : (existing?.location || null),
              createdAt: rowTime,
              hasVoiceBrief: Boolean(resolvedAudio || existing?.hasVoiceBrief || transcript),
              audioDataUrl: resolvedAudio,
              recordingDuration: existing?.recordingDuration || 0,
              recordedAt: existing?.recordedAt || "",
              transcript: transcript || existing?.transcript || "",
              writtenDescription: transcript || existing?.writtenDescription || "",
              summary: null,
              messages: existing?.messages || [],
              assignedBed: existing?.assignedBed,
              greenCorridorAlerted: existing?.greenCorridorAlerted,
              ambulanceRequired: row.ambulance_required !== undefined && row.ambulance_required !== null
                ? Boolean(row.ambulance_required)
                : (existing?.ambulanceRequired ?? true),
              ambulanceDispatched: row.ambulance_dispatched !== undefined && row.ambulance_dispatched !== null
                ? Boolean(row.ambulance_dispatched)
                : (existing?.ambulanceDispatched ?? false),
            };
          });

          // Check if changed before updating state to avoid re-render loops
          const hasDiff = loadedCases.length !== memoryCases.length ||
            loadedCases.some((lc, i) => {
              const mc = memoryCases[i];
              return !mc || 
                mc.caseId !== lc.caseId || 
                mc.status !== lc.status || 
                mc.audioDataUrl !== lc.audioDataUrl ||
                mc.transcript !== lc.transcript ||
                mc.ambulanceRequired !== lc.ambulanceRequired;
            });

          if (hasDiff) {
            memoryCases = loadedCases;
            setCases(loadedCases);
            casesListeners.forEach((l) => l(loadedCases));
            try {
              localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(loadedCases));
            } catch {}

            const currentActive = memoryState.caseId 
              ? loadedCases.find((c) => c.caseId === memoryState.caseId) 
              : (memoryState.status === "IDLE" ? loadedCases[0] : null);
            if (currentActive && (memoryState.status === "IDLE" || memoryState.status !== currentActive.status)) {
              memoryState = { ...memoryState, ...currentActive };
              setState(memoryState);
              listeners.forEach((l) => l(memoryState));
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching active cases:", err);
      }
    };

    // Initial fetch
    fetchActiveCases();

    // Fallback Database Polling Syncer (Slowed down to 60s to prevent Supabase egress drain)
    // Realtime Postgres Changes will handle the instant sync.
    const pollInterval = setInterval(fetchActiveCases, 60000);

    // 2. Supabase Postgres Changes Listener on emergency_requests via singleton
    const unsubDb = realtimeSync.onPostgresEmergencyChanges((row: any) => {
      if (row && row.case_id) {
        const rowTime = row.created_at ? new Date(row.created_at).getTime() : Date.now();
        const existing = memoryCases.find((c) => c.caseId === row.case_id);
        const { transcript, audioDataUrl } = parseDescription(row.description);
        const resolvedAudio = audioDataUrl || existing?.audioDataUrl || "";
        const updatedCase: EmergencyRequest = {
          ...(existing || { ...DEFAULT_STATE, caseId: row.case_id }),
          caseId: row.case_id,
          patientName: row.patient_name || existing?.patientName || "Emergency Patient",
          patientPhone: row.patient_mobile || existing?.patientPhone || "+91 98765 43210",
          emergencyId: (row.emergency_type || existing?.emergencyId || "cardiac").toLowerCase(),
          status: (row.status as EmergencyStatus) || existing?.status || "PENDING",
          hospitalId: row.selected_hospital_id || existing?.hospitalId || null,
          transcript: transcript || existing?.transcript || "",
          writtenDescription: transcript || existing?.writtenDescription || "",
          hasVoiceBrief: Boolean(resolvedAudio || existing?.hasVoiceBrief || transcript),
          audioDataUrl: resolvedAudio,
          location: (row.origin_latitude && row.origin_longitude) ? {
            lat: row.origin_latitude,
            lng: row.origin_longitude,
            area: row.origin_text?.split(",")[0]?.trim() || "Kolkata",
            city: row.origin_text?.split(",")[1]?.trim() || "Kolkata",
          } : (existing?.location || null),
          createdAt: rowTime,
          ambulanceRequired: row.ambulance_required !== undefined && row.ambulance_required !== null
            ? Boolean(row.ambulance_required)
            : (existing?.ambulanceRequired ?? true),
          ambulanceDispatched: row.ambulance_dispatched !== undefined && row.ambulance_dispatched !== null
            ? Boolean(row.ambulance_dispatched)
            : (existing?.ambulanceDispatched ?? false),
        };

        const nextCases = existing
          ? memoryCases.map((c) => (c.caseId === row.case_id ? updatedCase : c))
          : [updatedCase, ...memoryCases];

        memoryCases = nextCases;
        setCases(nextCases);
        casesListeners.forEach((l) => l(nextCases));
        try {
          localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(nextCases));
        } catch {}

        if (memoryState.caseId === row.case_id || !memoryState.caseId || memoryState.status === "IDLE") {
          memoryState = updatedCase;
          setState(updatedCase);
          listeners.forEach((l) => l(updatedCase));
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCase));
          } catch {}
        }
      }
    });

    // 3. Supabase Realtime Broadcast Emergency Listener
    const unsubRealtime = realtimeSync.onEmergencyEvent((incoming) => {
      const incomingTime = incoming.timestamp ? new Date(incoming.timestamp).getTime() : Date.now();
      const existing = memoryCases.find((c) => c.caseId === incoming.caseId);
      const mergedCase: EmergencyRequest = {
        ...(existing || DEFAULT_STATE),
        caseId: incoming.caseId,
        patientName: incoming.patientName || existing?.patientName || "Emergency Patient",
        patientPhone: incoming.patientPhone || existing?.patientPhone || "+91 98765 43210",
        patientAge: incoming.patientAge || existing?.patientAge || "28",
        patientGender: incoming.patientGender || existing?.patientGender || "Male",
        bloodGroup: incoming.bloodGroup || existing?.bloodGroup || "O+",
        emergencyId: incoming.emergencyType || existing?.emergencyId || "cardiac",
        status: (incoming.status as EmergencyStatus) || existing?.status || "PENDING",
        hospitalId: incoming.hospitalId || existing?.hospitalId || null,
        location: incoming.location !== undefined ? incoming.location : (existing?.location || null),
        greenCorridorAlerted: incoming.greenCorridorAlerted !== undefined ? incoming.greenCorridorAlerted : existing?.greenCorridorAlerted,
        assignedBed: incoming.assignedBed || existing?.assignedBed,
        createdAt: (existing?.createdAt && existing.createdAt > 0) ? existing.createdAt : incomingTime,
        hasVoiceBrief: incoming.hasVoiceBrief !== undefined ? incoming.hasVoiceBrief : (existing?.hasVoiceBrief || Boolean(incoming.audioDataUrl || existing?.audioDataUrl)),
        audioDataUrl: incoming.audioDataUrl || existing?.audioDataUrl || "",
        transcript: incoming.transcript || existing?.transcript || "",
        summary: null,
        ambulanceRequired: incoming.ambulanceRequired !== undefined
          ? incoming.ambulanceRequired
          : (existing?.ambulanceRequired ?? true),
        ambulanceDispatched: incoming.ambulanceDispatched !== undefined
          ? incoming.ambulanceDispatched
          : (existing?.ambulanceDispatched ?? false),
      };

      const nextCases = existing
        ? memoryCases.map((c) => (c.caseId === incoming.caseId ? mergedCase : c))
        : [mergedCase, ...memoryCases];

      memoryCases = nextCases;
      setCases(nextCases);
      casesListeners.forEach((l) => l(nextCases));
      try {
        localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(nextCases));
      } catch {}

      if (memoryState.caseId === incoming.caseId || !memoryState.caseId || memoryState.status === "IDLE") {
        memoryState = mergedCase;
        setState(mergedCase);
        listeners.forEach((l) => l(mergedCase));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedCase));
        } catch {}
      }

      // If incoming event had voice brief but audio was omitted from broadcast, pull from Supabase immediately
      if (!mergedCase.audioDataUrl && mergedCase.hasVoiceBrief && mergedCase.caseId && isSupabaseConfigured && supabase) {
        supabase
          .from("emergency_requests")
          .select("description")
          .eq("case_id", mergedCase.caseId)
          .single()
          .then(({ data }) => {
            if (data?.description) {
              const { audioDataUrl } = parseDescription(data.description);
              if (audioDataUrl) {
                mergedCase.audioDataUrl = audioDataUrl;
                const updatedCases = memoryCases.map((c) => (c.caseId === mergedCase.caseId ? { ...c, audioDataUrl } : c));
                memoryCases = updatedCases;
                setCases(updatedCases);
                casesListeners.forEach((l) => l(updatedCases));
                if (memoryState.caseId === mergedCase.caseId) {
                  const updatedState = { ...memoryState, audioDataUrl };
                  memoryState = updatedState;
                  setState(updatedState);
                  listeners.forEach((l) => l(updatedState));
                }
              }
            }
          });
      }
    });

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("storage", handleStorage);
      listeners.delete(notify);
      casesListeners.delete(notifyCases);
      unsubRealtime();
      unsubDb();
    };
  }, []);

  // Realtime Chat listener for active case
  useEffect(() => {
    if (!state.caseId) return;
    const unsubChat = realtimeSync.onChatMessage(state.caseId, (msg) => {
      setState((prev) => {
        if (prev.messages.some((m) => m.id === msg.id)) return prev;
        const updated = {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: msg.id,
              sender: msg.sender,
              text: msg.text,
              time: msg.time,
              isVoice: msg.isVoice,
              voiceDataUrl: msg.voiceUrl,
            },
          ],
        };
        memoryState = updated;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    });
    return () => unsubChat();
  }, [state.caseId]);

  const updateCase = (caseId: string, updates: Partial<EmergencyRequest>) => {
    const existing = memoryCases.find((c) => c.caseId === caseId);
    const baseState = memoryState.caseId === caseId ? memoryState : existing;
    const updatedCase: EmergencyRequest = {
      ...DEFAULT_STATE,
      ...(existing || {}),
      ...(baseState || {}),
      ...updates,
      caseId,
      createdAt: updates.createdAt || existing?.createdAt || baseState?.createdAt || Date.now(),
    };

    const nextCases = existing
      ? memoryCases.map((c) => (c.caseId === caseId ? updatedCase : c))
      : [updatedCase, ...memoryCases];

    memoryCases = nextCases;
    setCases(nextCases);
    casesListeners.forEach((l) => l(nextCases));
    try {
      localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(nextCases));
    } catch {}

    if (memoryState.caseId === caseId || !memoryState.caseId) {
      memoryState = updatedCase;
      setState(updatedCase);
      listeners.forEach((l) => l(updatedCase));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCase));
      } catch {}
    }

    // Broadcast across Supabase Realtime for this case
    realtimeSync.broadcastEmergencyEvent({
      caseId: updatedCase.caseId,
      patientName: updatedCase.patientName,
      patientPhone: updatedCase.patientPhone,
      patientAge: updatedCase.patientAge,
      patientGender: updatedCase.patientGender,
      bloodGroup: updatedCase.bloodGroup,
      emergencyType: updatedCase.emergencyId,
      status: updatedCase.status,
      hospitalId: updatedCase.hospitalId,
      location: updatedCase.location,
      greenCorridorAlerted: updatedCase.greenCorridorAlerted,
      assignedBed: updatedCase.assignedBed,
      timestamp: new Date().toISOString(),
      hasVoiceBrief: updatedCase.hasVoiceBrief,
      audioDataUrl: updatedCase.audioDataUrl,
      transcript: updatedCase.transcript,
      ambulanceRequired: updatedCase.ambulanceRequired,
      ambulanceDispatched: updatedCase.ambulanceDispatched,
    });

    // Directly update PostgreSQL via upsert to ensure row exists and is populated
    if (isSupabaseConfigured && supabase) {
      const dbPayload: any = {
        case_id: updatedCase.caseId,
        patient_name: updatedCase.patientName,
        patient_mobile: updatedCase.patientPhone,
        emergency_type: updatedCase.emergencyId,
        status: updatedCase.status,
        selected_hospital_id: updatedCase.hospitalId,
        origin_latitude: updatedCase.location?.lat || 22.5645,
        origin_longitude: updatedCase.location?.lng || 88.4069,
        origin_text: updatedCase.location ? `${updatedCase.location.area}, ${updatedCase.location.city}` : "Salt Lake, Kolkata",
        updated_at: new Date().toISOString(),
      };

      // Always structure description with metadata, audio, and ambulance preference
      try {
        const descData: any = {
          text: updatedCase.transcript || updatedCase.writtenDescription || "Emergency Lead",
          ambulance_required: updatedCase.ambulanceRequired,
          ambulance_dispatched: updatedCase.ambulanceDispatched,
        };
        if (updatedCase.audioDataUrl) {
          descData.audio = updatedCase.audioDataUrl;
        }
        dbPayload.description = JSON.stringify(descData);
      } catch {}

      supabase
        .from("emergency_requests")
        .upsert(dbPayload, { onConflict: "case_id" })
        .then(({ error }) => {
          if (error) console.warn("Supabase case update notice:", error);
        });
    }
  };

  const updateState = (updates: Partial<EmergencyRequest>) => {
    const isNewCase = Boolean(updates.caseId && updates.caseId !== memoryState.caseId);
    const isStatusStart = (updates.status === "PENDING" || updates.status === "REQUEST_SENT") && !memoryState.createdAt;
    const newCreatedAt = updates.createdAt || (isNewCase || isStatusStart ? Date.now() : memoryState.createdAt || Date.now());

    const newState = { 
      ...memoryState, 
      ...updates,
      createdAt: newCreatedAt
    };
    memoryState = newState;
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    listeners.forEach((l) => l(newState));

    if (newState.caseId) {
      updateCase(newState.caseId, newState);
    } else {
      // Broadcast across Supabase Realtime
      realtimeSync.broadcastEmergencyEvent({
        caseId: newState.caseId,
        patientName: newState.patientName,
        patientPhone: newState.patientPhone,
        patientAge: newState.patientAge,
        patientGender: newState.patientGender,
        bloodGroup: newState.bloodGroup,
        emergencyType: newState.emergencyId,
        status: newState.status,
        hospitalId: newState.hospitalId,
        location: newState.location,
        greenCorridorAlerted: newState.greenCorridorAlerted,
        assignedBed: newState.assignedBed,
        timestamp: new Date(newCreatedAt).toISOString(),
        hasVoiceBrief: newState.hasVoiceBrief,
        audioDataUrl: newState.audioDataUrl,
        transcript: newState.transcript,
        ambulanceRequired: newState.ambulanceRequired,
        ambulanceDispatched: newState.ambulanceDispatched,
      });
    }
  };

  const addMessage = (msg: Omit<EmergencyMessage, "id">) => {
    const newMsg: EmergencyMessage = { ...msg, id: Date.now().toString() };
    const newMessages = [...memoryState.messages, newMsg];
    updateState({ messages: newMessages });

    // Broadcast message via Supabase Realtime
    if (memoryState.caseId) {
      realtimeSync.broadcastMessage({
        id: newMsg.id,
        caseId: memoryState.caseId,
        sender: newMsg.sender,
        text: newMsg.text,
        time: newMsg.time,
        isVoice: newMsg.isVoice,
        voiceUrl: newMsg.voiceDataUrl,
      });
    }
  };

  const resetState = (caseIdToReset?: string) => {
    if (caseIdToReset) {
      const nextCases = memoryCases.filter((c) => c.caseId !== caseIdToReset);
      memoryCases = nextCases;
      setCases(nextCases);
      casesListeners.forEach((l) => l(nextCases));
      try {
        localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(nextCases));
      } catch {}
      if (memoryState.caseId === caseIdToReset) {
        const nextActive = nextCases[0] || { ...DEFAULT_STATE };
        memoryState = nextActive;
        setState(nextActive);
        listeners.forEach((l) => l(nextActive));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextActive));
        } catch {}
      }
    } else {
      memoryState = { ...DEFAULT_STATE };
      memoryCases = [];
      setState(memoryState);
      setCases([]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
      localStorage.removeItem(CASES_STORAGE_KEY);
      listeners.forEach((l) => l(memoryState));
      casesListeners.forEach((l) => l([]));
    }
  };

  return { 
    state, 
    updateState, 
    addMessage, 
    resetState,
    cases,
    updateCase,
    setActiveCase: (caseId: string) => {
      const found = memoryCases.find((c) => c.caseId === caseId);
      if (found) {
        memoryState = found;
        setState(found);
        listeners.forEach((l) => l(found));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
        } catch {}
      }
    }
  };
}

const PARTNER_HOSPITAL_KEY = "aerva_partner_hospital_id";

export function usePartnerHospital() {
  const [hospitalId, setHospitalId] = useState<string>("h3");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(PARTNER_HOSPITAL_KEY) || "h3";
    setHospitalId(stored);

    const handleUpdate = () => {
      const current = localStorage.getItem(PARTNER_HOSPITAL_KEY) || "h3";
      setHospitalId(current);
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("aerva_hospital_changed", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("aerva_hospital_changed", handleUpdate);
    };
  }, []);

  const switchHospital = (id: string) => {
    setHospitalId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(PARTNER_HOSPITAL_KEY, id);
      window.dispatchEvent(new Event("aerva_hospital_changed"));
    }
  };

  return { hospitalId, switchHospital };
}

import { 
  Hospital, 
  HospitalCapacity, 
  DoctorInCharge, 
  getLiveHospitals, 
  saveHospitalCapacity, 
  saveDoctorInCharge, 
  MOCK_HOSPITALS 
} from "./demo-data";

export function useHospitalData(targetHospitalId?: string) {
  const [hospitals, setHospitals] = useState<Hospital[]>(MOCK_HOSPITALS);

  useEffect(() => {
    const refresh = () => {
      setHospitals(getLiveHospitals());
    };

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("aerva_hospital_data_updated", refresh);

    // Supabase Realtime Capacity Listener
    const unsubCapacity = realtimeSync.onCapacityUpdate((cap) => {
      saveHospitalCapacity(cap.hospitalId, {
        erBeds: { available: cap.erBedsAvailable, total: cap.erBedsTotal },
        icuBeds: { available: cap.icuBedsAvailable, total: cap.icuBedsTotal },
      });
      setHospitals(getLiveHospitals());
    });

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("aerva_hospital_data_updated", refresh);
      unsubCapacity();
    };
  }, []);

  const currentHospital = targetHospitalId
    ? hospitals.find(h => h.id === targetHospitalId) || hospitals[0]
    : hospitals[0];

  const updateCapacity = (id: string, updates: Partial<HospitalCapacity>) => {
    saveHospitalCapacity(id, updates);
    const updatedHosp = getLiveHospitals().find(h => h.id === id);
    if (updatedHosp) {
      realtimeSync.broadcastCapacity({
        hospitalId: id,
        erBedsAvailable: updatedHosp.capacity.erBeds.available,
        erBedsTotal: updatedHosp.capacity.erBeds.total,
        icuBedsAvailable: updatedHosp.capacity.icuBeds.available,
        icuBedsTotal: updatedHosp.capacity.icuBeds.total,
        doctorInChargeName: updatedHosp.doctorInCharge.name,
        doctorInChargeRole: updatedHosp.doctorInCharge.designation,
        lastUpdated: updatedHosp.lastUpdated,
      });

      if (isSupabaseConfigured && supabase) {
        supabase
          .from("hospital_capacity")
          .upsert({
            hospital_id: id,
            er_beds_available: updatedHosp.capacity.erBeds.available,
            er_beds_total: updatedHosp.capacity.erBeds.total,
            icu_beds_available: updatedHosp.capacity.icuBeds.available,
            icu_beds_total: updatedHosp.capacity.icuBeds.total,
            ventilators_available: updatedHosp.capacity.ventilators.available,
            ventilators_total: updatedHosp.capacity.ventilators.total,
            updated_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) console.warn("[AERVA] Supabase capacity upsert warning:", error);
          });
      }
    }
    setHospitals(getLiveHospitals());
  };

  const updateDoctor = (id: string, updates: Partial<DoctorInCharge>) => {
    saveDoctorInCharge(id, updates);
    const updatedHosp = getLiveHospitals().find(h => h.id === id);
    if (updatedHosp) {
      realtimeSync.broadcastCapacity({
        hospitalId: id,
        erBedsAvailable: updatedHosp.capacity.erBeds.available,
        erBedsTotal: updatedHosp.capacity.erBeds.total,
        icuBedsAvailable: updatedHosp.capacity.icuBeds.available,
        icuBedsTotal: updatedHosp.capacity.icuBeds.total,
        doctorInChargeName: updatedHosp.doctorInCharge.name,
        doctorInChargeRole: updatedHosp.doctorInCharge.designation,
        lastUpdated: updatedHosp.lastUpdated,
      });
    }
    setHospitals(getLiveHospitals());
  };

  return {
    hospitals,
    currentHospital,
    updateCapacity,
    updateDoctor,
  };
}
