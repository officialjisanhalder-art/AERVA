"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneCall, Mic, MicOff, Volume2, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Radio, MapPin, RefreshCw } from "lucide-react";
import Link from "next/link";
import { reachService, RuralSosCase } from "@/lib/services/reachService";
import { voiceService } from "@/lib/services/voiceService";

const INDIAN_LANGUAGES = [
  "Hindi (hi-IN)",
  "Haryanvi (Dialect)",
  "Bhojpuri (Dialect)",
  "Bengali (bn-IN)",
  "Punjabi (pa-IN)",
  "Tamil (ta-IN)",
  "Telugu (te-IN)",
  "English (en-IN)",
];

const PRESET_RURAL_SCENARIOS = [
  {
    label: "Scenario 1: Badshahpur (Cardiac Emergency)",
    locationText: "Near Government High School, Badshahpur Village, Gurgaon",
    emergencyText: "Mataji ko achanak seena dard hua aur behosh ho gayi hain. Turant ambulance bhejo.",
    caller: "+91 98120 44921",
  },
  {
    label: "Scenario 2: Pataudi Road (Highway Collision)",
    locationText: "Near HP Petrol Pump, Pataudi Road, Wazirpur crossing",
    emergencyText: "Tractor aur bike ki takkar hui hai, do log sadak par behosh hain, khoon beh raha hai.",
    caller: "+91 94165 77102",
  },
  {
    label: "Scenario 3: Sohna Rural (Severe Asthma/Respiratory)",
    locationText: "Chandan Chowk, Sohna Village, near Shiva Temple",
    emergencyText: "Bache ko saans lene me bahut takleef ho rahi hai, hoth neele pad rahe hain.",
    caller: "+91 98711 02934",
  },
];

export default function NearERReachPage() {
  const [callerNumber, setCallerNumber] = useState("+91 98120 44921");
  const [language, setLanguage] = useState("Hindi (hi-IN)");
  const [activeStep, setActiveStep] = useState<"IDLE" | "CALLING" | "LOC_PROMPT" | "EMG_PROMPT" | "PROCESSING" | "SUBMITTED">("IDLE");

  // Step 1 Location
  const [locationText, setLocationText] = useState("");
  const [isRecordingLoc, setIsRecordingLoc] = useState(false);
  const [locAudioUrl, setLocAudioUrl] = useState<string | null>(null);

  // Step 2 Emergency description
  const [emergencyText, setEmergencyText] = useState("");
  const [isRecordingEmg, setIsRecordingEmg] = useState(false);
  const [emgAudioUrl, setEmgAudioUrl] = useState<string | null>(null);

  // Resulting case
  const [createdCase, setCreatedCase] = useState<RuralSosCase | null>(null);
  const recorderRef = useRef<any>(null);

  // Quick load scenario
  const handleLoadScenario = (sc: typeof PRESET_RURAL_SCENARIOS[0]) => {
    setCallerNumber(sc.caller);
    setLocationText(sc.locationText);
    setEmergencyText(sc.emergencyText);
  };

  // Start Simulated Call
  const startCall = () => {
    setActiveStep("CALLING");
    setTimeout(() => {
      setActiveStep("LOC_PROMPT");
    }, 1200);
  };

  // Record Location Voice
  const toggleRecordLocation = async () => {
    if (!isRecordingLoc) {
      try {
        const rec = voiceService.createRecorder();
        recorderRef.current = rec;
        await rec.startRecording();
        setIsRecordingLoc(true);
      } catch {
        // Fallback for simulation without mic permission
        setIsRecordingLoc(true);
      }
    } else {
      setIsRecordingLoc(false);
      try {
        if (recorderRef.current) {
          const note = await recorderRef.current.stopRecording();
          setLocAudioUrl(note.audioUrl);
          if (!locationText) {
            setLocationText("Near Primary Health Sub-Centre, Badshahpur");
          }
        }
      } catch {
        if (!locationText) {
          setLocationText("Near Primary Health Sub-Centre, Badshahpur");
        }
      }
    }
  };

  // Record Emergency Voice
  const toggleRecordEmergency = async () => {
    if (!isRecordingEmg) {
      try {
        const rec = voiceService.createRecorder();
        recorderRef.current = rec;
        await rec.startRecording();
        setIsRecordingEmg(true);
      } catch {
        setIsRecordingEmg(true);
      }
    } else {
      setIsRecordingEmg(false);
      try {
        if (recorderRef.current) {
          const note = await recorderRef.current.stopRecording();
          setEmgAudioUrl(note.audioUrl);
          if (!emergencyText) {
            setEmergencyText("Acute cardiac chest pain, breathing collapsed");
          }
        }
      } catch {
        if (!emergencyText) {
          setEmergencyText("Acute cardiac chest pain, breathing collapsed");
        }
      }
    }
  };

  // Submit to Relay Desk
  const handleSubmitSos = async () => {
    setActiveStep("PROCESSING");
    const resCase = await reachService.createRuralSosCase({
      callerNumber,
      language,
      reportedLocationText: locationText || "Badshahpur Village, Sector 66 Rd",
      emergencySummary: emergencyText || "Acute medical emergency reported via basic phone",
      locationAudioUrl: locAudioUrl || undefined,
      emergencyAudioUrl: emgAudioUrl || undefined,
    });
    setCreatedCase(resCase);
    setActiveStep("SUBMITTED");
  };

  return (
    <main className="min-h-screen bg-[#F6F9FD] py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
              <span>NearER Reach • Basic Phone / Keypad Module</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#050B18]">
              Call. Speak. Connect.
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">
              Zero internet required. Converts rural keypad phone voice calls into geocoded hospital dispatches.
            </p>
          </div>

          <Link
            href="/reach/login"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#0052FF] text-[#050B18] hover:text-[#0052FF] text-xs font-black shadow-xs transition-colors shrink-0"
          >
            <span>📡 Operator Desk Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Preset Scenarios Selector */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-8">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2.5">
            Quick Demo Scenarios (Click to Load):
          </p>
          <div className="grid sm:grid-cols-3 gap-2.5">
            {PRESET_RURAL_SCENARIOS.map((sc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleLoadScenario(sc)}
                className="text-left p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-xs cursor-pointer"
              >
                <p className="font-bold text-[#050B18]">{sc.label}</p>
                <p className="text-gray-500 truncate mt-1">{sc.locationText}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Simulation Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden mb-8">
          
          {/* Top Telephone Status Bar */}
          <div className="bg-[#050B18] text-white p-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400">Toll-Free Rural Gateway</p>
                <p className="text-sm font-black text-white tracking-wider">1800-NEARER-SOS (1800-632737)</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-400 border border-emerald-500/30">
                IVR Voice System Active
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            
            {activeStep === "IDLE" && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#0052FF]">
                  <Phone className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-[#050B18] mb-2">
                  Simulate Keypad Phone Incoming SOS
                </h3>
                <p className="text-sm font-medium text-gray-500 max-w-md mx-auto mb-6">
                  Simulates a patient or bystander calling from a feature phone with no internet connection.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto text-left mb-6">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Caller Mobile No.</label>
                    <input
                      type="text"
                      value={callerNumber}
                      onChange={(e) => setCallerNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#050B18]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Spoken Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#050B18]"
                    >
                      {INDIAN_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startCall}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-600/30 transition-all inline-flex items-center gap-3 cursor-pointer"
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>Start Simulated Voice SOS Call</span>
                </button>
              </div>
            )}

            {activeStep === "CALLING" && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 animate-bounce">
                  <PhoneCall className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-[#050B18]">Connecting to NearER IVR Gateway...</h3>
                <p className="text-xs font-bold text-gray-400 mt-1">Audio stream initializing in {language}</p>
              </div>
            )}

            {(activeStep === "LOC_PROMPT" || activeStep === "EMG_PROMPT") && (
              <div className="space-y-6">
                
                {/* Step 1: Where are you? */}
                <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#0052FF] text-white flex items-center justify-center text-xs font-black shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-blue-950 flex items-center gap-2">
                        <span>IVR Question 1: "Aap kahan par hain?" (Where are you?)</span>
                        <Volume2 className="w-4 h-4 text-[#0052FF]" />
                      </h4>
                      <p className="text-xs text-blue-700">Caller speaks village, landmark, road name, or PIN code.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <input
                      type="text"
                      placeholder="e.g. Badshahpur gaon, sarkari school ke samne"
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white text-sm font-bold text-[#050B18]"
                    />
                    <button
                      type="button"
                      onClick={toggleRecordLocation}
                      className={`px-4 py-3 rounded-xl text-xs font-black flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
                        isRecordingLoc
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-white border border-blue-200 text-[#0052FF] hover:bg-blue-50"
                      }`}
                    >
                      {isRecordingLoc ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{isRecordingLoc ? "Stop Recording" : "Record Voice"}</span>
                    </button>
                  </div>
                </div>

                {/* Step 2: What happened? */}
                <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-purple-950 flex items-center gap-2">
                        <span>IVR Question 2: "Kya hua hai?" (Tell us what happened.)</span>
                        <Volume2 className="w-4 h-4 text-purple-600" />
                      </h4>
                      <p className="text-xs text-purple-700">Caller describes the medical emergency in native dialect.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <input
                      type="text"
                      placeholder="e.g. Mataji ko seene me tej dard hai aur behosh ho gayi hain"
                      value={emergencyText}
                      onChange={(e) => setEmergencyText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-sm font-bold text-[#050B18]"
                    />
                    <button
                      type="button"
                      onClick={toggleRecordEmergency}
                      className={`px-4 py-3 rounded-xl text-xs font-black flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
                        isRecordingEmg
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-white border border-purple-200 text-purple-700 hover:bg-purple-50"
                      }`}
                    >
                      {isRecordingEmg ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{isRecordingEmg ? "Stop Recording" : "Record Voice"}</span>
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitSos}
                    className="px-8 py-4 bg-[#0052FF] hover:bg-blue-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Dispatch to NearER Reach Network</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {activeStep === "PROCESSING" && (
              <div className="text-center py-16">
                <RefreshCw className="w-10 h-10 animate-spin text-[#0052FF] mx-auto mb-4" />
                <h3 className="text-xl font-black text-[#050B18]">Resolving Landmark & Matching Hospital...</h3>
                <p className="text-xs font-bold text-gray-400 mt-1">
                  Adaptive search radius: 5km → 10km → 25km
                </p>
              </div>
            )}

            {activeStep === "SUBMITTED" && createdCase && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <h3 className="text-lg font-black">Rural Emergency SOS Dispatched!</h3>
                  </div>
                  <p className="text-xs font-semibold text-emerald-800">
                    Case has been registered on the NearER Reach Relay network. Hospital alerted and operator assigned.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-100 bg-[#F8FAFC]">
                    <span className="text-xs font-bold text-gray-400 uppercase">Case ID</span>
                    <p className="text-xl font-black text-[#050B18] mt-0.5">{createdCase.caseId}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-100 bg-[#F8FAFC]">
                    <span className="text-xs font-bold text-gray-400 uppercase">Alerted Facility</span>
                    <p className="text-xl font-black text-emerald-700 mt-0.5">
                      {createdCase.selectedFacilityName || "Apollo City Hospital"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                  <Link
                    href="/reach/relay"
                    className="flex-1 py-3.5 bg-[#050B18] hover:bg-[#0052FF] text-white font-black text-sm rounded-xl text-center transition-colors"
                  >
                    Open Live Relay Desk to Monitor Escalation →
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStep("IDLE");
                      setCreatedCase(null);
                    }}
                    className="py-3.5 px-6 border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Simulate Another Call
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}
