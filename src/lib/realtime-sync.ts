"use client";

import { supabase, isSupabaseConfigured } from "./supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeEmergencyPayload {
  caseId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: string;
  patientGender?: string;
  bloodGroup?: string;
  emergencyType: string;
  status: string;
  hospitalId: string | null;
  hospitalName?: string;
  location?: {
    lat: number;
    lng: number;
    area: string;
    city: string;
  } | null;
  greenCorridorAlerted?: boolean;
  assignedBed?: string;
  doctorInChargeName?: string;
  timestamp: string;
  hasVoiceBrief?: boolean;
  audioDataUrl?: string;
  transcript?: string;
  ambulanceRequired?: boolean;
  ambulanceDispatched?: boolean;
}

export interface RealtimeMessagePayload {
  id: string;
  caseId: string;
  sender: "patient" | "hospital";
  text: string;
  time: string;
  isVoice?: boolean;
  voiceUrl?: string;
}

export interface RealtimeCapacityPayload {
  hospitalId: string;
  erBedsAvailable: number;
  erBedsTotal: number;
  icuBedsAvailable: number;
  icuBedsTotal: number;
  doctorInChargeName: string;
  doctorInChargeRole?: string;
  lastUpdated: string;
}

class RealtimeSyncManager {
  private emergencyChannel: RealtimeChannel | null = null;
  private capacityChannel: RealtimeChannel | null = null;
  private chatChannels: Map<string, RealtimeChannel> = new Map();
  private dbChangesChannel: RealtimeChannel | null = null;
  private emergencyListeners: Set<(payload: RealtimeEmergencyPayload) => void> = new Set();
  private capacityListeners: Set<(payload: RealtimeCapacityPayload) => void> = new Set();
  private chatListeners: Map<string, Set<(msg: RealtimeMessagePayload) => void>> = new Map();
  private dbChangeListeners: Set<(row: any) => void> = new Set();
  private isInitialized = false;

  public init() {
    if (this.isInitialized || !isSupabaseConfigured || !supabase) return;
    this.isInitialized = true;

    try {
      // 1. Live Emergency Channel
      this.emergencyChannel = supabase.channel("nearer_live_emergency", {
        config: { broadcast: { self: true } },
      });

      this.emergencyChannel
        .on("broadcast", { event: "emergency_event" }, (payload) => {
          if (payload && payload.payload) {
            this.emergencyListeners.forEach((fn) => fn(payload.payload));
          }
        })
        .subscribe();

      // 2. Live Capacity Channel
      this.capacityChannel = supabase.channel("nearer_hospital_capacity", {
        config: { broadcast: { self: true } },
      });

      this.capacityChannel
        .on("broadcast", { event: "capacity_update" }, (payload) => {
          if (payload && payload.payload) {
            this.capacityListeners.forEach((fn) => fn(payload.payload));
          }
        })
        .subscribe();

      // 3. PostgreSQL Database Changes Channel
      this.dbChangesChannel = supabase.channel("nearer_db_emergency_changes");
      this.dbChangesChannel
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "emergency_requests" },
          (payload: any) => {
            if (payload && payload.new) {
              this.dbChangeListeners.forEach((fn) => fn(payload.new));
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime sync initialization notice:", err);
    }
  }

  // Subscribe to live emergency events
  public onEmergencyEvent(listener: (payload: RealtimeEmergencyPayload) => void) {
    this.init();
    this.emergencyListeners.add(listener);
    return () => {
      this.emergencyListeners.delete(listener);
    };
  }

  // Subscribe to postgres database changes
  public onPostgresEmergencyChanges(listener: (row: any) => void) {
    this.init();
    this.dbChangeListeners.add(listener);
    return () => {
      this.dbChangeListeners.delete(listener);
    };
  }

  // Broadcast an emergency event across all web & mobile clients
  public async broadcastEmergencyEvent(payload: RealtimeEmergencyPayload) {
    this.init();

    // 1. Persist to Supabase Database with full audio preserved in description
    if (isSupabaseConfigured && supabase && payload.caseId) {
      try {
        let descriptionPayload = payload.transcript || "Emergency Intake Request";
        try {
          descriptionPayload = JSON.stringify({
            text: payload.transcript || "Emergency Intake Request",
            audio: payload.audioDataUrl,
            ambulance_required: payload.ambulanceRequired,
            ambulance_dispatched: payload.ambulanceDispatched,
          });
        } catch {}

        await supabase.from("emergency_requests").upsert(
          {
            case_id: payload.caseId,
            patient_name: payload.patientName,
            patient_mobile: payload.patientPhone,
            emergency_type: payload.emergencyType,
            status: payload.status,
            selected_hospital_id: payload.hospitalId,
            description: descriptionPayload,
            origin_latitude: payload.location?.lat || 22.5645,
            origin_longitude: payload.location?.lng || 88.4069,
            origin_text: payload.location ? `${payload.location.area}, ${payload.location.city}` : "Salt Lake, Kolkata",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "case_id" }
        );
      } catch (err) {
        console.warn("Database upsert notice:", err);
      }
    }

    // 2. Broadcast lightweight realtime message (<256KB safe limit)
    if (this.emergencyChannel) {
      // Broadcast audioDataUrl directly across WebSocket (safe up to 180KB)
      const safePayload = {
        ...payload,
        hasVoiceBrief: payload.hasVoiceBrief || Boolean(payload.audioDataUrl),
        audioDataUrl: (payload.audioDataUrl && payload.audioDataUrl.length < 180000) ? payload.audioDataUrl : undefined,
      };

      await this.emergencyChannel.send({
        type: "broadcast",
        event: "emergency_event",
        payload: safePayload,
      });
    }
  }

  // Subscribe to capacity updates
  public onCapacityUpdate(listener: (payload: RealtimeCapacityPayload) => void) {
    this.init();
    this.capacityListeners.add(listener);
    return () => {
      this.capacityListeners.delete(listener);
    };
  }

  // Broadcast capacity update
  public async broadcastCapacity(payload: RealtimeCapacityPayload) {
    this.init();
    if (this.capacityChannel) {
      await this.capacityChannel.send({
        type: "broadcast",
        event: "capacity_update",
        payload,
      });
    }

    // Persist to Supabase Database
    if (isSupabaseConfigured && supabase) {
      try {
        const hospId = payload.hospitalId;
        const targetIds = [hospId];
        if (hospId === "h2") targetIds.push("h2_amri");
        if (hospId === "h2_amri") targetIds.push("h2");

        await supabase.from("hospital_capacity").update({
          er_beds_available: payload.erBedsAvailable,
          er_beds_total: payload.erBedsTotal,
          icu_beds_available: payload.icuBedsAvailable,
          icu_beds_total: payload.icuBedsTotal,
          updated_at: new Date().toISOString(),
        }).in("hospital_id", targetIds);
      } catch (err) {
        console.warn("Database capacity update notice:", err);
      }
    }
  }

  // Subscribe to chat messages for a specific emergency case
  public onChatMessage(caseId: string, listener: (msg: RealtimeMessagePayload) => void) {
    this.init();
    if (!this.chatListeners.has(caseId)) {
      this.chatListeners.set(caseId, new Set());
    }
    this.chatListeners.get(caseId)!.add(listener);

    if (isSupabaseConfigured && supabase && !this.chatChannels.has(caseId)) {
      const ch = supabase.channel(`nearer_chat_${caseId}`, {
        config: { broadcast: { self: true } },
      });
      ch.on("broadcast", { event: "new_message" }, (p) => {
        if (p && p.payload) {
          const listeners = this.chatListeners.get(caseId);
          if (listeners) listeners.forEach((fn) => fn(p.payload));
        }
      }).subscribe();
      this.chatChannels.set(caseId, ch);
    }

    return () => {
      const set = this.chatListeners.get(caseId);
      if (set) {
        set.delete(listener);
      }
    };
  }

  // Broadcast a chat message
  public async broadcastMessage(msg: RealtimeMessagePayload) {
    this.init();
    const ch = this.chatChannels.get(msg.caseId) || (isSupabaseConfigured && supabase ? supabase.channel(`nearer_chat_${msg.caseId}`) : null);
    if (ch) {
      await ch.send({
        type: "broadcast",
        event: "new_message",
        payload: msg,
      });
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();
