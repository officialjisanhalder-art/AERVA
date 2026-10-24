import { supabase, isSupabaseConfigured } from "../supabase/client";

export interface CaseMessage {
  id: string;
  caseId: string;
  sender: "patient" | "hospital";
  text: string;
  time: string;
  isVoice?: boolean;
  voiceUrl?: string;
  voiceDuration?: number;
}

const LOCAL_MESSAGES_KEY = "aerva_case_messages";

export const messageService = {
  async getMessages(caseId: string): Promise<CaseMessage[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("emergency_messages")
          .select("*, emergency_requests!inner(case_id)")
          .eq("emergency_requests.case_id", caseId)
          .order("created_at", { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((m: any) => ({
            id: m.id,
            caseId,
            sender: m.sender_type === "PATIENT" ? "patient" : "hospital",
            text: m.message_text || "",
            time: new Date(m.created_at).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isVoice: m.message_type === "VOICE",
            voiceUrl: m.voice_file_path,
          }));
        }
      } catch (e) {
        console.warn("Supabase messages fetch error, fallback to local:", e);
      }
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`${LOCAL_MESSAGES_KEY}_${caseId}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }

    return [
      {
        id: "m-1",
        caseId,
        sender: "hospital",
        text: "Emergency triage team has been alerted. Your ETA is tracked in real-time.",
        time: "Just now",
      },
    ];
  },

  async sendMessage(
    caseId: string,
    sender: "patient" | "hospital",
    text: string,
    isVoice = false,
    voiceUrl?: string
  ): Promise<CaseMessage> {
    const time = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMsg: CaseMessage = {
      id: `msg-${Date.now()}`,
      caseId,
      sender,
      text,
      time,
      isVoice,
      voiceUrl,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        // Look up emergency request by caseId
        const { data: caseReq } = await supabase
          .from("emergency_requests")
          .select("id")
          .eq("case_id", caseId)
          .single();

        if (caseReq) {
          await supabase.from("emergency_messages").insert({
            emergency_request_id: caseReq.id,
            sender_type: sender === "patient" ? "PATIENT" : "HOSPITAL",
            sender_id: sender,
            message_type: isVoice ? "VOICE" : "TEXT",
            message_text: text,
            voice_file_path: voiceUrl,
          });
        }
      } catch (e) {
        console.warn("Error inserting message into Supabase:", e);
      }
    }

    if (typeof window !== "undefined") {
      const current = await messageService.getMessages(caseId);
      const updated = [...current, newMsg];
      localStorage.setItem(`${LOCAL_MESSAGES_KEY}_${caseId}`, JSON.stringify(updated));
    }

    return newMsg;
  },
};
