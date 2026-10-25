"use client";

import { motion } from "framer-motion";
import { Activity, Users, ShieldCheck, Clock, AlertTriangle, ChevronRight, VolumeX, Volume2, CheckCircle2, Play, Square, Phone, MessageSquare, FileText, Pill, Heart, Siren, UserCheck, Stethoscope, RotateCcw, QrCode, Camera, Search, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useEmergencyState, usePartnerHospital, useHospitalData, EmergencyRequest } from "@/lib/demo-state";
import { getStoredPatientProfile, PatientProfile } from "@/lib/patient-profile";
import { getHospitalAdmissions, addHospitalAdmission, addPatientHistory, EmergencyVisitHistory } from "@/lib/history-service";
import { emergencyService } from "@/lib/services/emergencyService";
import { alarmCoordinator } from "@/lib/alarm-coordinator";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export default function PartnerDashboard() {
  const { state, updateState, resetState, cases, updateCase, setActiveCase } = useEmergencyState();
  const { hospitalId, switchHospital } = usePartnerHospital();
  const { hospitals, currentHospital, updateCapacity } = useHospitalData(hospitalId);
  const targetHospital = hospitals.find(h => h.id === state.hospitalId) || currentHospital;

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alarmSilenced, setAlarmSilenced] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [playingCaseId, setPlayingCaseId] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTranscriptCaseId, setShowTranscriptCaseId] = useState<string | null>(null);
  const [showMedicalPassport, setShowMedicalPassport] = useState(false);
  const [selectedModalCase, setSelectedModalCase] = useState<EmergencyRequest | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [admissions, setAdmissions] = useState<EmergencyVisitHistory[]>([]);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const knownIncomingCaseIdsRef = useRef<Set<string>>(new Set());

  // QR Triage Scanner states
  const [showQrScanModal, setShowQrScanModal] = useState(false);
  const [scanInputText, setScanInputText] = useState("");
  const [scannedCase, setScannedCase] = useState<EmergencyRequest | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAdmittingScanned, setIsAdmittingScanned] = useState(false);
  const [admitSuccessToast, setAdmitSuccessToast] = useState<string | null>(null);
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (scannerVideoRef.current) {
          scannerVideoRef.current.srcObject = stream;
          scannerVideoRef.current.play().catch(() => {});
        }
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
    }
  };

  const stopCamera = () => {
    if (scannerVideoRef.current && scannerVideoRef.current.srcObject) {
      const stream = scannerVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      scannerVideoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleLookupCase = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    let extractedId = trimmed;
    let jsonPatientName = "";
    let jsonBloodGroup = "";
    let jsonKinPhone = "";

    try {
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const parsed = JSON.parse(trimmed);
        extractedId = parsed.hid || parsed.caseId || `HID-${Date.now().toString().slice(-4)}`;
        jsonPatientName = parsed.name || "";
        jsonBloodGroup = parsed.bg || "";
        jsonKinPhone = parsed.kin || "";
      } else if (trimmed.includes("caseId=")) {
        const urlObj = new URL(trimmed.startsWith("http") ? trimmed : `https://dummy.com/${trimmed}`);
        extractedId = urlObj.searchParams.get("caseId") || trimmed;
      } else if (trimmed.includes("/pass/")) {
        extractedId = trimmed.split("/pass/")[1].split("?")[0];
      }
    } catch {
      extractedId = trimmed;
    }

    const found = cases.find(c => c.caseId?.toLowerCase() === extractedId.toLowerCase()) 
      || (state.caseId?.toLowerCase() === extractedId.toLowerCase() ? state : null);

    if (found) {
      setScannedCase(found);
    } else {
      const fallbackCase: EmergencyRequest = {
        caseId: extractedId,
        patientName: jsonPatientName || patientProfile?.fullName || state.patientName || "Emergency Patient",
        patientPhone: jsonKinPhone || patientProfile?.phone || state.patientPhone || "+91 98301 22334",
        emergencyId: "cardiac",
        bloodGroup: jsonBloodGroup || patientProfile?.bloodGroup || state.bloodGroup || "O+",
        hasVoiceBrief: false,
        audioDataUrl: "",
        recordingDuration: 0,
        recordedAt: "",
        transcript: "Direct QR Triage scan at emergency admission bay.",
        summary: null,
        hospitalId: hospitalId,
        status: "ACCEPTED",
        assignedBed: "Red Bay 01 (Critical Resuscitation)",
        location: state.location || null,
        messages: [],
        createdAt: Date.now(),
      };
      setScannedCase(fallbackCase);
    }
  };

  const handleAdmitScannedCase = async (targetCase: EmergencyRequest) => {
    setIsAdmittingScanned(true);

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }) + ", " + now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const bay = targetCase.assignedBed || "Red Bay 01 (Critical Resuscitation)";

    const visitItem: EmergencyVisitHistory = {
      id: `ev-${Date.now()}`,
      caseId: targetCase.caseId,
      timestamp: formattedDate,
      hospitalId: hospitalId,
      hospitalName: currentHospital.name,
      hospitalAddress: currentHospital.address || "Salt Lake, Kolkata",
      emergencyType: `${targetCase.emergencyId ? targetCase.emergencyId.toUpperCase() : "GENERAL"} Emergency`,
      doctorInChargeName: currentHospital.doctorInCharge.name,
      doctorInChargeRole: currentHospital.doctorInCharge.designation,
      originArea: state.location ? `${state.location.area}, ${state.location.city}` : "Salt Lake City, Kolkata",
      status: "ADMITTED",
      triageBay: bay,
      greenCorridorUsed: state.greenCorridorAlerted || false,
      etaMinutes: 0,
      patientName: targetCase.patientName,
    };

    addPatientHistory(visitItem);
    addHospitalAdmission(visitItem);

    updateCase(targetCase.caseId, { status: "ARRIVED", assignedBed: bay });
    if (state.caseId === targetCase.caseId) {
      updateState({ status: "ARRIVED", assignedBed: bay });
    }

    try {
      await emergencyService.updateCaseStatus(targetCase.caseId, "ARRIVED");
    } catch (e) {
      console.warn("Supabase update error:", e);
    }

    setAdmissions(getHospitalAdmissions(hospitalId));
    setAlarmSilenced(true);
    alarmCoordinator.silenceAllTabs();

    setIsAdmittingScanned(false);
    setAdmitSuccessToast(`Patient ${targetCase.patientName} admitted to ${bay}!`);
    setTimeout(() => {
      setAdmitSuccessToast(null);
      setShowQrScanModal(false);
      stopCamera();
      setScannedCase(null);
      setScanInputText("");
    }, 2000);
  };

  // Helper: check if case targets THIS hospital (Dedicated hospital leads only with full regional alias support)
  const isCaseForThisHospital = (c: EmergencyRequest) => {
    // 1. If set to 'all' or empty, show all facilities (universal triage)
    if (!hospitalId || hospitalId === "all") return true;

    // 2. Generic unassigned enquiries
    if (!c.hospitalId) return true;

    // 3. Direct match
    if (c.hospitalId === hospitalId) return true;

    const norm = (str?: string | null) => (str || "").toLowerCase().trim();
    const cur = norm(hospitalId);
    const target = norm(c.hospitalId);

    // Apollo Family (Kolkata & Guwahati)
    const apolloGroup = ["h1", "h1_apollo", "apollo", "apollo_ghy", "h_apollo_guw", "apollo_excelcare"];
    if (apolloGroup.includes(cur) && apolloGroup.includes(target)) return true;

    // Gauhati Medical College & Hospital (GMCH)
    const gmchGroup = ["gmch", "h_gmch_guw", "h_gmch", "gauhati"];
    if (gmchGroup.includes(cur) && gmchGroup.includes(target)) return true;

    // Satribari Christian Hospital
    const satribariGroup = ["satribari", "h_satribari_guw", "h_satribari"];
    if (satribariGroup.includes(cur) && satribariGroup.includes(target)) return true;

    // Fortis Hospital Family
    const fortisGroup = ["h5", "h3", "h3_fortis", "fortis"];
    if (fortisGroup.includes(cur) && fortisGroup.includes(target)) return true;

    // AMRI Salt Lake Family
    const amriGroup = ["h2", "h2_amri", "amri"];
    if (amriGroup.includes(cur) && amriGroup.includes(target)) return true;

    // Marwari & MMC Family
    if (["marwari_ghy", "marwari"].includes(cur) && ["marwari_ghy", "marwari"].includes(target)) return true;
    if (["mmc_ghy", "mmc"].includes(cur) && ["mmc_ghy", "mmc"].includes(target)) return true;

    return false;
  };

  // Check all active cases across the regional network
  const allActiveCases = cases.filter(c => 
    c.caseId && 
    c.status !== "IDLE" && 
    c.status !== "CONFIRMED" && 
    c.status !== "DECLINED"
  );

  // Multi-case handling: filter active emergency queries DEDICATED ONLY to this hospital
  const activeCasesList = cases.filter(c => 
    c.caseId && 
    c.status !== "IDLE" && 
    c.status !== "CONFIRMED" &&
    c.status !== "DECLINED" &&
    isCaseForThisHospital(c)
  );

  const displayCases: EmergencyRequest[] = activeCasesList.length > 0 
    ? activeCasesList 
    : (state.caseId && 
       state.status !== "IDLE" && 
       state.status !== "CONFIRMED" && 
       state.status !== "DECLINED" &&
       isCaseForThisHospital(state)
        ? [state] 
        : []);

  const matchesCurrentHospital = true;

  // Is there any incoming unhandled case in the queue?
  const hasIncoming = displayCases.some(c => 
    c.status === "SEARCHING" || c.status === "PENDING" || c.status === "REQUEST_SENT" || c.status === "VERIFIED" || c.status === "HOSPITAL_REVIEWING"
  );

  const isIncoming = hasIncoming;

  // Freshness check
  const isFreshEmergency = Boolean(
    !state.createdAt || (Date.now() - state.createdAt < 15 * 60 * 1000)
  );

  // Explicit silence handler that stops sound immediately and synchronizes across all tabs
  const handleToggleSilence = () => {
    setAlarmSilenced((prev) => {
      const next = !prev;
      if (next) {
        alarmCoordinator.silenceAllTabs();
      }
      return next;
    });
  };

  // ⚡ AUTOMATIC BED RESERVATION: automatically picks next available bay & decrements bed capacity
  const handleAutoReserveBed = (caseItem: EmergencyRequest) => {
    setAlarmSilenced(true);
    alarmCoordinator.silenceAllTabs();
    
    // Determine hospital for this case
    const caseHospitalId = caseItem.hospitalId || hospitalId;
    const caseHospital = hospitals.find(h => h.id === caseHospitalId) || currentHospital;
    
    const currentEr = caseHospital.capacity.erBeds.available;
    if (currentEr <= 0) {
      alert(`Unable to auto-reserve: All ER beds at ${caseHospital.name} are currently occupied!`);
      return;
    }
    
    // Automatically pick next bay number
    const bayIndex = Math.max(1, caseHospital.capacity.erBeds.total - currentEr + 1);
    const isCritical = ["cardiac", "stroke", "trauma", "bleeding"].includes((caseItem.emergencyId || "").toLowerCase());
    const autoAssignedBay = isCritical ? `Red Bay 0${bayIndex}` : `ER Bay 0${bayIndex}`;

    // Automatically decrement available ER bed count
    const newEr = Math.max(0, currentEr - 1);
    const currentIcu = caseHospital.capacity.icuBeds.available;
    const newIcu = isCritical ? Math.max(0, currentIcu - 1) : currentIcu;

    updateCapacity(caseHospital.id, {
      erBeds: { ...caseHospital.capacity.erBeds, available: newEr },
      icuBeds: { ...caseHospital.capacity.icuBeds, available: newIcu },
    });

    // Automatically update this specific case to ACCEPTED / CAPACITY_RESERVED
    updateCase(caseItem.caseId, {
      status: 'ACCEPTED',
      assignedBed: autoAssignedBay,
    });
  };

  // Voice playback logic for patient's raw recorded voice
  const stopVoiceAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.currentTime = 0;
    }
    setIsPlayingVoice(false);
    setPlayingCaseId(null);
  };

  const playVoiceNote = async (audioUrl?: string, caseId?: string) => {
    if (isPlayingVoice && (!caseId || playingCaseId === caseId)) {
      stopVoiceAudio();
      return;
    }
    stopVoiceAudio();

    let audioSrcToPlay = audioUrl || (caseId ? cases.find(c => c.caseId === caseId)?.audioDataUrl : undefined) || state.audioDataUrl;

    // Asynchronously fetch raw audio from Supabase if missing from memory
    if (!audioSrcToPlay && caseId && isSupabaseConfigured && supabase) {
      setIsLoadingAudio(caseId);
      try {
        const { data } = await supabase
          .from("emergency_requests")
          .select("description")
          .eq("case_id", caseId)
          .single();
        if (data?.description) {
          const trimmed = data.description.trim();
          if (trimmed.startsWith("{") && trimmed.includes('"audio"')) {
            const parsed = JSON.parse(trimmed);
            if (parsed.audio) {
              audioSrcToPlay = parsed.audio;
              updateCase(caseId, { audioDataUrl: parsed.audio });
            }
          }
        }
      } catch (err) {
        console.warn("Could not retrieve raw audio from database:", err);
      } finally {
        setIsLoadingAudio(null);
      }
    }

    if (!audioSrcToPlay) {
      alert("No raw voice audio recorded for this case. The patient submitted a written request without microphone audio.");
      return;
    }

    try {
      let audioSrc = audioSrcToPlay;
      // Normalize AAC container naming for HTML5 Audio decoder
      if (audioSrc.startsWith("data:audio/aac") || audioSrc.startsWith("data:audio/m4a") || audioSrc.startsWith("data:audio/x-m4a")) {
        audioSrc = audioSrc.replace(/^data:audio\/(aac|m4a|x-m4a)/, "data:audio/mp4");
      }

      const audio = new Audio(audioSrc);
      voiceAudioRef.current = audio;
      setIsPlayingVoice(true);
      setPlayingCaseId(caseId || "active");

      audio.onended = () => {
        setIsPlayingVoice(false);
        setPlayingCaseId(null);
      };

      audio.onerror = () => {
        // Blob conversion fallback if direct dataUrl decode needs container normalization
        try {
          const arr = audioSrcToPlay.split(",");
          let mime = arr[0].match(/:(.*?);/)?.[1] || "audio/mp4";
          if (mime === "audio/aac" || mime === "audio/m4a" || mime === "audio/x-m4a") mime = "audio/mp4";
          const rawB64 = arr[1].trim();
          const bstr = atob(rawB64);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);
          const blob = new Blob([u8arr], { type: mime });
          const blobUrl = URL.createObjectURL(blob);
          const blobAudio = new Audio(blobUrl);
          voiceAudioRef.current = blobAudio;
          blobAudio.onended = () => {
            setIsPlayingVoice(false);
            setPlayingCaseId(null);
          };
          blobAudio.play().catch((err) => {
            console.error("Blob audio play error:", err);
            setIsPlayingVoice(false);
            setPlayingCaseId(null);
          });
        } catch (blobErr) {
          console.error("Blob fallback failed:", blobErr);
          setIsPlayingVoice(false);
          setPlayingCaseId(null);
        }
      };

      await audio.play();
    } catch (err) {
      console.warn("Direct audio.play() notice:", err);
      // Try unmuted play or inform user to interact
      setIsPlayingVoice(false);
      setPlayingCaseId(null);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPatientProfile(getStoredPatientProfile());
      setAdmissions(getHospitalAdmissions(hospitalId));
    }
  }, [showMedicalPassport, hospitalId, state.status]);

  // Track incoming active case IDs dedicated to this hospital
  const incomingCaseIdsStr = displayCases
    .filter(c => c.status === "PENDING" || c.status === "REQUEST_SENT" || c.status === "HOSPITAL_REVIEWING")
    .map(c => c.caseId)
    .sort()
    .join(",");

  // Only reset alarm silenced flag when a brand-new, unseen case arrives for THIS hospital
  useEffect(() => {
    if (incomingCaseIdsStr) {
      const currentIds = incomingCaseIdsStr.split(",").filter(Boolean);
      const hasBrandNew = currentIds.some(id => !knownIncomingCaseIdsRef.current.has(id));
      if (hasBrandNew) {
        currentIds.forEach(id => knownIncomingCaseIdsRef.current.add(id));
        setAlarmSilenced(false);
      }
    }
  }, [incomingCaseIdsStr]);

  // Subscribe to remote silence across other open tabs
  useEffect(() => {
    return alarmCoordinator.onRemoteSilence(() => {
      setAlarmSilenced(true);
    });
  }, []);

  // Handle Alarm audio playback cleanly via cross-tab coordinator (Strictly 1 tab plays, zero dual echoes)
  useEffect(() => {
    if (soundEnabled && !alarmSilenced && hasIncoming) {
      alarmCoordinator.playSiren()
        ?.then(() => setAudioBlocked(false))
        .catch(() => {
          setAudioBlocked(true);
          console.log("Audio waiting for user gesture.");
        });
    } else {
      alarmCoordinator.forceStopLocal();
      setAudioBlocked(false);
    }

    return () => {
      alarmCoordinator.forceStopLocal();
      stopVoiceAudio();
    };
  }, [soundEnabled, alarmSilenced, hasIncoming]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Active Operational Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${hasIncoming ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
          <span className="text-xs font-bold text-[#050B18]">
            Desk:
          </span>
          <select
            value={hospitalId}
            onChange={(e) => switchHospital(e.target.value)}
            className="text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl px-2.5 py-1 focus:outline-none focus:border-[#0052FF] cursor-pointer"
          >
            <option value="all">🌐 All Facilities (Universal Network View)</option>
            <option value="h_gmch_guw">🏥 GMCH (Guwahati)</option>
            <option value="h_satribari_guw">🏥 Satribari Christian Hospital (Guwahati)</option>
            <option value="h_apollo_guw">🏥 Apollo Excelcare (Guwahati)</option>
            <option value="h1">🏥 Apollo Multispeciality (Kolkata)</option>
            <option value="h2">🏥 AMRI Salt Lake (Kolkata)</option>
            <option value="h5">🏥 Fortis Anandapur (Kolkata)</option>
            <option value="apollo">🏥 Apollo City Hospital (NCR)</option>
          </select>
          <span className="text-xs font-bold text-gray-500">
            • {displayCases.length} Active ({displayCases.filter(c => c.status === 'PENDING' || c.status === 'REQUEST_SENT').length} Pending Triage)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowQrScanModal(true);
              setScannedCase(null);
              setScanInputText("");
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#0052FF] hover:bg-blue-600 text-white flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title="Scan incoming patient's Emergency Pass or Medical Passport"
          >
            <QrCode className="w-3.5 h-3.5" /> Scan Patient QR Pass
          </button>
          {hasIncoming && (
            <button
              onClick={handleToggleSilence}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                alarmSilenced
                  ? "bg-white text-gray-700 border-gray-200"
                  : "bg-red-600 text-white border-red-700 shadow-sm animate-pulse"
              }`}
            >
              {alarmSilenced ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {alarmSilenced ? "Alarm Muted" : "Silence Siren"}
            </button>
          )}
          {displayCases.length > 0 && (
            <button
              onClick={() => {
                setAlarmSilenced(true);
                alarmCoordinator.silenceAllTabs();
                resetState();
              }}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl border border-gray-200 flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset all active cases back to IDLE"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear All Cases
            </button>
          )}
        </div>
      </div>

      {/* Regional Facilities Alert Banner */}
      {allActiveCases.length > 0 && activeCasesList.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-amber-900 shadow-sm animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <div className="text-xs font-black">
                🚨 {allActiveCases.length} Emergency Case(s) Active in Regional Healthcare Network
              </div>
              <div className="text-[11px] font-medium text-amber-800">
                Incoming request assigned to: <span className="font-bold">{allActiveCases.map(c => c.hospitalId || 'General Triage').join(", ")}</span>. Currently viewing desk: <span className="font-bold">{currentHospital.name}</span>.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => switchHospital("all")}
              className="text-xs font-black bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl shadow cursor-pointer transition-colors"
            >
              Switch to Universal View
            </button>
            {allActiveCases[0].hospitalId && (
              <button
                onClick={() => switchHospital(allActiveCases[0].hospitalId!)}
                className="text-xs font-black bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl shadow-sm cursor-pointer transition-colors"
              >
                Switch to {allActiveCases[0].hospitalId} Desk
              </button>
            )}
          </div>
        </div>
      )}

      {/* Autoplay Unblock / Sound Activator Bar if blocked by browser policy */}
      {audioBlocked && matchesCurrentHospital && isIncoming && !alarmSilenced && (
        <button
          onClick={() => {
            alarmCoordinator.playSiren()?.then(() => setAudioBlocked(false));
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 animate-pulse cursor-pointer border border-red-500"
        >
          <Volume2 className="w-5 h-5 animate-bounce" />
          🚨 INCOMING EMERGENCY SIREN READY — CLICK HERE TO PLAY SIREN SOUND
        </button>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">
            <Activity className="w-4 h-4" /> ER Availability
          </div>
          <div suppressHydrationWarning className={`text-2xl font-black ${currentHospital.capacity.erBeds.available > 0 ? 'text-[#059669]' : 'text-red-600'}`}>
            {currentHospital.capacity.erBeds.available > 0 ? (
              <span className="flex items-baseline gap-1.5" suppressHydrationWarning>
                OPEN <span className="text-sm font-bold text-gray-400">({currentHospital.capacity.erBeds.available} free)</span>
              </span>
            ) : (
              <span className="flex items-baseline gap-1.5" suppressHydrationWarning>
                FULL <span className="text-sm font-bold text-red-400">(0 beds)</span>
              </span>
            )}
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">
            <Users className="w-4 h-4" /> ICU Availability
          </div>
          <div suppressHydrationWarning className="text-2xl font-black text-[#050B18]">
            {currentHospital.capacity.icuBeds.available}{" "}
            <span className="text-gray-400 text-lg font-bold">/ {currentHospital.capacity.icuBeds.total}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-2">
            <UserCheck className="w-4 h-4" /> Doctor in Charge
          </div>
          <div className="text-base font-black text-[#050B18] truncate" title={currentHospital.doctorInCharge.name}>
            {currentHospital.doctorInCharge.name}
          </div>
          <div className="text-[11px] text-gray-400 font-medium truncate">
            {currentHospital.doctorInCharge.shift}
          </div>
        </div>

        <div className="bg-[#EEF3FF] p-5 rounded-2xl border border-blue-100 shadow-sm">
          <div className="flex items-center gap-2 text-[#0052FF] font-bold text-xs uppercase tracking-wider mb-2">
            <Clock className="w-4 h-4" /> Last Updated
          </div>
          <div className="text-2xl font-black text-[#0052FF]">{currentHospital.lastUpdated}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Capacity Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="font-bold text-[#050B18]">Live Capacity Overview</h2>
                <span className="text-xs text-gray-400 font-medium">Auto-synced with AERVA Decision Engine</span>
              </div>
              <Link href="/partner/capacity">
                <button className="text-sm font-bold text-[#0052FF] hover:underline flex items-center gap-1">
                  Update Capacity <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-sm font-semibold text-gray-600 mb-1">ER Beds</div>
                <div className="text-xl font-black text-[#050B18]">
                  {currentHospital.capacity.erBeds.available}{" "}
                  <span className="text-gray-400 text-base font-bold">/ {currentHospital.capacity.erBeds.total}</span>{" "}
                  <span className={`text-xs ml-1 font-bold ${currentHospital.capacity.erBeds.available > 0 ? "text-[#059669]" : "text-red-500"}`}>
                    {currentHospital.capacity.erBeds.available > 0 ? "Available" : "Full"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    onClick={() => {
                      const newAvail = Math.max(0, currentHospital.capacity.erBeds.available - 1);
                      updateCapacity(currentHospital.id, {
                        erBeds: { ...currentHospital.capacity.erBeds, available: newAvail }
                      });
                    }}
                    className="text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                    title="Reserve 1 ER Bed"
                  >
                    - Reserve Bed
                  </button>
                  <button
                    onClick={() => {
                      const newAvail = Math.min(currentHospital.capacity.erBeds.total, currentHospital.capacity.erBeds.available + 1);
                      updateCapacity(currentHospital.id, {
                        erBeds: { ...currentHospital.capacity.erBeds, available: newAvail }
                      });
                    }}
                    className="text-[10px] font-bold bg-green-50 hover:bg-green-100 text-green-800 px-2 py-0.5 rounded-lg border border-green-200 transition-colors cursor-pointer"
                    title="Release 1 ER Bed"
                  >
                    + Release Bed
                  </button>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-sm font-semibold text-gray-600 mb-1">ICU Beds</div>
                <div className="text-xl font-black text-[#050B18]">
                  {currentHospital.capacity.icuBeds.available}{" "}
                  <span className="text-gray-400 text-base font-bold">/ {currentHospital.capacity.icuBeds.total}</span>{" "}
                  <span className="text-xs text-[#059669] ml-1 font-bold">Available</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-sm font-semibold text-gray-600 mb-1">Ventilators</div>
                <div className="text-xl font-black text-[#050B18]">
                  {currentHospital.capacity.ventilators.available}{" "}
                  <span className="text-gray-400 text-base font-bold">/ {currentHospital.capacity.ventilators.total}</span>{" "}
                  <span className="text-xs text-[#059669] ml-1 font-bold">Available</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-sm font-semibold text-gray-600 mb-1">OT Rooms</div>
                <div className="text-xl font-black text-[#050B18]">
                  {currentHospital.capacity.otRooms.available}{" "}
                  <span className="text-gray-400 text-base font-bold">/ {currentHospital.capacity.otRooms.total}</span>{" "}
                  <span className="text-xs text-[#059669] ml-1 font-bold">Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Multi-Query Emergency Alerts & Intake Triage Queue */}
          {displayCases.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-[#050B18]">
                    Inbound Emergency Triage Queue ({displayCases.length} {displayCases.length === 1 ? 'Patient Query' : 'Patient Queries'})
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  ⚡ Auto-Bed Reservation Active
                </span>
              </div>

              {displayCases.map((caseItem) => {
                const caseHospital = hospitals.find(h => h.id === caseItem.hospitalId) || currentHospital;
                const caseMatchesDesk = Boolean(
                  caseItem.hospitalId && (
                    caseItem.hospitalId === hospitalId ||
                    (caseItem.hospitalId === "h2_amri" && hospitalId === "h2") ||
                    (caseItem.hospitalId === "h2" && hospitalId === "h2_amri")
                  )
                );
                const isCaseIncoming = (caseItem.status === "PENDING" || caseItem.status === "REQUEST_SENT" || caseItem.status === "VERIFIED" || caseItem.status === "HOSPITAL_REVIEWING");
                const isCaseAccepted = (caseItem.status === "ACCEPTED" || caseItem.status === "HOSPITAL_ACCEPTED" || caseItem.status === "CAPACITY_RESERVED" || caseItem.status === "EN_ROUTE");
                const isThisVoicePlaying = isPlayingVoice && playingCaseId === caseItem.caseId;
                const isTranscriptOpen = showTranscriptCaseId === caseItem.caseId;

                return (
                  <div 
                    key={caseItem.caseId || Math.random().toString()}
                    className={`rounded-3xl border shadow-sm overflow-hidden transition-all ${
                      isCaseIncoming ? 'bg-red-50/40 border-red-200' :
                      caseItem.status === 'ARRIVED' ? 'bg-blue-50/40 border-[#0052FF]' :
                      'bg-emerald-50/20 border-emerald-200'
                    }`}
                  >
                    {/* Header Strip for Case */}
                    <div className={`px-6 py-4 border-b flex items-center justify-between ${
                      isCaseIncoming ? 'border-red-100 bg-red-100/40' : 
                      caseItem.status === 'ARRIVED' ? 'border-[#0052FF]/20 bg-blue-100/40' :
                      'border-emerald-100 bg-emerald-100/30'
                    }`}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-5 h-5 ${caseItem.status === 'ARRIVED' ? 'text-[#0052FF]' : isCaseIncoming ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`} />
                        <h2 className={`font-bold ${caseItem.status === 'ARRIVED' ? 'text-[#0052FF]' : isCaseIncoming ? 'text-red-900' : 'text-emerald-900'}`}>
                          {isCaseIncoming ? 'Incoming Patient Request (Needs Triage)' : 
                           caseItem.status === 'ARRIVED' ? 'PATIENT ARRIVED AT ER' : `PATIENT EN ROUTE • ${caseItem.assignedBed || 'BED RESERVED'}`}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCaseIncoming && (
                          <button
                            onClick={handleToggleSilence}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                              alarmSilenced
                                ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                : "bg-red-600 text-white border-red-700 shadow-sm animate-pulse hover:bg-red-700"
                            }`}
                          >
                            {alarmSilenced ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            {alarmSilenced ? "Alarm Muted" : "Silence Siren"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-6 space-y-4">

                      {/* Case Details Card */}
                      <div className="bg-white rounded-2xl p-5 border shadow-sm border-gray-100 space-y-4">
                        <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CASE {caseItem.caseId || "NR-10482"}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isCaseIncoming ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {isCaseIncoming ? 'INCOMING SOS' : (caseItem.assignedBed ? `BED HELD: ${caseItem.assignedBed}` : 'CAPACITY HELD')}
                              </span>
                            </div>
                            <div className="text-xl font-black text-[#050B18]">{caseItem.patientName || "Emergency Patient"}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500 font-semibold">
                              <span className="text-red-600 font-bold uppercase">{caseItem.emergencyId || "Cardiac"}</span>
                              <span>•</span>
                              <span>{caseItem.patientAge || "28"} yrs, {caseItem.patientGender || "Male"}</span>
                              <span>•</span>
                              <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold">Blood: {caseItem.bloodGroup || "O+"}</span>
                              <span>•</span>
                              <a 
                                href={`tel:${caseItem.patientPhone || "+91 98765 43210"}`}
                                className="text-[#0052FF] hover:underline font-bold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100"
                                title="Click to call patient directly"
                              >
                                <Phone className="w-3 h-3" />
                                {caseItem.patientPhone || "+91 98765 43210"}
                              </a>
                              {caseItem.location && (
                                <>
                                  <span>•</span>
                                  <span className="text-gray-600">📍 {caseItem.location.area}, {caseItem.location.city}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Medical Passport Link */}
                        <div className="flex items-center justify-between bg-purple-50/80 border border-purple-100 rounded-xl p-2.5">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="text-xs font-bold text-purple-900">
                              Patient Health Passport (Allergies & Medical Records)
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedModalCase(caseItem);
                              setShowMedicalPassport(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Passport
                          </button>
                        </div>

                        {/* Patient Voice Note Player - ONLY render voice player when voice brief is present */}
                        {(caseItem.hasVoiceBrief || caseItem.audioDataUrl) ? (
                          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-sm">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                🎙️ PATIENT&apos;S RAW VOICE RECORDING
                              </div>
                              {isThisVoicePlaying && (
                                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                                  Playing Raw Audio...
                                </span>
                              )}
                              {isLoadingAudio === caseItem.caseId && (
                                <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full animate-pulse">
                                  Loading Audio...
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mb-2.5">
                              {caseItem.patientName || "Emergency Patient"} · {caseItem.recordedAt || "Live Intake"} · {Math.floor((caseItem.recordingDuration || 0) / 60).toString().padStart(2,"0")}:{((caseItem.recordingDuration || 0) % 60).toString().padStart(2,"0")}
                            </div>
                            <button 
                              onClick={() => playVoiceNote(caseItem.audioDataUrl, caseItem.caseId)}
                              disabled={isLoadingAudio === caseItem.caseId}
                              className={`w-full flex items-center gap-2 text-xs font-black text-white py-3 px-4 rounded-xl justify-center transition-all cursor-pointer shadow-sm ${
                                isThisVoicePlaying ? "bg-amber-600 hover:bg-amber-700" : "bg-[#0052FF] hover:bg-blue-600"
                              }`}
                            >
                              {isThisVoicePlaying ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                              {isThisVoicePlaying ? "Stop Audio" : isLoadingAudio === caseItem.caseId ? "Retrieving Audio..." : "▶ Play Raw Human Voice Recording"}
                            </button>
                            {caseItem.audioDataUrl && (
                              <div className="mt-2.5 bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1">
                                  <span>🔊</span> NATIVE AUDIO PLAYER:
                                </div>
                                <audio 
                                  controls 
                                  src={caseItem.audioDataUrl} 
                                  className="w-full h-8 accent-[#0052FF]" 
                                  preload="metadata" 
                                />
                              </div>
                            )}
                            {/* Prominent Raw Patient Voice Transcription */}
                            {(caseItem.transcript || caseItem.writtenDescription) && (
                              <div className="mt-3.5 bg-white border border-emerald-200 rounded-xl p-3.5 shadow-xs">
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-900 mb-1">
                                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                  Patient Raw Voice Transcription
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-900 italic leading-relaxed">
                                  &ldquo;{caseItem.transcript || caseItem.writtenDescription}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Written Emergency Details (when no microphone recording was made) */
                          (caseItem.transcript || caseItem.writtenDescription) && (
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                <FileText className="w-3.5 h-3.5 text-gray-400" />
                                Patient Written Triage Description (Text Only)
                              </div>
                              <p className="text-xs sm:text-sm font-semibold text-gray-800 italic leading-relaxed">
                                &ldquo;{caseItem.transcript || caseItem.writtenDescription}&rdquo;
                              </p>
                              <div className="mt-2 text-[11px] text-gray-400">
                                ℹ️ The patient submitted this triage request via text without recording a voice note.
                              </div>
                            </div>
                          )
                        )}

                        {/* Status Badges & Action Buttons */}
                        <div className="pt-2">
                          {isCaseIncoming && (
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button 
                                  onClick={() => handleAutoReserveBed(caseItem)} 
                                  className="flex-[2] bg-[#059669] hover:bg-green-700 text-white py-3.5 px-4 rounded-xl font-black text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  ⚡ VERIFY & AUTO-RESERVE BED
                                </button>
                                <button 
                                  onClick={() => { 
                                    setAlarmSilenced(true); 
                                    updateCase(caseItem.caseId, { status: 'DECLINED' }); 
                                  }} 
                                  className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-3.5 px-3 rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                  UNABLE TO ACCEPT
                                </button>
                              </div>
                              <div className="flex gap-2">
                                <a href={`tel:${caseItem.patientPhone || "+91 98765 43210"}`} className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 py-2.5 rounded-xl font-bold text-xs hover:bg-green-100 transition-colors border border-green-100">
                                  <Phone className="w-3.5 h-3.5" /> CALL PATIENT
                                </a>
                                <Link href="/partner/message" className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors border border-gray-100">
                                  <MessageSquare className="w-3.5 h-3.5" /> MESSAGE
                                </Link>
                                <button 
                                  onClick={() => {
                                    setSelectedModalCase(caseItem);
                                    setShowLocationModal(true);
                                  }} 
                                  className="flex-[1.2] bg-blue-50 text-[#0052FF] py-2.5 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors border border-blue-100 cursor-pointer"
                                >
                                  VIEW LOCATION
                                </button>
                              </div>
                            </div>
                          )}

                          {isCaseAccepted && (
                            <div className="space-y-3">
                              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-0.5">
                                      BED AUTOMATICALLY RESERVED • {caseItem.assignedBed || "Red Bay 01"}
                                    </div>
                                    <div className="text-xs font-semibold text-emerald-900">
                                      Capacity locked in Supabase. Patient has been notified on mobile app and is en route.
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-1 rounded-lg shrink-0">
                                  LOCKED
                                </span>
                              </div>

                              {/* Green Corridor Dispatch to Traffic Control Tower */}
                              {["cardiac", "stroke", "trauma", "bleeding"].includes(caseItem.emergencyId?.toLowerCase() || "") && (
                                <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Siren className="w-4 h-4 text-emerald-600 animate-pulse" />
                                      <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                                        High Acuity: {caseItem.emergencyId?.toUpperCase()} Emergency
                                      </span>
                                    </div>
                                    {caseItem.greenCorridorAlerted && (
                                      <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                                        TOWER ALERTED
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-600 font-medium mb-2.5">
                                    {caseItem.greenCorridorAlerted 
                                      ? "Traffic Control Tower has acknowledged this route. Traffic signals along the route are being cleared for green passage."
                                      : "High acuity detected. Hospital doctors can trigger an instant Traffic Control Tower alert to open a Green Corridor."}
                                  </p>
                                  {!caseItem.greenCorridorAlerted ? (
                                    <button
                                      onClick={() => updateCase(caseItem.caseId, { greenCorridorAlerted: true })}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                                    >
                                      <Siren className="w-4 h-4" />
                                      Send SOS Alert to Traffic Control Towers (Clear Route)
                                    </button>
                                  ) : (
                                    <div className="w-full bg-emerald-100 text-emerald-800 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-300">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                      Green Corridor Active: Signals 1, 2, 3 & 4 Pre-empted
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <a href={`tel:${caseItem.patientPhone || "+91 98765 43210"}`} className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 py-2 rounded-xl font-bold text-xs hover:bg-green-100 transition-colors border border-green-100">
                                  <Phone className="w-3.5 h-3.5" /> CALL
                                </a>
                                <Link href="/partner/message" className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 text-gray-700 py-2 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors border border-gray-100">
                                  <MessageSquare className="w-3.5 h-3.5" /> MESSAGE
                                </Link>
                                <button 
                                  onClick={() => {
                                    setSelectedModalCase(caseItem);
                                    setShowLocationModal(true);
                                  }} 
                                  className="flex-[1.2] bg-blue-50 text-[#0052FF] py-2 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors border border-blue-100 cursor-pointer"
                                >
                                  VIEW ROUTE
                                </button>
                              </div>
                            </div>
                          )}

                          {caseItem.status === 'ARRIVED' && (
                            <button 
                              onClick={() => updateCase(caseItem.caseId, { status: 'CONFIRMED' })} 
                              className="w-full bg-[#0052FF] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-600 shadow-sm transition-colors uppercase tracking-wider cursor-pointer"
                            >
                              Confirm Arrival & Bed Intake
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback when no active emergency */
            <div className="bg-gray-50 rounded-3xl border border-gray-100 p-8 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <div className="font-bold text-gray-500">No active emergency requests</div>
              <div className="text-xs text-gray-400 mt-1">Incoming patient dispatches will appear here in real time. Multiple queries will queue automatically.</div>
            </div>
          )}
        </div>

        {/* Right Column: Doctor in Charge & Recent Updates */}
        <div className="space-y-6">
          {/* Doctor in Charge on Duty Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-[#050B18]">Doctor in Charge on Duty</h3>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                currentHospital.doctorInCharge.onDuty ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
              }`}>
                {currentHospital.doctorInCharge.onDuty ? "ON DUTY" : "OFF DUTY"}
              </span>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                  DR
                </div>
                <div>
                  <h4 className="font-black text-base text-[#050B18] leading-tight">
                    {currentHospital.doctorInCharge.name}
                  </h4>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                    {currentHospital.doctorInCharge.designation}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    {currentHospital.doctorInCharge.specialty}
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono">
                    {currentHospital.doctorInCharge.qualification}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3 space-y-2 border border-gray-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Medical Reg No:</span>
                  <span className="font-mono font-bold text-[#050B18]">{currentHospital.doctorInCharge.registrationNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Active Shift:</span>
                  <span className="font-semibold text-gray-800">{currentHospital.doctorInCharge.shift}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Intercom Hot-Line:</span>
                  <span className="font-bold text-[#0052FF]">{currentHospital.doctorInCharge.phoneExtension}</span>
                </div>
              </div>

              <Link href="/partner/capacity">
                <button className="w-full text-xs font-bold text-[#0052FF] bg-blue-50 py-2.5 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100 flex items-center justify-center gap-1.5 cursor-pointer">
                  Update Duty Doctor / Handover <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Recent Updates */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-fit">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-[#050B18]">Recent Updates</h2>
            </div>
          <div className="p-6 space-y-6">
            <div className="relative pl-4 border-l-2 border-[#0052FF]">
              <div className="absolute w-2.5 h-2.5 rounded-full bg-[#0052FF] -left-[6px] top-1" />
              <div className="text-sm font-semibold text-[#050B18]">ER capacity updated</div>
              <div className="text-xs text-gray-400 font-medium">2 min ago by Dr. Sharma</div>
            </div>
            <div className="relative pl-4 border-l-2 border-gray-200">
              <div className="absolute w-2.5 h-2.5 rounded-full bg-gray-300 -left-[6px] top-1" />
              <div className="text-sm font-semibold text-gray-600">Blood bank inventory verified</div>
              <div className="text-xs text-gray-400 font-medium">8 min ago by System</div>
            </div>
            <div className="relative pl-4 border-l-2 border-gray-200">
              <div className="absolute w-2.5 h-2.5 rounded-full bg-gray-300 -left-[6px] top-1" />
              <div className="text-sm font-semibold text-gray-600">Ambulance status updated</div>
              <div className="text-xs text-gray-400 font-medium">15 min ago by Transport Desk</div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Emergency Admissions & Triage Arrival History */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#0052FF]" />
              <h2 className="font-bold text-base text-[#050B18]">Emergency Admissions & Triage History</h2>
              <span className="bg-blue-50 text-[#0052FF] text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-100">
                {admissions.length} Logged
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified clinical handovers, assigned ER bays, attending physicians, and transit logs for {currentHospital.name}
            </p>
          </div>
          <div className="text-xs text-gray-400 font-medium">
            Auto-synced with Patient Navigation
          </div>
        </div>

        <div className="p-6">
          {admissions.length === 0 ? (
            <div className="py-10 text-center">
              <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <div className="font-bold text-gray-600 text-sm">No Admissions Logged Yet</div>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                When patients arrive at {currentHospital.name} and confirm arrival on their navigation screen, the triage handover pass will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {admissions.map((adm) => (
                <div 
                  key={adm.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 hover:border-gray-200 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#0052FF] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {adm.caseId}
                      </span>
                      <span className="font-bold text-sm text-[#050B18]">
                        {adm.patientName || "Emergency Patient"} {adm.patientAge ? `(${adm.patientAge}y, ${adm.patientGender || ''})` : ''}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Arrived & Admitted
                      </span>
                      {adm.greenCorridorUsed && (
                        <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Siren className="w-3 h-3" /> Green Corridor Cleared
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span><strong>Condition:</strong> {adm.emergencyType || "Emergency Case"}</span>
                      <span><strong>Assigned Bay:</strong> <span className="text-emerald-700 font-bold">{adm.triageBay || "Red Bay 01"}</span></span>
                      <span><strong>Doctor in Charge:</strong> <span className="font-semibold text-gray-800">{adm.doctorInChargeName || currentHospital.doctorInCharge.name}</span></span>
                    </div>

                    {adm.originArea && (
                      <div className="text-[11px] text-gray-400">
                        Transit Origin: {adm.originArea}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-gray-700">
                      {new Date(adm.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div className="text-[11px] font-mono text-gray-400">
                      {new Date(adm.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    {/* Live Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLocationModal(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl overflow-hidden shadow-2xl relative z-10 w-full max-w-lg"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#050B18]">Live Patient Location</h2>
                <div className="text-xs text-gray-500">
                  {(selectedModalCase || state).patientName || "Emergency Patient"} • {(selectedModalCase || state).location?.area || "Salt Lake"}, {(selectedModalCase || state).location?.city || "Kolkata"}
                </div>
              </div>
              <button onClick={() => setShowLocationModal(false)} className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>
            
            <div className="relative h-64 bg-gray-100 overflow-hidden">
              {/* Mock Map Background */}
              <div className="absolute inset-0 z-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(#0052FF 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }} />
              
              {/* Animated Route Line */}
              <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
                <motion.path 
                  d="M 50,200 C 100,100 250,50 400,100"
                  fill="none"
                  stroke="#0052FF"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="8 8"
                />
              </svg>
              
              {/* Hospital Marker */}
              <div className="absolute top-[100px] right-[100px] w-6 h-6 bg-white rounded-full border-4 border-[#059669] flex items-center justify-center shadow-lg">
                <div className="w-1.5 h-1.5 bg-[#059669] rounded-full" />
              </div>

              {/* Patient Marker (Moving) */}
              <motion.div 
                className="absolute top-[200px] left-[50px] w-8 h-8 bg-[#0052FF] rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                animate={{ 
                  x: [0, 100, 200], 
                  y: [0, -60, -70] 
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </motion.div>
            </div>
            
            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase">Origin Area</div>
                <div className="font-black text-[#050B18]">{(selectedModalCase || state).location?.area || "Live GPS Location"}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-500 uppercase">Live ETA</div>
                <div className="font-black text-[#059669]">~8 mins</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Medical Passport Modal */}
      {showMedicalPassport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMedicalPassport(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-2xl relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 bg-[#0A2540] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-md">
                    PATIENT DIGITAL PASSPORT
                  </span>
                  {(patientProfile?.organDonor ?? true) && (
                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-md">
                      Organ Donor Pledged
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black mt-1.5">{(selectedModalCase || state).patientName || patientProfile?.fullName || "Jisan Halder"}</h2>
                <p className="text-xs text-blue-200">
                  AERVA Health ID: {patientProfile?.healthId || "HID-9842-108"} • {(selectedModalCase || state).patientAge || patientProfile?.age || "28"} Yrs • {(selectedModalCase || state).patientGender || patientProfile?.gender || "Male"} • Blood: <span className="font-bold text-white">{(selectedModalCase || state).bloodGroup || patientProfile?.bloodGroup || "O+"}</span>
                </p>
              </div>
              <button 
                onClick={() => setShowMedicalPassport(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Critical Allergies */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2 font-black text-red-800 uppercase text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  FLAGGED DRUG & SUBSTANCE ALLERGIES
                </div>
                {patientProfile?.allergies && patientProfile.allergies.length > 0 ? (
                  <div className="space-y-1.5">
                    {patientProfile.allergies.map((allergy) => (
                      <div key={allergy.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-red-100">
                        <div>
                          <span className="font-bold text-[#050B18]">{allergy.name}</span>
                          <span className="text-[10px] text-gray-400 block font-medium">{allergy.category} Allergen</span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                          allergy.severity.includes("Severe") ? "bg-red-600 text-white" : "bg-amber-100 text-amber-800"
                        }`}>
                          {allergy.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs italic">No known drug or substance allergies recorded on file.</div>
                )}
              </div>

              {/* Chronic Conditions */}
              <div>
                <span className="font-black text-gray-400 uppercase text-[10px] tracking-wider block mb-2">
                  CHRONIC CONDITIONS & HISTORY
                </span>
                <div className="flex flex-wrap gap-2">
                  {patientProfile?.chronicConditions && patientProfile.chronicConditions.length > 0 ? (
                    patientProfile.chronicConditions.map((cond) => (
                      <span key={cond} className="bg-blue-50 text-[#0052FF] font-bold px-3 py-1.5 rounded-xl border border-blue-100">
                        {cond}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic text-xs">No chronic conditions declared.</span>
                  )}
                </div>
              </div>

              {/* Ongoing Prescriptions */}
              <div>
                <span className="font-black text-gray-400 uppercase text-[10px] tracking-wider block mb-2">
                  ACTIVE ONGOING MEDICATIONS
                </span>
                <div className="space-y-2">
                  {patientProfile?.medications && patientProfile.medications.length > 0 ? (
                    patientProfile.medications.map((med) => (
                      <div key={med.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#050B18]">{med.name} • {med.dosage}</div>
                          <div className="text-gray-500 text-[11px]">{med.frequency} ({med.prescribedFor})</div>
                        </div>
                        <span className="bg-purple-50 text-purple-700 font-bold px-2 py-1 rounded-md text-[10px]">Active</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 italic text-xs">No active ongoing medications.</div>
                  )}
                </div>
              </div>

              {/* Uploaded Documents on File */}
              <div>
                <span className="font-black text-gray-400 uppercase text-[10px] tracking-wider block mb-2">
                  DIGITAL RECORDS ON FILE
                </span>
                <div className="space-y-2">
                  {patientProfile?.prescriptions && patientProfile.prescriptions.length > 0 ? (
                    patientProfile.prescriptions.map((doc) => (
                      <div key={doc.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#0052FF]" />
                          <div>
                            <span className="font-bold text-[#050B18] block">{doc.title}</span>
                            <span className="text-[10px] text-gray-400">{doc.doctorName} • {doc.date} • {doc.category || "Record"}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                          {doc.fileSize || "Verified"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 italic text-xs">No digital records on file.</div>
                  )}
                </div>
              </div>

              {/* Emergency Kin Contact */}
              {patientProfile?.emergencyContactPhone && (
                <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Emergency Kin Contact</span>
                    <span className="font-bold text-[#050B18] text-xs">
                      {patientProfile.emergencyContactName} ({patientProfile.emergencyContactRelation}) • {patientProfile.emergencyContactPhone}
                    </span>
                  </div>
                  <a 
                    href={`tel:${patientProfile.emergencyContactPhone}`}
                    className="bg-[#0052FF] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-600 transition"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Kin
                  </a>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setShowMedicalPassport(false)}
                className="bg-[#050B18] text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-gray-800 cursor-pointer"
              >
                Close Passport
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: TRIAGE QR ADMISSION SCANNER */}
      {showQrScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => {
              setShowQrScanModal(false);
              stopCamera();
            }} 
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="bg-[#050B18] text-white p-5 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0052FF] flex items-center justify-center shadow-md">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Triage QR Admission Scanner</h3>
                  <p className="text-[11px] text-gray-400">Scan Patient Pass or paste Case ID for zero-delay admission</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowQrScanModal(false);
                  stopCamera();
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Success Notification */}
            {admitSuccessToast && (
              <div className="bg-emerald-500 text-white px-5 py-3 text-xs font-bold flex items-center gap-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                <span>{admitSuccessToast}</span>
              </div>
            )}

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              
              {/* Camera Scanner Viewfinder */}
              <div className="bg-[#050B18] rounded-2xl p-4 text-center relative overflow-hidden border border-gray-800">
                {isCameraActive ? (
                  <div className="relative w-full h-48 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                    <video 
                      ref={scannerVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover" 
                    />
                    {/* Scanner line overlay */}
                    <div className="absolute inset-x-4 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse pointer-events-none" />
                    <div className="absolute inset-4 border-2 border-dashed border-white/40 rounded-lg pointer-events-none" />
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <Camera className="w-10 h-10 text-gray-500 mx-auto" />
                    <p className="text-xs text-gray-400 font-bold">Optical Camera Scanner Ready</p>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={isCameraActive ? stopCamera : startCamera}
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    {isCameraActive ? "Stop Camera" : "Launch Camera Stream"}
                  </button>
                  <button
                    onClick={() => {
                      const testId = state.caseId || (displayCases[0]?.caseId) || "NR-10482";
                      setScanInputText(testId);
                      handleLookupCase(testId);
                    }}
                    className="px-3.5 py-1.5 bg-[#0052FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    ⚡ Test Scan Active Case
                  </button>
                </div>
              </div>

              {/* Manual Entry or Scanned Barcode Paste */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 block">
                  Manual Case ID / Pass URL Entry
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scanInputText}
                    onChange={(e) => setScanInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLookupCase(scanInputText);
                    }}
                    placeholder="Enter NR-10482 or paste pass URL..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-[#050B18] focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                  />
                  <button
                    onClick={() => handleLookupCase(scanInputText)}
                    className="bg-[#050B18] hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" /> Lookup
                  </button>
                </div>
              </div>

              {/* Scanned Case Verification Card */}
              {scannedCase && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase bg-[#0052FF] text-white px-2 py-0.5 rounded">
                          VERIFIED CASE
                        </span>
                        <span className="font-mono text-xs font-black text-[#050B18]">
                          {scannedCase.caseId}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-[#050B18] mt-1">
                        {scannedCase.patientName}
                      </h4>
                      <p className="text-xs text-gray-600 font-medium">
                        {scannedCase.patientPhone} • Blood Group: <strong className="text-red-600">{scannedCase.bloodGroup || "O+"}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">Status</span>
                      <span className="inline-block bg-white text-[#0052FF] font-black text-xs px-2.5 py-1 rounded-lg border border-blue-200">
                        {scannedCase.status}
                      </span>
                    </div>
                  </div>

                  {/* Bed Bay details */}
                  <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-500 font-bold block text-[10px] uppercase">Allocated Triage Bay</span>
                      <strong className="text-emerald-700">{scannedCase.assignedBed || "Red Bay 01 (Critical Resuscitation)"}</strong>
                    </div>
                    <Link
                      href={`/pass?caseId=${scannedCase.caseId}`}
                      target="_blank"
                      className="text-xs font-bold text-[#0052FF] hover:underline flex items-center gap-1"
                    >
                      View Live Pass <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Action: 1-Tap Admission */}
                  <button
                    onClick={() => handleAdmitScannedCase(scannedCase)}
                    disabled={isAdmittingScanned || scannedCase.status === "ARRIVED"}
                    className={`w-full py-3.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                      scannedCase.status === "ARRIVED"
                        ? "bg-emerald-600 text-white cursor-default"
                        : "bg-[#0052FF] hover:bg-blue-600 text-white shadow-blue-500/20"
                    }`}
                  >
                    {isAdmittingScanned ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Admitting Patient...</span>
                      </>
                    ) : scannedCase.status === "ARRIVED" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Patient Already Admitted to Bay</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>⚡ CONFIRM TRIAGE ADMISSION & UNLOCK BAY</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <span>AERVA High-Speed Admission Protocol</span>
              <button 
                onClick={() => {
                  setShowQrScanModal(false);
                  stopCamera();
                }}
                className="bg-gray-200 hover:bg-gray-300 text-[#050B18] px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Close Scanner
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
