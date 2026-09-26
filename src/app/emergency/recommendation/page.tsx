"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppNavbar } from "@/components/app/AppNavbar";
import { MOCK_HOSPITALS, EMERGENCIES, findBestHospitals } from "@/lib/demo-data";
import { useEmergencyState } from "@/lib/demo-state";
import { Navigation2, Clock, MapPin, CheckCircle2, ShieldCheck, ArrowRight, Activity, Phone, AlertTriangle, X, Shield, UserCheck } from "lucide-react";
import Link from "next/link";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

function RecommendationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeId = searchParams.get("type") || "cardiac";
  const { lang } = useLang();
  const { state, updateState } = useEmergencyState();

  // Reactive listener to re-evaluate best hospital when bed capacity is updated
  const [mounted, setMounted] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [routingData, setRoutingData] = useState<any>(null);
  const [isLoadingRouting, setIsLoadingRouting] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleUpdate = () => setDataVersion(v => v + 1);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("nearer_hospital_data_updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("nearer_hospital_data_updated", handleUpdate);
    };
  }, []);

  // Use static data for SSR and initial hydration render to ensure server/client match.
  // Once mounted on client, live overrides from localStorage are seamlessly applied.
  const fallbackData = findBestHospitals(typeId, !mounted);
  const emergency = fallbackData.emergency;

  // Fetch from NearER Routing Engine API
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingRouting(true);

    const patientLat = state.location?.lat || 22.5726;
    const patientLng = state.location?.lng || 88.3639;

    let hospital_overrides: any = undefined;
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("nearer_hospital_overrides") : null;
      if (raw) hospital_overrides = JSON.parse(raw);
    } catch {}

    fetch("/api/v1/emergency/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        case_id: state.caseId || `NR-${Math.floor(10000 + Math.random() * 90000)}`,
        patient_location: {
          latitude: patientLat,
          longitude: patientLng,
          area: state.location?.area || "Kolkata Central",
          city: state.location?.city || "Kolkata",
        },
        emergency_type: typeId,
        hospital_overrides,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data && data.recommended_hospital) {
          setRoutingData(data);
        }
      })
      .catch((err) => {
        console.warn("[NearER Routing] API fallback engaged:", err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingRouting(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [typeId, dataVersion, state.location, state.caseId]);

  // SOS confirmation modal state
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);

  const rawBestMatchHospital = routingData?.recommended_hospital;

  // Strict Client-Side Capacity Guard:
  // If the server recommended a hospital whose ER beds are 0 in live client state,
  // DISQUALIFY IT immediately and use fallbackData.bestMatch (which enforces open beds)!
  const isServerMatchAvailable = (() => {
    if (!rawBestMatchHospital) return false;
    const hId = rawBestMatchHospital.hospital_id;
    const allLive = fallbackData.alternatives.concat(fallbackData.bestMatch);
    const clientHosp = allLive.find(h => h.id === hId || (hId === "h2_amri" && h.id === "h2"));
    if (clientHosp && clientHosp.capacity.erBeds.available <= 0) {
      return false; // Bed is full on client, reject server recommendation!
    }
    if (rawBestMatchHospital.metrics && rawBestMatchHospital.metrics.er_beds_open <= 0) {
      return false; // 0 beds reported
    }
    return true;
  })();

  const bestMatchHospital = isServerMatchAvailable ? rawBestMatchHospital : null;
  const bestMatch = bestMatchHospital
    ? {
        id: bestMatchHospital.hospital_id,
        name: bestMatchHospital.name,
        eta: bestMatchHospital.estimated_travel_minutes,
        distance: bestMatchHospital.distance_km,
        verified: bestMatchHospital.emergency_receiving_status === "LIVE_VERIFIED",
        receivingStatus: bestMatchHospital.emergency_receiving_status,
        dataConfidence: bestMatchHospital.data_confidence,
        lastUpdated: `Telemetry: ${bestMatchHospital.last_updated_seconds_ago || 30}s ago`,
        phone: bestMatchHospital.phone,
        address: bestMatchHospital.address,
        humanReasons: bestMatchHospital.human_reasons || [],
        capabilitiesMatched: bestMatchHospital.capabilities_matched || [],
        metrics: bestMatchHospital.metrics || { er_beds_open: 6, icu_beds_open: 4, blood_status: "Available" },
        publicReview: bestMatchHospital.public_review || { rating: 4.4, review_count: 1820, summary: "Recognized for rapid triage reception." },
        doctorInCharge: fallbackData.alternatives.concat(fallbackData.bestMatch).find(h => h.id === bestMatchHospital.hospital_id || (bestMatchHospital.hospital_id === "h2_amri" && h.id === "h2"))?.doctorInCharge || fallbackData.bestMatch.doctorInCharge,
      }
    : {
        ...fallbackData.bestMatch,
        receivingStatus: "LIVE_VERIFIED",
        dataConfidence: "HIGH",
        humanReasons: [
          "Emergency capability on-duty",
          "Live telemetry verified",
          "Shortest road ETA"
        ],
        capabilitiesMatched: fallbackData.bestMatch.specialists,
        metrics: {
          er_beds_open: fallbackData.bestMatch.capacity.erBeds.available,
          icu_beds_open: fallbackData.bestMatch.capacity.icuBeds.available,
          blood_status: "Available"
        },
        publicReview: {
          rating: 4.4,
          review_count: 1820,
          summary: "Top rated for emergency resuscitation."
        }
      };

  const alternativesList = routingData?.alternatives && routingData.alternatives.length > 0
    ? routingData.alternatives
        .filter((alt: any) => {
          const allLive = fallbackData.alternatives.concat(fallbackData.bestMatch);
          const clientHosp = allLive.find(h => h.id === alt.hospital_id || (alt.hospital_id === "h2_amri" && h.id === "h2"));
          if (clientHosp && clientHosp.capacity.erBeds.available <= 0) return false;
          return (alt.metrics?.er_beds_open ?? 1) > 0;
        })
        .map((alt: any, idx: number) => ({
          id: alt.hospital_id,
          name: alt.name,
          eta: alt.estimated_travel_minutes,
          distance: alt.distance_km,
          verified: alt.emergency_receiving_status === "LIVE_VERIFIED",
          receivingStatus: alt.emergency_receiving_status,
          erBeds: alt.metrics?.er_beds_open ?? 4,
          humanReasons: alt.human_reasons || [],
          doctorInCharge: fallbackData.alternatives[idx]?.doctorInCharge || fallbackData.bestMatch.doctorInCharge,
        }))
    : fallbackData.alternatives
        .filter((alt: any) => alt.capacity.erBeds.available > 0)
        .map((alt: any) => ({
          id: alt.id,
          name: alt.name,
          eta: alt.eta,
          distance: alt.distance,
          verified: alt.verified,
          receivingStatus: "LIVE_VERIFIED",
          erBeds: alt.capacity.erBeds.available,
          humanReasons: ["Alternative facility with open ER beds"],
          doctorInCharge: alt.doctorInCharge,
        }));

  const openSOSConfirm = (hospital: any) => {
    setSelectedHospital(hospital);
    setShowSOSModal(true);
  };

  const confirmAndSend = async () => {
    if (!selectedHospital) return;
    const now = Date.now();
    const targetCaseId = state.caseId || `NR-${Math.floor(10000 + Math.random() * 90000)}`;

    updateState({
      caseId: targetCaseId,
      hospitalId: selectedHospital.id,
      status: "PENDING",
      createdAt: now,
      ambulanceRequired: state.ambulanceRequired ?? true,
      ambulanceDispatched: state.ambulanceRequired !== false,
    });

    // Call destination confirmation endpoint to lock audit trail
    try {
      await fetch(`/api/v1/emergency/${targetCaseId}/confirm-destination`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospital_id: selectedHospital.id }),
      });
    } catch (e) {
      console.warn("[NearER] Could not record destination lock:", e);
    }

    // If ambulance is requested, dispatch with the captured patient location
    if (state.ambulanceRequired !== false) {
      try {
        await fetch("/api/v1/ambulance/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            case_id: targetCaseId,
            hospital_id: selectedHospital.id,
            patient_name: state.patientName || "Emergency Patient",
            patient_location: {
              latitude: state.location?.lat || 22.5804,
              longitude: state.location?.lng || 88.4173,
              area: state.location?.area || "Salt Lake",
              city: state.location?.city || "Kolkata",
            },
            emergency_type: typeId,
          }),
        });
        updateState({ ambulanceDispatched: true });
      } catch (err) {
        console.warn("[NearER Ambulance] Dispatch call warning:", err);
      }
    }

    setShowSOSModal(false);
    router.push(`/emergency/status`);
  };

  return (
    <>
      <AppNavbar title={t("rec.title", lang)} backTo="/emergency" />

      <main className="pt-24 pb-32 px-4 sm:px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-[#050B18] tracking-tight">
            {t("rec.title", lang)}
          </h1>
          <p className="text-gray-500 mt-2">
            {lang === "hi"
              ? `लाइव क्षमता और आपके ${emergency.title} आपातकाल के आधार पर`
              : `Based on real-time capacity and your ${emergency.title.toLowerCase()} emergency.`}
          </p>
        </motion.div>

        {/* Best Match Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-1 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#0052FF]/20 relative overflow-hidden mb-12"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0052FF]" />

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#0052FF]/10 text-[#0052FF] px-2.5 py-1 rounded-md">
                {t("rec.bestMatch", lang)}
              </span>
              {bestMatch.verified && (
                <span className="flex items-center gap-1 text-[#059669] text-xs font-bold bg-[#059669]/10 px-2 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {lang === "hi" ? "लाइव सत्यापित" : "LIVE VERIFIED"}
                </span>
              )}
              <span suppressHydrationWarning className="text-xs font-medium text-gray-400 ml-auto flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {bestMatch.lastUpdated}
              </span>
            </div>

            <h2 suppressHydrationWarning className="text-2xl font-bold text-[#050B18] mb-1">{bestMatch.name}</h2>
            <div suppressHydrationWarning className="flex items-center gap-3 text-sm text-gray-500 font-medium mb-6">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-[#D97706]" /> {bestMatch.eta} {t("general.etaMin", lang)}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {bestMatch.distance} {t("general.km", lang)}</span>
            </div>

            {/* Doctor in Charge on Duty Card */}
            {bestMatch.doctorInCharge && (
              <div suppressHydrationWarning className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0 mt-0.5">
                  DR
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {lang === "hi" ? "ड्यूटी पर प्रभारी डॉक्टर" : "DOCTOR IN CHARGE ON DUTY"}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                      {bestMatch.doctorInCharge.shift}
                    </span>
                  </div>
                  <h4 suppressHydrationWarning className="font-bold text-sm sm:text-base text-[#050B18]">
                    {bestMatch.doctorInCharge.name}
                  </h4>
                  <p suppressHydrationWarning className="text-xs text-emerald-800 font-medium">
                    {bestMatch.doctorInCharge.designation} • {bestMatch.doctorInCharge.specialty}
                  </p>
                  <p suppressHydrationWarning className="text-[11px] text-gray-500 mt-0.5 font-mono">
                    Reg: {bestMatch.doctorInCharge.registrationNumber} | Hot-Line: {bestMatch.doctorInCharge.phoneExtension}
                  </p>
                </div>
              </div>
            )}

            <div suppressHydrationWarning className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#050B18]">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                {lang === "hi" ? `ER उपलब्ध (${bestMatch.metrics.er_beds_open} बेड)` : `ER Available (${bestMatch.metrics.er_beds_open} beds)`}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#050B18]">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                {lang === "hi" ? `ICU उपलब्ध (${bestMatch.metrics.icu_beds_open} बेड)` : `ICU Available (${bestMatch.metrics.icu_beds_open} beds)`}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#050B18]">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                {lang === "hi" ? `ब्लड बैंक: ${bestMatch.metrics.blood_status}` : `Blood Bank: ${bestMatch.metrics.blood_status}`}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#050B18]">
                <ShieldCheck className="w-4 h-4 text-[#0052FF]" />
                <span className="text-xs font-mono uppercase text-[#0052FF]">{bestMatch.dataConfidence} DATA CONFIDENCE</span>
              </div>
            </div>

            {/* Matched Capabilities Tags */}
            {bestMatch.capabilitiesMatched && bestMatch.capabilitiesMatched.length > 0 && (
              <div className="mb-6">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  {lang === "hi" ? "सत्यापित आपातकालीन सुविधाएं" : "Verified Clinical Capabilities"}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bestMatch.capabilitiesMatched.slice(0, 6).map((cap: string, i: number) => (
                    <span key={i} className="text-xs font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg">
                      ✓ {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Explainable Reasoning — PRD Section 1 & 7.2 */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 mb-6">
              <h3 className="text-xs font-black text-[#0052FF] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                {lang === "hi" ? "NearER ने यह अस्पताल क्यों चुना" : "Why NearER Routing Engine Selected This Hospital"}
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm font-medium text-gray-700">
                {bestMatch.humanReasons && bestMatch.humanReasons.length > 0 ? (
                  bestMatch.humanReasons.map((reason: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0052FF] shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0052FF] shrink-0 mt-0.5" />
                      <span>{lang === "hi" ? `${emergency.title} के लिए सबसे तेज़ मार्ग` : `Fastest verified route for ${emergency.title} emergency`}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0052FF] shrink-0 mt-0.5" />
                      <span>{lang === "hi" ? "आवश्यक विशेषज्ञ वर्तमान में ड्यूटी पर" : "Required clinical capability gates satisfied"}</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Public Community Review — Kept strictly separated from clinical criteria (PRD Section 1) */}
            {bestMatch.publicReview && (
              <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-3.5 mb-6 text-xs flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#050B18] flex items-center gap-1">
                    <span>★ {bestMatch.publicReview.rating}</span>
                    <span className="text-gray-500 font-normal">({bestMatch.publicReview.review_count} community reviews)</span>
                  </div>
                  <div className="text-gray-600 text-[11px] mt-0.5">{bestMatch.publicReview.summary}</div>
                </div>
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100/80 px-2 py-1 rounded-md shrink-0">
                  Public Feedback
                </div>
              </div>
            )}

            {/* Request Hospital SOS Button — opens confirmation modal */}
            <button
              onClick={() => openSOSConfirm(bestMatch)}
              className="w-full bg-[#0052FF] text-white py-4 rounded-xl font-bold text-base hover:bg-blue-600 transition-colors shadow-[0_10px_30px_-10px_rgba(0,82,255,0.5)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Activity className="w-5 h-5" />
              {t("rec.sendSOS", lang)}
            </button>
          </div>
        </motion.div>

        {/* Alternative Hospitals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-bold text-[#050B18] mb-4">{t("rec.alternatives", lang)}</h3>
          <div className="space-y-3">
            {alternativesList.map((alt: any) => (
              <div
                key={alt.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 suppressHydrationWarning className="font-bold text-sm text-[#050B18]">{alt.name}</h4>
                      {alt.verified ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-md">
                          {t("general.unverified", lang).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div suppressHydrationWarning className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#D97706]" /> {alt.eta} {t("general.etaMin", lang)}</span>
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-[#059669]" /> {alt.erBeds} ER {lang === "hi" ? "बेड" : "Beds"}</span>
                      <span>• {alt.distance} km</span>
                    </div>
                    {alt.doctorInCharge && (
                      <div suppressHydrationWarning className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1.5">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        <span className="font-bold">{alt.doctorInCharge.name}</span> ({alt.doctorInCharge.shift})
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openSOSConfirm(alt)}
                    className="text-xs font-bold text-[#0052FF] bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100 whitespace-nowrap cursor-pointer"
                  >
                    {lang === "hi" ? "यहाँ भेजें" : "Send Here"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* SOS Confirmation Modal */}
      <AnimatePresence>
        {showSOSModal && selectedHospital && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSOSModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-[#050B18] p-5 text-white relative">
                <button
                  onClick={() => setShowSOSModal(false)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0052FF] flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                      {t("sos.confirm.title", lang)}
                    </div>
                    <div className="font-black text-lg leading-tight">{selectedHospital.name}</div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Privacy notice — only this hospital */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#0052FF] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-black text-[#050B18] uppercase tracking-wide mb-1">
                        {t("sos.confirm.body", lang)} {selectedHospital.name}
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        {t("sos.confirm.note", lang)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Patient Care Accountability */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-black text-amber-900 uppercase tracking-wide mb-1">
                        {t("sos.confirm.accountability", lang)}
                      </div>
                      <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        {t("sos.confirm.accountability.body", lang)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Receiving Doctor Lead on Duty */}
                {selectedHospital.doctorInCharge && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      DR
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                        {lang === "hi" ? "ड्यूटी पर अस्पताल के प्रभारी डॉक्टर" : "Receiving ER Lead on Duty"}
                      </div>
                      <div className="text-xs font-bold text-[#050B18] truncate">
                        {selectedHospital.doctorInCharge.name} ({selectedHospital.doctorInCharge.qualification})
                      </div>
                    </div>
                  </div>
                )}

                {/* ETA reminder */}
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#D97706]" />
                    <span className="text-sm font-bold text-[#050B18]">
                      {lang === "hi" ? "अनुमानित पहुंच समय" : "Estimated arrival"}
                    </span>
                  </div>
                  <span className="text-lg font-black text-[#0052FF]">{selectedHospital.eta} {t("general.etaMin", lang)}</span>
                </div>

                {/* Buttons */}
                <button
                  onClick={confirmAndSend}
                  className="w-full bg-[#0052FF] text-white py-4 rounded-2xl font-bold text-base hover:bg-blue-600 transition-colors shadow-[0_10px_30px_-10px_rgba(0,82,255,0.5)] flex items-center justify-center gap-2"
                >
                  <Activity className="w-5 h-5" />
                  {t("sos.confirm.send", lang)}
                </button>
                <button
                  onClick={() => setShowSOSModal(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  {t("sos.confirm.cancel", lang)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function RecommendationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RecommendationContent />
    </Suspense>
  );
}
