"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Radio, 
  Siren, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Activity, 
  Volume2, 
  VolumeX, 
  Car, 
  Compass, 
  Layers,
  Send
} from "lucide-react";
import { useEmergencyState } from "@/lib/demo-state";
import { MOCK_HOSPITALS } from "@/lib/demo-data";
import Link from "next/link";
import { useLang } from "@/lib/language-context";

export default function TrafficControlPortal() {
  const { state, updateState } = useEmergencyState();
  const { lang, setLang } = useLang();
  const hospital = MOCK_HOSPITALS.find((h) => h.id === state.hospitalId) || MOCK_HOSPITALS[0];

  const [signalsCleared, setSignalsCleared] = useState(state.greenCorridorAlerted || false);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "LOGS" | "INTERSECTIONS">("ACTIVE");
  const [liveTraffic, setLiveTraffic] = useState<any>(null);

  useEffect(() => {
    async function fetchTraffic() {
      try {
        // Fetch directions from Kolkata (default) to the hospital location or a demo destination
        const res = await fetch(`/api/serp/traffic?startLat=22.5726&startLng=88.3639&endLat=22.5804&endLng=88.4173&type=driving`);
        const data = await res.json();
        
        if (data.directions && data.directions.length > 0) {
          const route = data.directions[0].legs[0];
          setLiveTraffic({
            distance: route.distance.text,
            duration: route.duration.text,
            start: route.start_address,
            end: route.end_address
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchTraffic();
  }, []);
  useEffect(() => {
    setSignalsCleared(Boolean(state.greenCorridorAlerted));
  }, [state.greenCorridorAlerted]);

  const toggleSignals = () => {
    const next = !signalsCleared;
    setSignalsCleared(next);
    updateState({ greenCorridorAlerted: next });
  };

  const simulateHospitalSOS = () => {
    updateState({
      status: "VERIFIED",
      emergencyId: "cardiac",
      patientName: state.patientName || "Jisan Halder",
      greenCorridorAlerted: true,
      hospitalId: hospital.id
    });
    setSignalsCleared(true);
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-white">
      {/* Top Operations Header */}
      <header className="border-b border-slate-800 bg-[#0B1426]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Radio className="w-5 h-5 text-[#070D18]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
                  ITMS EMERGENCY DESK
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-100">
                Traffic Police Control Towers • Green Corridor Command
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold bg-slate-800/80 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700">
              Tower: Kolkata Central East
            </span>
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="text-xs font-bold bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors"
            >
              {lang === "en" ? "हिन्दी" : "EN"}
            </button>
            <Link
              href="/"
              className="text-xs font-bold bg-[#0052FF] text-white px-3.5 py-1.5 rounded-xl hover:bg-blue-600 transition-colors"
            >
              ← NearER App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Command Console */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome Demo Alert Banner */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/60 border border-blue-500/30 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
              <Siren className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-300 uppercase tracking-widest">
                Welcome to NearER Live ITMS Control Tower Feed (Demo)
              </div>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">
                Hospital emergency departments broadcast telemetry directly to this tower. Signals along the transit corridor switch to Priority Green.
              </p>
            </div>
          </div>
          <button
            onClick={simulateHospitalSOS}
            className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" /> Simulate Hospital SOS Alert
          </button>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0D182E] border border-slate-800 p-4 rounded-3xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Active Green Corridors
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {state.greenCorridorAlerted ? "1 ACTIVE" : "0 STANDBY"}
            </div>
          </div>
          <div className="bg-[#0D182E] border border-slate-800 p-4 rounded-3xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Signals Pre-empted
            </div>
            <div className="text-3xl font-black text-blue-400">
              {state.greenCorridorAlerted ? "4 JUNCTIONS" : "0 IDLE"}
            </div>
          </div>
          <div className="bg-[#0D182E] border border-slate-800 p-4 rounded-3xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Avg Route Clearance
            </div>
            <div className="text-3xl font-black text-teal-300">
              ~ 3.8 mins saved
            </div>
          </div>
          <div className="bg-[#0D182E] border border-slate-800 p-4 rounded-3xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Hospital Acknowledgements
            </div>
            <div className="text-3xl font-black text-slate-200">
              {hospital.name ? "1 LINKED" : "READY"}
            </div>
          </div>
        </div>

        {/* Active Emergency Case Card */}
        {state.greenCorridorAlerted ? (
          <div className="bg-gradient-to-br from-emerald-950/40 via-[#0B1D2A] to-[#0D182E] border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-[#070D18] flex items-center justify-center font-black animate-pulse">
                  <Siren className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                      HIGH ACUITY GREEN CORRIDOR IN PROGRESS
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      CASE #{state.caseId || "NR-10482"}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-0.5">
                    {state.patientName || "Emergency Patient"} • {state.emergencyId?.toUpperCase() || "CARDIAC"} CRISIS
                  </h2>
                </div>
              </div>

              <button
                onClick={toggleSignals}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                Release Signals / Terminate Corridor
              </button>
            </div>

            {/* Route & Hospital Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Receiving Hospital
                </div>
                <div className="text-base font-black text-white mt-1">
                  {hospital.name}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {hospital.address || "Salt Lake, Sector III"}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Transit ETA & Distance (Live via SerpApi)
                </div>
                <div className="text-base font-black text-emerald-400 mt-1">
                  {liveTraffic ? `${liveTraffic.duration} (${liveTraffic.distance})` : `${hospital.eta} mins (${hospital.distance} km)`}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {liveTraffic ? "Live Google Maps Routing Active" : "Turn-by-turn live navigation streaming"}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Traffic Signal Status
                </div>
                <div className="text-base font-black text-teal-300 mt-1">
                  4 Signals Force-Green
                </div>
                <div className="text-xs text-emerald-400 mt-0.5">
                  ✓ EM Bypass Jn • Karunamoyee • Broadway • IB Block
                </div>
              </div>
            </div>

            {/* Junction Clearance Telemetry Feed */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Synchronized Traffic Signals on Route:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: "Junction 1: EM Bypass", status: "FORCE GREEN", time: "0:00" },
                  { name: "Junction 2: Karunamoyee", status: "FORCE GREEN", time: "+2:30" },
                  { name: "Junction 3: Broadway Connector", status: "FORCE GREEN", time: "+5:10" },
                  { name: "Junction 4: Hospital Approach", status: "FORCE GREEN", time: "+8:00" },
                ].map((j, i) => (
                  <div key={i} className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-100">{j.name}</div>
                      <div className="text-[10px] text-slate-400">{j.time} projected</div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0D182E] border border-slate-800 rounded-3xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-500">
              <CheckCircle2 className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-300">
              All Traffic Corridors Normal (Standing By)
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When a hospital verifies an incoming critical emergency, an automated Green Corridor SOS alert will ping this console and preempt traffic signals along the route.
            </p>
            <div className="pt-2">
              <button
                onClick={simulateHospitalSOS}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Trigger Demo Green Corridor Alert Now
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
