"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { EMERGENCIES } from "@/lib/demo-data";
import { AppNavbar } from "@/components/app/AppNavbar";
import { useEmergencyState, useHospitalData } from "@/lib/demo-state";
import { 
  MapPin, 
  Activity, 
  Bone, 
  Brain, 
  Droplet, 
  Flame, 
  Wind, 
  HelpCircle, 
  ShieldCheck, 
  Mic, 
  Square, 
  Trash2, 
  Play, 
  User, 
  AlertTriangle,
  ArrowRight,
  Phone,
  HeartPulse,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building2,
  Map,
  List,
  Clock,
  Edit3,
  RefreshCw,
  Compass,
  Ambulance,
  Car,
  Volume2,
} from "lucide-react";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";
import { getStoredPatientProfile } from "@/lib/patient-profile";
import { locationService } from "@/lib/services/locationService";

const iconMap: Record<string, any> = {
  Activity, Bone, Brain, Droplet, Flame, Wind, HelpCircle
};

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "Unknown"];
const GENDERS = ["Male", "Female", "Other"];

function EmergencyTriageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");
  const { state, updateState } = useEmergencyState();
  const { hospitals } = useHospitalData();
  const { lang } = useLang();

  // Unified State (Zero Multi-step Barriers)
  const [selectedId, setSelectedId] = useState<string>(
    initialType || state.emergencyId || "cardiac"
  );
  const [patientName, setPatientName] = useState(state.patientName || "Jisan Halder");
  const [patientPhone, setPatientPhone] = useState(state.patientPhone || "+91 98765 43210");
  const [patientAge, setPatientAge] = useState(state.patientAge || "28");
  const [patientGender, setPatientGender] = useState(state.patientGender || "Male");
  const [bloodGroup, setBloodGroup] = useState(state.bloodGroup || "O+");
  const [writtenDescription, setWrittenDescription] = useState(state.writtenDescription || "");
  const [ambulanceRequired, setAmbulanceRequired] = useState<boolean>(
    state.ambulanceRequired ?? true
  );

  // Collapsible Nearby Hospitals Accordion
  const [showNearbyHospitals, setShowNearbyHospitals] = useState(false);
  const [hospitalViewMode, setHospitalViewMode] = useState<"LIST" | "MAP">("LIST");
  const [geofencedHospitals, setGeofencedHospitals] = useState<any[]>([]);
  const [isLoadingGeofenced, setIsLoadingGeofenced] = useState(false);

  // Location State & Inline Quick Edit
  const [isLocating, setIsLocating] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationArea, setLocationArea] = useState(state.location?.area || "Salt Lake, Sector V");
  const [locationCity, setLocationCity] = useState(state.location?.city || "Kolkata");

  // Voice Recording State
  const [recordingState, setRecordingState] = useState<"IDLE" | "RECORDING" | "PROCESSING" | "RECORDED">("IDLE");
  const [recordTimer, setRecordTimer] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  
  const [realTranscript, setRealTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [realSummary, setRealSummary] = useState<any>(null);
  const recognitionRef = useRef<any>(null);

  // Sync initial type from query params if given
  useEffect(() => {
    if (initialType && EMERGENCIES.some(e => e.id === initialType)) {
      setSelectedId(initialType);
    }
  }, [initialType]);

  // Load stored patient profile if available
  useEffect(() => {
    const profile = getStoredPatientProfile();
    if (profile) {
      if (!state.patientName && profile.fullName) setPatientName(profile.fullName);
      if (!state.patientPhone && profile.phone) setPatientPhone(profile.phone);
      if (!state.patientAge && profile.age) setPatientAge(profile.age);
      if (!state.patientGender && profile.gender) setPatientGender(profile.gender);
      if (!state.bloodGroup && profile.bloodGroup) setBloodGroup(profile.bloodGroup);
    }
  }, [state.patientName, state.patientPhone, state.patientAge, state.patientGender, state.bloodGroup]);

  // Fetch live 50km geofenced hospitals for patient's real location worldwide
  useEffect(() => {
    const lat = state.location?.lat;
    const lng = state.location?.lng;
    if (typeof lat === "number" && typeof lng === "number") {
      setIsLoadingGeofenced(true);
      fetch(`/api/hospitals/nearby?lat=${lat}&lng=${lng}&radius=50000`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            const list = data.results || data.hospitals || [];
            if (Array.isArray(list) && list.length > 0) {
              setGeofencedHospitals(list);
            }
          }
        })
        .catch((err) => console.warn("[EmergencyPage] Geofenced load error:", err))
        .finally(() => setIsLoadingGeofenced(false));
    }
  }, [state.location?.lat, state.location?.lng]);

  // Auto-detect GPS location silently if not captured yet
  useEffect(() => {
    if (!state.location) {
      setIsLocating(true);
      locationService
        .getCurrentPosition({ timeoutMs: 7000 })
        .then((loc) => {
          const area = loc.locality || "Salt Lake, Sector V";
          const city = loc.city || "Kolkata";
          setLocationArea(area);
          setLocationCity(city);
          updateState({
            location: {
              lat: loc.latitude,
              lng: loc.longitude,
              area,
              city,
            },
          });
        })
        .catch(async () => {
          const ipLoc = await locationService.getIpFallbackLocation();
          const area = ipLoc.locality || "Detected Area";
          const city = ipLoc.city || "Nearby City";
          setLocationArea(area);
          setLocationCity(city);
          updateState({
            location: {
              lat: ipLoc.latitude,
              lng: ipLoc.longitude,
              area,
              city,
            },
          });
        })
        .finally(() => {
          setIsLocating(false);
        });
    }
  }, [state.location, updateState]);

  // Voice recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recordingState === "RECORDING") {
      interval = setInterval(() => setRecordTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setLiveTranscript("");

      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
          rec.onresult = (e: any) => {
            let speechTxt = "";
            for (let i = 0; i < e.results.length; i++) {
              speechTxt += e.results[i][0].transcript;
            }
            if (speechTxt.trim()) {
              setLiveTranscript(speechTxt);
              setRealTranscript(speechTxt);
            }
          };
          rec.start();
          recognitionRef.current = rec;
        }
      } catch (speechErr) {
        console.warn("Speech recognition notice:", speechErr);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioBlobRef.current = audioBlob;
        setRecordingState("PROCESSING");
        
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "emergency-brief.webm");
          const response = await fetch("/api/transcribe", { method: "POST", body: formData });
          if (response.ok) {
            const data = await response.json();
            if (data.transcript && !realTranscript) {
              setRealTranscript(data.transcript);
            }
            setRealSummary(data.summary || null);
          } else if (!realTranscript) {
            setRealTranscript("Voice brief recorded. Ready for hospital triage.");
          }
        } catch {
          if (!realTranscript) {
            setRealTranscript("Voice brief recorded. Ready for hospital triage.");
          }
        } finally {
          setRecordingState("RECORDED");
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecordingState("RECORDING");
      setRecordTimer(0);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to record a voice brief.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const deleteRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setRecordingState("IDLE");
    setRealTranscript("");
    setLiveTranscript("");
    setRealSummary(null);
    audioBlobRef.current = null;
  };

  const handleSaveLocation = () => {
    if (locationArea.trim()) {
      updateState({
        location: {
          lat: state.location?.lat || 22.5804,
          lng: state.location?.lng || 88.4173,
          area: locationArea.trim(),
          city: locationCity.trim() || "Kolkata",
        }
      });
      setIsEditingLocation(false);
    }
  };

  const handleProceed = async () => {
    if (selectedId && patientName) {
      const caseId = state.caseId || ("NR-" + Math.floor(10000 + Math.random() * 90000));
      
      let audioDataUrl = state.audioDataUrl || "";
      if (audioBlobRef.current) {
        const reader = new FileReader();
        audioDataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioBlobRef.current!);
        });
      }

      const now = new Date();
      const recordedAt = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

      updateState({
        caseId,
        patientName,
        patientPhone,
        patientAge,
        patientGender,
        bloodGroup,
        emergencyId: selectedId,
        writtenDescription,
        hasVoiceBrief: recordingState === "RECORDED",
        audioDataUrl,
        recordingDuration: recordTimer,
        recordedAt,
        transcript: realTranscript,
        summary: realSummary,
        status: "SEARCHING",
        messages: [],
        createdAt: Date.now(),
        ambulanceRequired,
      });

      router.push(`/emergency/analyzing?type=${selectedId}`);
    }
  };

  const activeHospitalsList = geofencedHospitals.length > 0
    ? geofencedHospitals.map((item) => {
        const isVerified =
          item.verification_status === "AERVA_VERIFIED_CURRENT" ||
          item.verificationStatus === "aerva_verified";
        const erBeds = item.resources?.generalBeds ?? item.capacity?.er_beds_available ?? null;
        const icuBeds = item.resources?.icuBeds ?? item.capacity?.icu_beds_available ?? null;

        return {
          id: item.hospital_id || item.placeId,
          name: item.name,
          address: item.address || "Discovered Emergency Facility",
          distance: item.distance_km ?? 2.5,
          eta: item.eta_minutes ?? 7,
          verified: isVerified,
          verificationStatus: item.verification_status || item.verificationStatus,
          hasResources: isVerified && item.resources !== null,
          erBedsAvailable: erBeds,
          icuBedsAvailable: icuBeds,
          specialists: isVerified ? ["Emergency Medicine", "Critical Care", "Cardiology"] : ["Discovered ER Center", "Public Listing"],
          notice: item.notice || "Resource availability unverified or outdated.",
        };
      })
    : hospitals.map((h) => ({
        id: h.id,
        name: h.name,
        address: h.address,
        distance: h.distance,
        eta: h.eta,
        verified: h.verified,
        verificationStatus: h.verified ? "AERVA_VERIFIED_CURRENT" : "UNVERIFIED",
        hasResources: true,
        erBedsAvailable: h.capacity.erBeds.available,
        icuBedsAvailable: h.capacity.icuBeds.available,
        specialists: h.specialists,
        notice: "Hospital-reported availability; call to confirm before travel.",
      }));

  const verifiedHospitalsCount = activeHospitalsList.filter((h) => h.verified).length;
  const totalVerifiedErBeds = activeHospitalsList
    .filter((h) => h.verified && typeof h.erBedsAvailable === "number")
    .reduce((acc, h) => acc + (h.erBedsAvailable || 0), 0);
  const nearestHosp = activeHospitalsList[0];
  const totalErBeds = totalVerifiedErBeds;

  return (
    <>
      <AppNavbar 
        title={lang === "hi" ? "आपातकालीन सहायता खोजें" : "Find Emergency Care"} 
        backTo="/" 
      />
      
      <main className="pt-20 pb-36 px-4 sm:px-6 max-w-3xl mx-auto space-y-4">
        
        {/* LIVE LOCATION BAR (NON-BLOCKING AUTO GPS) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {lang === "hi" ? "लाइव GPS सक्रिय" : "LIVE GPS DETECTED"}
                </span>
                {isLocating && (
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> {lang === "hi" ? "लोकेशन खोजी जा रही है..." : "Locating..."}
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-black text-[#050B18] mt-0.5">
                {locationArea}, {locationCity}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditingLocation(!isEditingLocation)}
            className="text-xs font-bold text-[#0052FF] hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditingLocation ? (lang === "hi" ? "बंद करें" : "Cancel") : (lang === "hi" ? "बदलें" : "Change")}</span>
          </button>
        </div>

        {/* Inline Location Editor (Quick Expand) */}
        <AnimatePresence>
          {isEditingLocation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 overflow-hidden space-y-3"
            >
              <div className="text-xs font-black text-blue-900 uppercase tracking-wider">
                {lang === "hi" ? "स्थान मैन्युअल रूप से सेट करें" : "Set Custom Patient Location"}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                  placeholder="Area / Landmark (e.g. Salt Lake, Sector V)"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-[#050B18]"
                />
                <input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="City (e.g. Kolkata)"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-[#050B18]"
                />
              </div>
              <button
                onClick={handleSaveLocation}
                className="bg-[#0052FF] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors cursor-pointer"
              >
                {lang === "hi" ? "स्थान सहेजें" : "Update Location"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COLLAPSIBLE NEARBY HOSPITALS ACCORDION */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowNearbyHospitals(!showNearbyHospitals)}
            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-[#050B18]">
                    {lang === "hi" ? "निकटवर्ती अस्पताल" : "Nearby Hospitals Discovered"} ({activeHospitalsList.length})
                  </span>
                  {totalVerifiedErBeds > 0 ? (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {totalVerifiedErBeds} {lang === "hi" ? "सत्यापित बेड" : "ER Beds Verified"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      {lang === "hi" ? "सार्वजनिक सूची (अपुष्ट)" : "50km Geofence • Unverified"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {lang === "hi" ? "निकटतम:" : "Nearest:"} {nearestHosp?.name} • {nearestHosp?.distance} km • ~{nearestHosp?.eta} mins
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-[#0052FF] bg-blue-50 px-3 py-1.5 rounded-xl shrink-0">
              <span>{showNearbyHospitals ? (lang === "hi" ? "छिपाएं" : "Collapse") : (lang === "hi" ? "देखें" : "View List")}</span>
              {showNearbyHospitals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {/* Collapsible Panel Content */}
          <AnimatePresence>
            {showNearbyHospitals && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="border-t border-gray-100 p-4 sm:p-5 bg-slate-50/70"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {lang === "hi" ? "लाइव अस्पताल नेटवर्क स्थिति" : "Real-Time Emergency ER Network"}
                  </span>
                  <div className="flex bg-gray-200/80 p-0.5 rounded-lg gap-1">
                    <button
                      type="button"
                      onClick={() => setHospitalViewMode("LIST")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${hospitalViewMode === "LIST" ? "bg-white text-[#0052FF] shadow-xs" : "text-gray-600"}`}
                    >
                      <List className="w-3 h-3 inline mr-1" /> {lang === "hi" ? "सूची" : "List"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHospitalViewMode("MAP")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${hospitalViewMode === "MAP" ? "bg-white text-[#0052FF] shadow-xs" : "text-gray-600"}`}
                    >
                      <Map className="w-3 h-3 inline mr-1" /> {lang === "hi" ? "नक्शा" : "Radar"}
                    </button>
                  </div>
                </div>

                {hospitalViewMode === "MAP" ? (
                  <div 
                    className="w-full h-48 rounded-2xl relative overflow-hidden shadow-inner border border-slate-700 mb-3 flex items-center justify-center"
                    style={{
                      background: "#1e293b",
                      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
                      backgroundSize: "20px 20px"
                    }}
                  >
                    <div className="text-center">
                      <div className="w-6 h-6 rounded-full bg-[#059669] border-2 border-white mx-auto animate-pulse flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 bg-black/60 px-2 py-0.5 rounded mt-1 inline-block">
                        PATIENT ({locationArea.split(',')[0]})
                      </span>
                      <div className="text-[11px] text-slate-300 mt-2 font-medium">
                        5 Nearby Hospital Bays Synchronized
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeHospitalsList.slice(0, 8).map((h) => (
                      <div 
                        key={h.id} 
                        className="bg-white p-3.5 rounded-2xl border border-gray-200/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-black text-[#050B18] truncate">{h.name}</h4>
                            <span className="text-[10px] font-bold text-gray-400">({h.distance} km • {h.eta} mins)</span>
                            {h.verified ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> VERIFIED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> UNVERIFIED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{h.address}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {h.specialists.slice(0, 3).map((s: string, idx: number) => (
                              <span key={idx} className="text-[9px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {h.verified && typeof h.erBedsAvailable === "number" ? (
                            <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${
                              h.erBedsAvailable > 0 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                : "bg-red-50 text-red-600 border border-red-200"
                            }`}>
                              {h.erBedsAvailable > 0 ? `${h.erBedsAvailable} Beds Free` : "ER Full"}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                              Bed Telemetry Unverified
                            </span>
                          )}
                          {h.verified && typeof h.icuBedsAvailable === "number" && (
                            <span className="text-[10px] font-bold text-gray-500">
                              ICU: {h.icuBedsAvailable}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-gray-500 text-center mt-3 font-semibold">
                  ⚡ {lang === "hi" 
                    ? "नीचे आपातकालीन विवरण भरें — नियरईआर निर्णय इंजन सबसे उपयुक्त अस्पताल तुरंत चुनेगा।" 
                    : "Fill details below — AERVA Decision Engine will automatically route to the optimal hospital."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* UNIFIED EMERGENCY CARE FORM ("THE DETAILS IN ONE PART") */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-7 space-y-6">
          
          {/* Form Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0052FF] bg-blue-50 px-2.5 py-1 rounded-md">
                {t("form.triageBadge", lang)}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#050B18] mt-1.5">
                {lang === "hi" ? "आपातकालीन विवरण एवं रोगी जानकारी" : "Emergency Triage & Patient Details"}
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "hi" ? "पासपोर्ट लिंक" : "Passport Linked"}</span>
            </div>
          </div>

          {/* PART 1: SELECT EMERGENCY CATEGORY */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5">
              1. {t("selection.heading", lang)}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {EMERGENCIES.map((em) => {
                const Icon = iconMap[em.icon] || HelpCircle;
                const isSelected = selectedId === em.id;
                const emLabel = t(`emergency.${em.id}`, lang) || em.title;
                return (
                  <button 
                    key={em.id}
                    type="button"
                    onClick={() => setSelectedId(em.id)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                      isSelected 
                        ? "border-[#0052FF] bg-blue-50/70 shadow-xs ring-1 ring-[#0052FF]" 
                        : "border-gray-200/80 hover:border-gray-300 hover:bg-gray-50 bg-white"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-[#0052FF] text-white" : "bg-gray-100 text-gray-600"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-black truncate ${isSelected ? "text-[#0052FF]" : "text-gray-800"}`}>
                      {emLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PART 2: PATIENT VITALS & CONTACT (RESPONSIVE GRID) */}
          <div className="pt-2 border-t border-gray-100 space-y-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
              2. {lang === "hi" ? "रोगी विवरण एवं संपर्क" : "Patient Credentials & Emergency Contact"}
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  {t("form.name", lang)}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs sm:text-sm text-[#050B18] focus:outline-none focus:border-[#0052FF] focus:bg-white transition-all"
                    placeholder="Patient name"
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  {t("form.phone", lang)}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="tel" 
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs sm:text-sm text-[#050B18] focus:outline-none focus:border-[#0052FF] focus:bg-white transition-all"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  {t("form.age", lang)}
                </label>
                <input 
                  type="number" 
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs sm:text-sm text-[#050B18] focus:outline-none focus:border-[#0052FF] focus:bg-white transition-all"
                  placeholder="e.g. 28"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  {t("form.gender", lang)}
                </label>
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                  {GENDERS.map((g) => {
                    const genderLabel = g === "Male" ? t("form.gender.male", lang) : g === "Female" ? t("form.gender.female", lang) : t("form.gender.other", lang);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setPatientGender(g)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          patientGender === g 
                            ? "bg-white text-[#0052FF] shadow-xs font-black" 
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        {genderLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                {t("form.bloodGroup", lang)}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroup(bg)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      bloodGroup === bg
                        ? "bg-rose-50 border-rose-300 text-rose-600 font-black shadow-xs ring-1 ring-rose-400"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PART 3: VOICE NOTE & SYMPTOM BRIEF (INTEGRATED) */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                3. {t("form.voiceTitle", lang)} ({lang === "hi" ? "वैकल्पिक / त्वरित" : "Optional / Fast Voice Brief"})
              </label>
              <span className="text-[10px] text-gray-400 font-bold">
                {lang === "hi" ? "हिंदी या अंग्रेजी" : "Hindi / English Speech-to-Text"}
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex flex-col gap-3">
              {recordingState === "IDLE" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#0052FF]">
                      <Mic className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-700 text-xs">
                      {lang === "hi" ? "लक्षण बोलने के लिए टैप करें" : "Tap to speak symptoms directly"}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={startRecording} 
                    className="bg-[#0052FF] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    {t("form.recordBtn", lang)}
                  </button>
                </div>
              )}

              {recordingState === "RECORDING" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 animate-pulse">
                        <Mic className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-red-600 text-xs animate-pulse">
                        {lang === "hi" ? "रिकॉर्डिंग जारी..." : "Listening..."} {formatDuration(recordTimer)}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        type="button"
                        onClick={stopRecording} 
                        className="bg-red-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow hover:bg-red-600 flex items-center gap-1 cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" /> {t("form.stopBtn", lang)}
                      </button>
                      <button 
                        type="button"
                        onClick={deleteRecording} 
                        className="bg-gray-200 text-gray-600 px-2.5 py-1.5 rounded-xl font-bold text-xs hover:bg-gray-300 cursor-pointer"
                      >
                        {t("form.cancelBtn", lang)}
                      </button>
                    </div>
                  </div>

                  {liveTranscript && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-xs text-red-950 font-bold italic">
                      &ldquo;{liveTranscript}&rdquo;
                    </div>
                  )}
                </div>
              )}

              {recordingState === "PROCESSING" && (
                <div className="flex items-center gap-2 justify-center py-2 text-xs font-bold text-[#0052FF]">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{lang === "hi" ? "वॉयस ट्रांसक्रिप्ट प्रोसेस हो रही है..." : "Transcribing voice brief..."}</span>
                </div>
              )}

              {recordingState === "RECORDED" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs text-emerald-900">
                        {lang === "hi" ? "AERVA सेंस वॉयस नोट सहेजा गया" : "AERVA Sense Audio Captured"} ({formatDuration(recordTimer)})
                      </span>
                      <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        ElevenLabs Scribe
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          if (audioBlobRef.current) {
                            const url = URL.createObjectURL(audioBlobRef.current);
                            const audio = new Audio(url);
                            audio.play();
                          }
                        }}
                        className="text-xs font-bold text-[#0052FF] bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" /> {t("form.playBtn", lang)}
                      </button>
                      <button 
                        type="button"
                        onClick={async () => {
                          if (realTranscript) {
                            try {
                              const res = await fetch("/api/v1/voice/speak", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ text: `Emergency verified: ${realTranscript}. Triage coordinators are alerting receiving bays.` }),
                              });
                              if (res.ok) {
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = new Audio(url);
                                a.play();
                              } else {
                                const utter = new SpeechSynthesisUtterance(realTranscript);
                                window.speechSynthesis.speak(utter);
                              }
                            } catch {
                              const utter = new SpeechSynthesisUtterance(realTranscript);
                              window.speechSynthesis.speak(utter);
                            }
                          }
                        }}
                        className="text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                        title="Listen to synthesized spoken feedback"
                      >
                        <Volume2 className="w-3 h-3" /> Readback
                      </button>
                      <button 
                        type="button"
                        onClick={deleteRecording} 
                        className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">
                      Review & Correct Transcript (AERVA Sense):
                    </label>
                    <textarea
                      value={realTranscript}
                      onChange={(e) => setRealTranscript(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-medium focus:outline-none focus:border-[#0052FF]"
                      placeholder="Review or edit what was transcribed..."
                    />
                  </div>
                </div>
              )}

              {/* Optional Written Complaint */}
              <textarea
                value={writtenDescription}
                onChange={(e) => setWrittenDescription(e.target.value)}
                rows={2}
                placeholder={lang === "hi" ? "या संक्षिप्त में लक्षण लिखें (जैसे सीने में दर्द, सांस लेने में तकलीफ)..." : "Or type brief symptoms (e.g. chest pressure, unconsciousness, trauma)..."}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#050B18] focus:outline-none focus:border-[#0052FF]"
              />
            </div>
          </div>

          {/* PART 4: AMBULANCE DISPATCH PREFERENCE */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                4. {t("form.ambulanceTitle", lang)}
              </label>
              <span className="text-[10px] font-bold text-gray-400">
                {ambulanceRequired ? "🚑 Live ALS Dispatch" : "🚗 Self-Transport Mode"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Ambulance Required */}
              <button
                type="button"
                onClick={() => setAmbulanceRequired(true)}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden ${
                  ambulanceRequired
                    ? "border-[#0052FF] bg-blue-50/70 shadow-xs ring-1 ring-[#0052FF]"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  ambulanceRequired ? "bg-[#0052FF] text-white shadow-xs" : "bg-gray-100 text-gray-600"
                }`}>
                  <Ambulance className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className={`text-xs sm:text-sm font-black ${ambulanceRequired ? "text-[#0052FF]" : "text-[#050B18]"}`}>
                      {t("form.ambulanceRequired", lang)}
                    </div>
                    {ambulanceRequired && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md shrink-0">
                        DISPATCH
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    {t("form.ambulanceRequiredSub", lang)}
                  </p>
                </div>
              </button>

              {/* Option B: Self-Transport */}
              <button
                type="button"
                onClick={() => setAmbulanceRequired(false)}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden ${
                  !ambulanceRequired
                    ? "border-[#050B18] bg-slate-50 shadow-xs ring-1 ring-[#050B18]"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  !ambulanceRequired ? "bg-[#050B18] text-white shadow-xs" : "bg-gray-100 text-gray-600"
                }`}>
                  <Car className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className={`text-xs sm:text-sm font-black ${!ambulanceRequired ? "text-[#050B18]" : "text-gray-700"}`}>
                      {t("form.ambulanceNotRequired", lang)}
                    </div>
                    {!ambulanceRequired && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-gray-200 text-gray-800 px-2 py-0.5 rounded-md shrink-0">
                        SELF-DRIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    {t("form.ambulanceNotRequiredSub", lang)}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* MASTER 1-CLICK ACTION */}
          <div className="pt-3">
            <button
              type="button"
              onClick={handleProceed}
              disabled={!patientName.trim()}
              className="w-full bg-[#0052FF] hover:bg-blue-600 active:scale-[0.99] text-white py-4 px-6 rounded-2xl font-black text-base transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <span>🚨</span>
              <span>{t("selection.findBtn", lang)}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-2 font-medium">
              ⚡ Evaluates live ER capacity, Cath Lab/Trauma readiness, and road transit ETA before reserving your bed.
            </p>
          </div>

        </div>

      </main>
    </>
  );
}

export default function EmergencySelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-bold text-gray-400">
        Loading emergency triage...
      </div>
    }>
      <EmergencyTriageContent />
    </Suspense>
  );
}