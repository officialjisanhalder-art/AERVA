"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppNavbar } from "@/components/app/AppNavbar";
import { useEmergencyState } from "@/lib/demo-state";
import { useLang } from "@/lib/language-context";
import { Ambulance } from "@/lib/services/ambulance-service";
import {
  Truck,
  Phone,
  Clock,
  MapPin,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Siren,
  CheckCircle2,
  Navigation2,
  HeartPulse,
  Radio,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

function AmbulanceTrackerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang } = useLang();
  const { state } = useEmergencyState();

  const caseId = searchParams.get("caseId") || state.caseId || "NR-10482";
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  const fetchAmbulance = async () => {
    try {
      const res = await fetch(`/api/v1/ambulance/track?case_id=${encodeURIComponent(caseId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ambulance) {
          setAmbulance(data.ambulance);
        }
      }
    } catch (err) {
      console.warn("Could not load ambulance telemetry:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulance();
    const timer = setInterval(fetchAmbulance, 4000);
    return () => clearInterval(timer);
  }, [caseId]);

  const handleRequestAmbulance = async () => {
    setIsRequesting(true);
    try {
      const res = await fetch("/api/v1/ambulance/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseId,
          patient_name: state.patientName || "Jisan Halder",
          patient_location: {
            latitude: state.location?.lat || 22.5726,
            longitude: state.location?.lng || 88.3639,
            area: state.location?.area || "Salt Lake",
            city: state.location?.city || "Kolkata",
          },
          emergency_type: state.emergencyId || "Cardiac Emergency",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ambulance) {
          setAmbulance(data.ambulance);
        }
      }
    } catch (err) {
      console.error("Failed to request ambulance:", err);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <>
      <AppNavbar
        title={lang === "hi" ? "लाइव एम्बुलेंस ट्रैकर" : "Live Ambulance Tracker"}
        backTo="/emergency/status"
      />

      <main className="pt-24 pb-32 px-4 sm:px-6 max-w-xl mx-auto space-y-4">
        {/* Top Case Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              {lang === "hi" ? "आपातकालीन मामला" : "Active Case"}
            </span>
            <div className="font-mono font-black text-sm text-[#050B18]">{caseId}</div>
          </div>
          <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-black">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{ambulance?.greenCorridorActive ? "GREEN CORRIDOR ACTIVE" : "EMERGENCY DISPATCH"}</span>
          </div>
        </div>

        {/* STYLIZED LIVE GPS RADAR MAP VIEW */}
        <div className="relative rounded-3xl overflow-hidden bg-[#0A1128] border border-blue-900/50 shadow-2xl p-6 text-white min-h-[260px] flex flex-col justify-between">
          {/* Background Grid Pattern */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#3B82F6 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Animated radar sweep pulse */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-blue-500/20 animate-ping pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-blue-400/30 pointer-events-none" />

          {/* Radar Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-blue-200">
                {ambulance ? `${ambulance.unitCode} • LIVE GPS TELEMETRY` : "DISPATCH READY"}
              </span>
            </div>
            <span className="text-xs font-mono bg-blue-950/80 border border-blue-800 px-2.5 py-0.5 rounded-lg text-blue-300">
              {ambulance ? `${ambulance.telemetry.speedKmH} km/h` : "STANDBY"}
            </span>
          </div>

          {/* Simulated Route Line with Vehicle and Destination */}
          <div className="relative z-10 my-8 py-4">
            <div className="flex items-center justify-between relative">
              {/* Connecting dashed line */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-blue-400/40" />

              {/* Ambulance Pin */}
              <div className="relative flex flex-col items-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-12 h-12 rounded-2xl bg-[#0052FF] text-white flex items-center justify-center shadow-lg shadow-blue-500/50 relative z-10"
                >
                  <Truck className="w-6 h-6" />
                </motion.div>
                <span className="text-[10px] font-black uppercase text-blue-300 mt-1.5">
                  {ambulance?.unitCode || "Ambulance"}
                </span>
              </div>

              {/* Patient Pin */}
              <div className="relative flex flex-col items-center">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/40 relative z-10">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-300 mt-1.5">
                  You ({state.location?.area || "Patient"})
                </span>
              </div>

              {/* Hospital Pin */}
              <div className="relative flex flex-col items-center">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md relative z-10">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase text-rose-300 mt-1.5">
                  ER Bay
                </span>
              </div>
            </div>
          </div>

          {/* Radar Bottom Live ETA Banner */}
          <div className="relative z-10 bg-blue-950/70 backdrop-blur-md rounded-2xl p-3 border border-blue-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold text-blue-300">Estimated Arrival</div>
                <div className="text-base font-black text-white leading-tight">
                  {ambulance?.etaMinutes ? `~${ambulance.etaMinutes} mins away` : "5-7 mins away"}
                </div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-[10px] uppercase font-bold text-emerald-400">Oxygen Level</div>
              <div className="font-mono font-bold text-white">
                {ambulance?.telemetry.oxygenLevelPercent ?? 92}% O₂
              </div>
            </div>
          </div>
        </div>

        {/* If no ambulance assigned yet, show 1-tap dispatch card */}
        {(!ambulance || ambulance.status === "AVAILABLE_STANDBY") && (
          <div className="bg-gradient-to-r from-blue-600 to-[#0052FF] text-white rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="font-black text-base">Need an ALS Ambulance Dispatched?</h3>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Dispatch an Advanced Life Support (ALS) Mobile ICU equipped with mechanical ventilator, defibrillator, and critical care paramedic to your exact coordinates.
            </p>
            <button
              onClick={handleRequestAmbulance}
              disabled={isRequesting}
              className="w-full bg-white text-[#0052FF] hover:bg-blue-50 py-3.5 rounded-2xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              {isRequesting ? "Dispatching Nearest Unit..." : "Request NearER ALS Ambulance Now"}
            </button>
          </div>
        )}

        {/* DRIVER & PARAMEDIC CONTACT CARD */}
        {ambulance && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  Assigned Unit
                </span>
                <h3 className="text-lg font-black text-[#050B18]">{ambulance.name}</h3>
                <span className="text-xs font-mono font-bold text-blue-600">
                  Plate: {ambulance.vehicleNumber}
                </span>
              </div>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                {ambulance.status.replaceAll("_", " ")}
              </span>
            </div>

            {/* Contacts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Driver Contact */}
              <div className="bg-gray-50 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Emergency Driver</div>
                  <div className="font-bold text-sm text-[#050B18]">{ambulance.driver.name}</div>
                  <div className="text-[11px] text-gray-500">★ {ambulance.driver.rating} Verified Responders</div>
                </div>
                <a
                  href={`tel:${ambulance.driver.phone}`}
                  className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052FF] flex items-center justify-center transition-colors shadow-sm"
                  title="Call Driver"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

              {/* Paramedic Contact */}
              <div className="bg-emerald-50/70 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-800">Paramedic / EMT</div>
                  <div className="font-bold text-sm text-[#050B18]">{ambulance.paramedic.name}</div>
                  <div className="text-[10px] text-emerald-700 font-medium truncate max-w-[130px]">
                    {ambulance.paramedic.qualification.split(" (")[0]}
                  </div>
                </div>
                <a
                  href={`tel:${ambulance.paramedic.phone}`}
                  className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm"
                  title="Call Paramedic"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Onboard Equipment Badges */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                Verified Onboard Life Support:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ambulance.equipment.map((eq, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                    {eq.split(" (")[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MISSION STEP PROGRESSION */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#050B18] mb-3">
            Dispatch Progression Pipeline
          </h4>
          <div className="space-y-3">
            {[
              {
                title: "1. Unit Dispatched from Base",
                desc: "Ambulance rolling with siren & beacon active",
                done: Boolean(ambulance && ambulance.status !== "AVAILABLE_STANDBY"),
              },
              {
                title: "2. Traffic Police Green Wave Activated",
                desc: "Signals along route set to priority passage",
                done: Boolean(ambulance?.greenCorridorActive),
              },
              {
                title: "3. Arrival at Patient Coordinates",
                desc: "Paramedics commence on-scene triage & stabilization",
                done: Boolean(ambulance && (ambulance.status === "PATIENT_ONBOARD" || ambulance.status === "ARRIVED_HOSPITAL")),
              },
              {
                title: "4. Transit to Hospital ER",
                desc: "Resuscitation bay held at receiving hospital",
                done: Boolean(ambulance && ambulance.status === "ARRIVED_HOSPITAL"),
              },
            ].map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    step.done ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className={`font-bold ${step.done ? "text-[#050B18]" : "text-gray-400"}`}>
                    {step.title}
                  </div>
                  <div className="text-gray-500 text-[11px]">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Government 108 Emergency Dial Backup Strip */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs font-bold text-gray-700">
              National Ambulance Helpline (Emergency 108)
            </span>
          </div>
          <a
            href="tel:108"
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-sm transition-colors"
          >
            Dial 108
          </a>
        </div>
      </main>
    </>
  );
}

export default function AmbulanceTrackerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading live tracker...</div>}>
      <AmbulanceTrackerContent />
    </Suspense>
  );
}
