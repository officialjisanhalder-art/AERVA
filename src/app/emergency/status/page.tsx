"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AppNavbar } from "@/components/app/AppNavbar";
import { useEmergencyState } from "@/lib/demo-state";
import { CheckCircle2, Circle, Clock, Building, Phone, MessageSquare, Navigation2, MapPin, Play, Siren, ShieldCheck, Ambulance, Car } from "lucide-react";
import { MOCK_HOSPITALS, findHospitalById } from "@/lib/demo-data";
import Link from "next/link";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

export default function EmergencyStatusPage() {
  const router = useRouter();
  const { state, updateState } = useEmergencyState();
  const { lang } = useLang();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hospital = findHospitalById(state.hospitalId, !mounted);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-dispatch ambulance with live location if ambulance was requested and not yet dispatched
  useEffect(() => {
    if (state.ambulanceRequired !== false && !state.ambulanceDispatched && state.caseId && hospital.id) {
      fetch("/api/v1/ambulance/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: state.caseId,
          hospital_id: hospital.id,
          patient_name: state.patientName || "Emergency Patient",
          patient_location: {
            latitude: state.location?.lat || 22.5804,
            longitude: state.location?.lng || 88.4173,
            area: state.location?.area || "Salt Lake",
            city: state.location?.city || "Kolkata",
          },
          emergency_type: state.emergencyId,
        }),
      })
        .then(() => updateState({ ambulanceDispatched: true }))
        .catch((e) => console.warn("[AERVA] Auto-dispatch fallback:", e));
    }
  }, [state.ambulanceRequired, state.ambulanceDispatched, state.caseId, hospital.id, state.patientName, state.location, state.emergencyId, updateState]);

  useEffect(() => {
    // When the hospital accepts, transition to the live navigation dashboard
    if (state.status === "ACCEPTED") {
      const timer = setTimeout(() => {
        router.push(`/navigation/${hospital.id}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.status, router, hospital.id]);

  const steps = [
    { key: "status.step.location", label: "Live Location Captured", done: !!state.location },
    { key: "status.step.submitted", label: "Emergency Submitted", done: true },
    { key: "status.step.voice", label: "Voice Note Delivered", done: state.hasVoiceBrief },
    { key: "status.step.reviewing", label: "Hospital Reviewing", done: state.status !== "PENDING", active: state.status === "PENDING" },
    { key: "status.step.verified", label: "Request Verified", done: state.status === "VERIFIED" || state.status === "ACCEPTED" || state.status === "ARRIVED" || state.status === "CONFIRMED" },
    { key: "status.step.accepted", label: "Hospital Accepted", done: state.status === "ACCEPTED" || state.status === "ARRIVED" || state.status === "CONFIRMED" },
    { key: "status.step.reserved", label: "Capacity Temporarily Reserved", done: state.status === "ACCEPTED" || state.status === "ARRIVED" || state.status === "CONFIRMED" },
    state.ambulanceRequired !== false
      ? { key: "status.step.ambulance", label: "Ambulance Dispatched to Your Location", done: state.status === "ACCEPTED" || state.status === "ARRIVED" || state.status === "CONFIRMED", active: state.status === "PENDING" }
      : { key: "status.step.selftransit", label: "Self-Transport En Route to Hospital", done: true },
    { key: "status.step.navigating", label: "Navigating to Hospital", done: state.status === "ARRIVED" || state.status === "CONFIRMED", active: state.status === "ACCEPTED" },
    { key: "status.step.arrived", label: "Arrived", done: state.status === "CONFIRMED", active: state.status === "ARRIVED" },
  ];

  const playVoiceNote = () => {
    if (state.audioDataUrl) {
      const audio = new Audio(state.audioDataUrl);
      audio.play();
    }
  };

  return (
    <>
      <AppNavbar title={t("status.title", lang)} backTo="/emergency/recommendation" />
      
      <main className="pt-24 pb-32 px-4 sm:px-6 max-w-lg mx-auto space-y-4">

        {/* Case Header */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t("status.activeEmergency", lang)}
              </div>
              <div suppressHydrationWarning className="text-2xl font-black text-[#050B18]">{state.patientName || "Patient"}</div>
              <div className="flex items-center gap-2 mt-1">
                <div suppressHydrationWarning className="inline-block bg-gray-100 text-gray-700 font-black tracking-widest px-3 py-1 rounded-lg text-sm">
                  {state.caseId || "NR-10482"}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#059669] bg-green-50 px-2 py-1 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> {t("status.live", lang)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-gray-400 uppercase mb-1">{t("status.hospital", lang)}</div>
              <div suppressHydrationWarning className="text-sm font-bold text-[#050B18]">{hospital.name}</div>
              <div suppressHydrationWarning className="text-xs text-gray-500 font-medium mt-1">{hospital.distance} {t("general.km", lang)}</div>
            </div>
          </div>
        </div>

        {/* Traffic Police Green Corridor Notification (Only activates after Hospital Verification & Tower Broadcast) */}
        {state.greenCorridorAlerted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300/80 rounded-3xl p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Siren className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {t("traffic.badge", lang)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    {t("traffic.status", lang)}
                  </span>
                </div>
                <p className="text-xs text-gray-700 font-medium mt-1.5 leading-relaxed">
                  {t("traffic.desc", lang)}
                </p>
                <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-900 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t("traffic.activeSignals", lang)}: 4 junctions sync cleared</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Voice Note Card */}
        {state.hasVoiceBrief && (
          <div className="bg-[#EEF3FF] rounded-2xl border border-blue-100 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-[#0052FF] uppercase tracking-widest mb-0.5">
                {t("status.voiceNoteSent", lang)}
              </div>
              <div className="text-sm font-bold text-[#050B18]">
                {state.recordedAt} · {Math.floor(state.recordingDuration / 60).toString().padStart(2,"0")}:{(state.recordingDuration % 60).toString().padStart(2,"0")}
              </div>
            </div>
            <button onClick={playVoiceNote} className="flex items-center gap-2 bg-[#0052FF] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-600 cursor-pointer">
              <Play className="w-4 h-4 fill-white" /> {t("form.playBtn", lang)}
            </button>
          </div>
        )}

        {/* Transit Mode Card: Conditional Ambulance Dispatch vs Self-Transport */}
        {state.ambulanceRequired === false ? (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#050B18] rounded-3xl p-5 text-white shadow-lg border border-slate-700/50 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-700/60 text-blue-400 flex items-center justify-center border border-slate-600/40 shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {lang === "hi" ? "स्वयं का वाहन / टैक्सी" : "Self-Transport Mode"}
                  </span>
                  <div className="text-sm font-black text-white">
                    {lang === "hi" ? "एम्बुलेंस प्रेषित नहीं की गई" : "No Ambulance Dispatched"}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-full">
                {lang === "hi" ? "स्वयं ड्राइव" : "SELF TRANSIT"}
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4 font-medium leading-relaxed">
              {lang === "hi"
                ? `आप स्वयं के वाहन से ${hospital.name} जा रहे हैं। अस्पताल आपातकालीन टीम आपके आगमन की प्रतीक्षा कर रही है।`
                : `You have selected self-transport to ${hospital.name}. Live hospital reception has been notified of your transit.`}
            </p>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  const hospLat = hospital.latitude ?? 22.5645;
                  const hospLng = hospital.longitude ?? 88.4069;
                  const destination = `${hospLat},${hospLng}`;
                  const hasLocalOrigin =
                    state.location?.lat &&
                    state.location?.lng &&
                    Math.abs(state.location.lat - hospLat) < 0.5 &&
                    Math.abs(state.location.lng - hospLng) < 0.5;
                  const origin = hasLocalOrigin
                    ? `&origin=${state.location!.lat},${state.location!.lng}`
                    : "";
                  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin}&travelmode=driving`;
                  window.open(googleMapsUrl, "_blank");
                  router.push(`/navigation/${hospital.id}`);
                }}
                className="flex-1 bg-[#0052FF] hover:bg-blue-600 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Navigation2 className="w-3.5 h-3.5" />
                {lang === "hi" ? "अस्पताल का रास्ता शुरू करें" : "Start Turn-by-Turn Route"}
              </button>
              <button
                onClick={() => {
                  updateState({ ambulanceRequired: true, ambulanceDispatched: false });
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
                title="Dispatch ambulance if condition worsens"
              >
                <Ambulance className="w-3.5 h-3.5 text-rose-400" />
                {lang === "hi" ? "एम्बुलेंस बुलाएं" : "Need Ambulance"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-[#050B18] rounded-3xl p-5 text-white shadow-lg border border-blue-900/50 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
                  <Ambulance className="w-5 h-5 text-blue-400 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
                    {lang === "hi" ? "आपातकालीन एम्बुलेंस बेड़ा" : "AERVA ALS Fleet Transit"}
                  </span>
                  <div className="text-sm font-black text-white">AMB-101 • Mobile ICU</div>
                </div>
              </div>
              <span className="text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ETA 6 MINS
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4 font-medium leading-relaxed">
              {lang === "hi"
                ? "उन्नत जीवन रक्षक प्रणाली (ALS), वेंटिलेटर एवं प्रशिक्षित पैरामेडिक्स के साथ एम्बुलेंस आपके स्थान के लिए मार्ग में है।"
                : "Advanced Life Support unit en route with transport ventilator, defibrillator & ALS paramedic crew to your location."}
            </p>

            <div className="flex items-center gap-2.5">
              <Link
                href={`/emergency/ambulance?caseId=${state.caseId || "NR-10482"}`}
                className="flex-1 bg-[#0052FF] hover:bg-blue-600 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Navigation2 className="w-3.5 h-3.5" />
                {lang === "hi" ? "लाइव एम्बुलेंस ट्रैक करें" : "Track Live Ambulance"}
              </Link>
              <a
                href="tel:+919831188221"
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-white/10"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                {lang === "hi" ? "चालक को कॉल" : "Call Driver"}
              </a>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <a href={`tel:${hospital.phone}`} className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-[#0052FF] transition-all cursor-pointer">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-bold text-[#050B18] text-center">{t("status.callHospital", lang)}</span>
          </a>
          <Link href="/emergency/message" className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-[#0052FF] transition-all cursor-pointer">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#0052FF]" />
            </div>
            <span className="text-xs font-bold text-[#050B18] text-center">{t("status.messageHospital", lang)}</span>
          </Link>
          {state.status === "ACCEPTED" ? (
            <button
              onClick={() => {
                const hospLat = hospital.latitude ?? 22.5645;
                const hospLng = hospital.longitude ?? 88.4069;
                const destination = `${hospLat},${hospLng}`;
                const hasLocalOrigin =
                  state.location?.lat &&
                  state.location?.lng &&
                  Math.abs(state.location.lat - hospLat) < 0.5 &&
                  Math.abs(state.location.lng - hospLng) < 0.5;
                const origin = hasLocalOrigin
                  ? `&origin=${state.location!.lat},${state.location!.lng}`
                  : "";
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin}&travelmode=driving`;
                window.open(googleMapsUrl, "_blank");
                router.push(`/navigation/${hospital.id}`);
              }}
              className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-[#0052FF] transition-all cursor-pointer"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <Navigation2 className="w-5 h-5 text-[#0052FF]" />
              </div>
              <span className="text-xs font-bold text-[#050B18] text-center">{t("status.openRoute", lang)}</span>
            </button>
          ) : (
            <button className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 opacity-50 cursor-not-allowed">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                <Navigation2 className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-xs font-bold text-gray-400 text-center">{t("status.openRoute", lang)}</span>
            </button>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
          {state.status === "ACCEPTED" && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#059669]" />
          )}
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            {t("status.timelineTitle", lang)}
          </div>
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-4 relative">
                {idx !== steps.length - 1 && (
                  <div className={`absolute left-3 top-7 bottom-0 w-[2px] -ml-[1px] ${step.done ? "bg-[#059669]" : "bg-gray-100"}`} />
                )}
                <div className="relative z-10 shrink-0 bg-white">
                  {step.done ? (
                    <CheckCircle2 className="w-6 h-6 text-[#059669] fill-[#059669]/10" />
                  ) : step.active ? (
                    <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                      <Clock className="w-6 h-6 text-amber-500" />
                    </motion.div>
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <div className="pb-2">
                  <span className={`font-bold ${step.done ? "text-[#050B18]" : step.active ? "text-amber-600" : "text-gray-400"}`}>
                    {t(step.key, lang) || step.label}
                  </span>
                  {step.active && step.label === "Hospital Reviewing" && (
                    <p className="text-sm font-medium text-amber-600 mt-0.5">
                      {lang === "hi" ? "अस्पताल स्टाफ आपके विवरण की समीक्षा कर रहा है..." : "Hospital staff is reviewing your details..."}
                    </p>
                  )}
                  {step.done && step.label === "Hospital Accepted" && (
                    <p className="text-sm font-medium text-[#059669] mt-0.5">
                      {lang === "hi" ? "अस्पताल ने आपका आपातकालीन अनुरोध स्वीकार कर लिया है।" : "Hospital has accepted your emergency request."}
                    </p>
                  )}
                  {step.done && step.label === "Capacity Temporarily Reserved" && (
                    <p className="text-sm font-medium text-[#059669] mt-0.5 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" /> 
                      {lang === "hi" ? "आपके आगमन के लिए आपातकालीन क्षमता आरक्षित है।" : "Emergency capacity temporarily reserved for your arrival."}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {state.status === "ACCEPTED" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#059669] text-white rounded-3xl p-5 text-center"
          >
            <div className="font-black text-lg mb-1">{t("status.startingNav", lang)}</div>
            <p className="text-sm opacity-90">{t("status.redirecting", lang)}</p>
          </motion.div>
        )}
      </main>
    </>
  );
}
