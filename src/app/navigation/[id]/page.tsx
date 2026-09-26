"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { MOCK_HOSPITALS, findHospitalById } from "@/lib/demo-data";
import { useEmergencyState } from "@/lib/demo-state";
import { 
  ArrowLeft, 
  Navigation2, 
  PhoneCall, 
  ShieldCheck, 
  MapPin, 
  QrCode, 
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
  Siren,
  Download,
  Ambulance,
  Car
} from "lucide-react";
import Link from "next/link";
import { AppNavbar } from "@/components/app/AppNavbar";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

import { addPatientHistory, addHospitalAdmission, EmergencyVisitHistory } from "@/lib/history-service";

export default function NavigationPage() {
  const params = useParams();
  const router = useRouter();
  const { state, updateState } = useEmergencyState();
  const { lang } = useLang();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rawHospitalId = (params.id as string) || state.hospitalId;
  const hospital = findHospitalById(rawHospitalId, !mounted);

  const [arrived, setArrived] = useState(state.status === "ARRIVED" || state.status === "CONFIRMED");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Dynamic Rerouting Engine active telemetry monitor
  const [rerouteOffer, setRerouteOffer] = useState<{
    reroute_type: "MANDATORY" | "OPTIONAL";
    better_destination: {
      hospital_id: string;
      name: string;
      latitude: number;
      longitude: number;
      eta_minutes: number;
      distance_km: number;
      time_saved_minutes: number;
      human_reasons: string[];
    };
    current_destination: {
      hospital_id: string;
      name: string;
      eta_minutes: number;
      status: string;
    };
    evaluation_reason: string;
  } | null>(null);

  const [isApplyingReroute, setIsApplyingReroute] = useState(false);
  const [dismissedRerouteId, setDismissedRerouteId] = useState<string | null>(null);

  // Poll route evaluation
  useEffect(() => {
    if (arrived) return;

    let isMounted = true;
    const checkRoute = async () => {
      try {
        let hospital_overrides: any = undefined;
        try {
          const raw = typeof window !== "undefined" ? localStorage.getItem("nearer_hospital_overrides") : null;
          if (raw) hospital_overrides = JSON.parse(raw);
        } catch {}

        const payload = {
          case_id: state.caseId || "NR-10482",
          current_hospital_id: hospital.id,
          patient_location: {
            latitude: state.location?.lat || 22.5726,
            longitude: state.location?.lng || 88.3639,
            area: state.location?.area || "Kolkata",
            city: state.location?.city || "Kolkata",
          },
          emergency_type: state.emergencyId || "cardiac",
          hospital_overrides,
        };

        const res = await fetch("/api/v1/emergency/recheck", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (
            isMounted &&
            data.reroute_recommended &&
            data.better_destination &&
            data.better_destination.hospital_id !== dismissedRerouteId
          ) {
            setRerouteOffer(data);
          }
        }
      } catch (e) {
        // Fallback gracefully on network jitter
      }
    };

    const initialTimer = setTimeout(checkRoute, 3000);
    const interval = setInterval(checkRoute, 12000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [arrived, hospital.id, state.caseId, state.location, state.emergencyId, dismissedRerouteId]);

  const handleApplyReroute = async () => {
    if (!rerouteOffer || !rerouteOffer.better_destination) return;
    setIsApplyingReroute(true);
    const better = rerouteOffer.better_destination;

    try {
      await fetch("/api/v1/emergency/reroute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: state.caseId || "NR-10482",
          old_hospital_id: hospital.id,
          new_hospital_id: better.hospital_id,
          reason: rerouteOffer.evaluation_reason,
          patient_location: {
            latitude: state.location?.lat || 22.5726,
            longitude: state.location?.lng || 88.3639,
          },
        }),
      });

      updateState({ hospitalId: better.hospital_id });
      setRerouteOffer(null);

      // Launch fresh directions in Google Maps
      const newUrl = `https://www.google.com/maps/dir/?api=1&destination=${better.latitude},${better.longitude}&travelmode=driving`;
      window.open(newUrl, "_blank");

      // Navigate route
      router.push(`/navigation/${better.hospital_id}`);
    } catch (err) {
      console.error("[NearER Reroute] Failed to apply:", err);
    } finally {
      setIsApplyingReroute(false);
    }
  };

  const handleDismissReroute = () => {
    if (rerouteOffer) {
      setDismissedRerouteId(rerouteOffer.better_destination.hospital_id);
    }
    setRerouteOffer(null);
  };

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://nearer.app";
    const passUrl = `${origin}/pass?caseId=${encodeURIComponent(state.caseId || "NR-10482")}&patient=${encodeURIComponent(state.patientName || "Jisan Halder")}&blood=${encodeURIComponent(state.bloodGroup || "O+")}&hospital=${encodeURIComponent(hospital.name)}`;

    QRCode.toDataURL(passUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: "#050B18",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code generation error:", err));
  }, [state.caseId, state.patientName, state.bloodGroup, hospital.name]);

  const hospLat = hospital.latitude ?? 22.5645;
  const hospLng = hospital.longitude ?? 88.4069;
  const destinationParam = `${hospLat},${hospLng}`;

  // Smart origin handling: Only include origin if coordinates are in the local Kolkata vicinity (< 50 km).
  // If origin is missing or resolves to a distant desktop ISP (e.g. Mumbai/Delhi),
  // omitting origin lets Google Maps start turn-by-turn navigation directly from the user's REAL live GPS location!
  const hasLocalOrigin =
    state.location?.lat &&
    state.location?.lng &&
    Math.abs(state.location.lat - hospLat) < 0.5 &&
    Math.abs(state.location.lng - hospLng) < 0.5;

  const originParam = hasLocalOrigin
    ? `&origin=${state.location!.lat},${state.location!.lng}`
    : "";

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}${originParam}&travelmode=driving`;

  // Automatically launch Google Maps once when this screen opens
  const hasLaunchedRef = useRef(false);
  useEffect(() => {
    if (!arrived && typeof window !== "undefined" && !hasLaunchedRef.current) {
      hasLaunchedRef.current = true;
      const timer = setTimeout(() => {
        window.open(googleMapsUrl, "_blank");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [googleMapsUrl, arrived]);

  const handleArrive = () => {
    const now = new Date();
    const formatted = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }) + ", " + now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const visitItem: EmergencyVisitHistory = {
      id: `ev-${Date.now()}`,
      caseId: state.caseId || "NR-10482",
      timestamp: formatted,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      hospitalAddress: hospital.address || "Salt Lake, Kolkata",
      emergencyType: `${state.emergencyId ? state.emergencyId.toUpperCase() : "GENERAL"} Emergency`,
      doctorInChargeName: hospital.doctorInCharge.name,
      doctorInChargeRole: hospital.doctorInCharge.designation,
      originArea: state.location ? `${state.location.area}, ${state.location.city}` : "Salt Lake City, Kolkata",
      status: "ADMITTED",
      triageBay: "Red Bay 01 (Critical Resuscitation)",
      greenCorridorUsed: state.greenCorridorAlerted || false,
      etaMinutes: hospital.eta,
    };

    addPatientHistory(visitItem);
    addHospitalAdmission(visitItem);

    setArrived(true);
    updateState({ status: "ARRIVED" });
  };

  const openGoogleMaps = () => {
    window.open(googleMapsUrl, "_blank");
  };

  if (arrived) {
    return (
      <div className="min-h-screen bg-[#0052FF] text-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-6 rounded-3xl w-full max-w-md mb-6 text-[#050B18] shadow-2xl relative"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              NEARER EMERGENCY ADMISSION PASS
            </span>
            <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              ✓ ADMITTED
            </span>
          </div>

          <div className="text-2xl font-black mb-1 text-[#050B18]">
            {state.patientName || "Jisan Halder"}
          </div>
          <div className="inline-block bg-blue-50 text-[#0052FF] font-black tracking-widest px-3 py-1 rounded-lg text-base mb-3">
            Case: {state.caseId || "NR-10482"}
          </div>

          <div className="w-44 h-44 mx-auto bg-white rounded-2xl flex items-center justify-center mb-2 border-2 border-gray-100 p-2 shadow-inner">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Emergency Admission Pass QR" className="w-40 h-40 rounded-xl object-contain" />
            ) : (
              <QrCode className="w-32 h-32 text-gray-800 animate-pulse" />
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Link
              href={`/pass?caseId=${state.caseId || "NR-10482"}`}
              className="text-[11px] font-bold text-[#0052FF] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {lang === "hi" ? "लाइव पास देखें" : "View Live Pass"}
            </Link>
            <button
              onClick={() => {
                if (!qrDataUrl) return;
                const a = document.createElement("a");
                a.href = qrDataUrl;
                a.download = `NearER-Pass-${state.caseId || "NR-10482"}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
              className="text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {lang === "hi" ? "क्यूआर सेव करें" : "Save QR"}
            </button>
          </div>

          {/* Handover Details */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-left space-y-1 mb-3 text-xs">
            <div className="font-black text-emerald-900 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Triage Handover Complete
            </div>
            <div className="text-gray-700"><strong>Admitted To:</strong> {hospital.name}</div>
            <div className="text-gray-700"><strong>Bed Locked:</strong> Red Bay 01 (Immediate Critical Resuscitation)</div>
            <div className="text-gray-700"><strong>Attending Lead:</strong> {hospital.doctorInCharge.name}</div>
          </div>

          <p className="font-bold text-xs text-gray-500">
            {lang === "hi" ? "यह आपातकालीन विवरण आपके रोगी इतिहास और अस्पताल लॉग में दर्ज हो गया है।" : "Saved to your Patient Health Passport History & Hospital Admissions."}
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
        >
          <Link
            href="/patient"
            className="flex-1 bg-white text-[#0052FF] py-3.5 px-4 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all shadow-lg text-center"
          >
            {lang === "hi" ? "पासपोर्ट इतिहास देखें →" : "View Patient History →"}
          </Link>
          <Link
            href="/partner/dashboard"
            className="flex-1 bg-[#050B18] text-white py-3.5 px-4 rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg text-center"
          >
            {lang === "hi" ? "अस्पताल पोर्टल →" : "Hospital Log →"}
          </Link>
          <button
            onClick={() => router.push("/")}
            className="bg-white/20 text-white py-3.5 px-4 rounded-2xl font-bold text-sm hover:bg-white/30 transition-all text-center cursor-pointer"
          >
            {lang === "hi" ? "समाप्त" : "Done"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <AppNavbar 
        title={lang === "hi" ? "अस्पताल का रास्ता" : "En Route to Hospital"} 
        backTo="/emergency/status" 
      />

      <main className="pt-24 pb-36 px-4 sm:px-6 max-w-xl mx-auto space-y-4">
        
        {/* Dynamic Rerouting Alert Banner — PRD Section 4 & 5 */}
        {rerouteOffer && rerouteOffer.better_destination && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`rounded-3xl p-5 border-2 shadow-xl relative overflow-hidden ${
              rerouteOffer.reroute_type === "MANDATORY"
                ? "bg-rose-50 border-rose-500 text-rose-950"
                : "bg-amber-50 border-amber-400 text-amber-950"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                  rerouteOffer.reroute_type === "MANDATORY"
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-amber-500 text-white"
                }`}
              >
                {rerouteOffer.reroute_type === "MANDATORY"
                  ? "CRITICAL REROUTE REQUIRED"
                  : "FASTER ROUTE DETECTED"}
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-white/80 border border-gray-200">
                ⚡ {rerouteOffer.better_destination.time_saved_minutes} MINS FASTER
              </span>
            </div>

            <h3 className="text-lg font-black leading-tight mb-1">
              {rerouteOffer.reroute_type === "MANDATORY"
                ? "Current Hospital Unavailable — Switch Now"
                : `Save ${rerouteOffer.better_destination.time_saved_minutes} Mins at ${rerouteOffer.better_destination.name}`}
            </h3>

            <p className="text-xs opacity-90 mb-3 font-medium">
              {rerouteOffer.evaluation_reason}
            </p>

            {/* Travel Time Comparison */}
            <div className="grid grid-cols-2 gap-2 bg-white/70 rounded-2xl p-3 mb-3 border border-black/5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Current Route</span>
                <span className="font-bold text-gray-700">{hospital.name.slice(0, 18)}...</span>
                <div className="font-black text-sm text-gray-800">
                  {rerouteOffer.current_destination.eta_minutes} mins
                </div>
              </div>
              <div className="border-l border-gray-200 pl-3">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Optimized Destination</span>
                <span className="font-bold text-emerald-900">{rerouteOffer.better_destination.name.slice(0, 18)}...</span>
                <div className="font-black text-sm text-emerald-600">
                  {rerouteOffer.better_destination.eta_minutes} mins
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleApplyReroute}
                disabled={isApplyingReroute}
                className="flex-1 bg-[#050B18] text-white py-3 px-4 rounded-xl font-black text-xs sm:text-sm hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation2 className="w-4 h-4 text-emerald-400" />
                {isApplyingReroute
                  ? "Rerouting..."
                  : `Reroute to ${rerouteOffer.better_destination.name.split(" ")[0]} →`}
              </button>
              {rerouteOffer.reroute_type === "OPTIONAL" && (
                <button
                  onClick={handleDismissReroute}
                  className="bg-white/80 hover:bg-white text-gray-700 py-3 px-3 rounded-xl font-bold text-xs border border-gray-200 transition-all cursor-pointer"
                >
                  Keep Current Route
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Google Maps Direct Navigation Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#0052FF] to-blue-600 rounded-3xl p-5 text-white shadow-lg shadow-blue-500/20"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-blue-100">
                {lang === "hi" ? "गूगल मैप्स नेविगेशन सक्रिय" : "Google Maps Navigation Active"}
              </span>
            </div>
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
              {lang === "hi" ? "लाइव ड्राइविंग" : "Live Driving"}
            </span>
          </div>

          <h2 suppressHydrationWarning className="text-xl font-black mb-1">
            {lang === "hi" ? `${hospital.name} की ओर प्रस्थान` : `Navigating to ${hospital.name}`}
          </h2>
          <p suppressHydrationWarning className="text-xs text-blue-100 mb-4">
            {lang === "hi" 
              ? `गूगल मैप्स में खुला रूट (${hospital.eta} मिनट • ${hospital.distance} किमी)`
              : `Turn-by-turn route opened in Google Maps (${hospital.eta} mins • ${hospital.distance} km).`}
          </p>

          <button
            onClick={openGoogleMaps}
            className="w-full bg-white text-[#0052FF] py-3 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-colors shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            {lang === "hi" ? "गूगल मैप्स में देखें" : "Open in Google Maps"}
          </button>
        </motion.div>

        {/* Traffic Police Green Corridor Notification (Only visible when verified by hospital & sent to towers) */}
        {state.greenCorridorAlerted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-300 rounded-3xl p-4 shadow-sm"
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
              </div>
            </div>
          </motion.div>
        )}

        {/* Emergency Case Pass Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                NearER Emergency Pass
              </span>
              <h3 suppressHydrationWarning className="text-xl font-black text-[#050B18]">
                {state.patientName || "Patient"}
              </h3>
            </div>
            <div className="text-right">
              <span suppressHydrationWarning className="inline-block bg-gray-100 text-gray-800 font-black tracking-widest px-3 py-1 rounded-xl text-sm">
                {state.caseId || "NR-10482"}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="py-5 flex flex-col items-center justify-center text-center">
            <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-3xl p-3 flex items-center justify-center shadow-md mb-3 group relative">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={qrDataUrl} 
                  alt="NearER Emergency Pass QR" 
                  className="w-40 h-40 rounded-xl object-contain" 
                />
              ) : (
                <QrCode className="w-36 h-36 text-[#050B18] animate-pulse" />
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/pass?caseId=${state.caseId || "NR-10482"}`}
                className="text-xs font-black text-[#0052FF] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {lang === "hi" ? "लाइव पास देखें" : "View Live Pass"}
              </Link>
              <button
                onClick={() => {
                  if (!qrDataUrl) return;
                  const a = document.createElement("a");
                  a.href = qrDataUrl;
                  a.download = `NearER-Pass-${state.caseId || "NR-10482"}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {lang === "hi" ? "डाउनलोड" : "Save QR"}
              </button>
            </div>

            <p className="text-xs font-bold text-gray-500">
              {lang === "hi" ? "आपातकालीन ट्राइएज डेस्क पर यह क्यूआर कोड दिखाएं या स्कैन कराएं।" : "Show or scan this QR at hospital triage for instant admission."}
            </p>
          </div>

          {/* Reserved capacity status */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-2 text-xs font-bold text-[#059669]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              {lang === "hi" ? "अस्पताल अलर्ट किया गया एवं बेड अस्थायी रूप से आरक्षित" : "Hospital staff alerted & capacity temporarily held"}
            </span>
          </div>
        </div>

        {/* Transit Mode Card: Conditional Ambulance Escort vs Self-Transport */}
        {state.ambulanceRequired === false ? (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#050B18] rounded-3xl p-5 text-white shadow-lg border border-slate-700/50 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <Car className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    {lang === "hi" ? "स्वयं परिवहन मोड सक्रिय" : "Self-Transport Mode Active"}
                  </span>
                  <div className="text-sm font-black text-white">
                    {lang === "hi" ? "सीधे अस्पताल का मार्ग" : "Direct Transit to Hospital"}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-full">
                {lang === "hi" ? "स्वयं ड्राइव" : "SELF-DRIVE"}
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4 font-medium leading-relaxed">
              {lang === "hi"
                ? `आप स्वयं के वाहन से ${hospital.name} जा रहे हैं। आपातकालीन कक्ष में सीधा प्रवेश सुनिश्चित किया गया है।`
                : `You are travelling independently to ${hospital.name}. ER reception desk is prepared for your direct arrival.`}
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
                }}
                className="flex-1 bg-[#0052FF] hover:bg-blue-600 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-center cursor-pointer"
              >
                <Navigation2 className="w-3.5 h-3.5" />
                {lang === "hi" ? "गूगल मैप्स नेविगेशन" : "Open in Google Maps"}
              </button>
              <button
                onClick={() => {
                  updateState({ ambulanceRequired: true, ambulanceDispatched: true });
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
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-[#050B18] rounded-3xl p-5 text-white shadow-lg border border-blue-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
                  <Ambulance className="w-5 h-5 text-blue-400 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
                    {lang === "hi" ? "उन्नत जीवन रक्षक एम्बुलेंस" : "ALS Ambulance Transit"}
                  </span>
                  <div className="text-sm font-black text-white">AMB-101 • Live Escort</div>
                </div>
              </div>
              <span className="text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                6 MINS
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4 font-medium leading-relaxed">
              {lang === "hi"
                ? "चालक राजेश मोंडल एवं पैरामेडिक सुनीता रॉय के साथ मोबाइल आईसीयू एम्बुलेंस मार्ग में है।"
                : "ALS Mobile ICU en route. Live GPS telemetry, ventilator status, and direct paramedic contact active."}
            </p>

            <div className="flex items-center gap-2.5">
              <Link
                href={`/emergency/ambulance?caseId=${state.caseId || "NR-10482"}`}
                className="flex-1 bg-[#0052FF] hover:bg-blue-600 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-center"
              >
                <Navigation2 className="w-3.5 h-3.5" />
                {lang === "hi" ? "एम्बुलेंस ट्रैक करें" : "Track Dispatched Ambulance"}
              </Link>
              <a
                href="tel:108"
                className="bg-white/10 hover:bg-white/20 text-rose-300 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-rose-500/20"
              >
                <Siren className="w-3.5 h-3.5 text-rose-400" />
                108 Helpline
              </a>
            </div>
          </div>
        )}

        {/* Quick Communications */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`tel:${hospital.phone}`}
            className="flex items-center justify-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm py-3.5 px-4 font-bold text-sm text-green-700 hover:bg-green-50 transition-colors cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-green-600" />
            {t("status.callHospital", lang)}
          </a>
          <Link
            href="/emergency/message"
            className="flex items-center justify-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm py-3.5 px-4 font-bold text-sm text-[#0052FF] hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-[#0052FF]" />
            {t("status.messageHospital", lang)}
          </Link>
        </div>

      </main>

      {/* Floating Bottom Confirm Arrival CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent z-40">
        <div className="max-w-xl mx-auto space-y-2">
          <button
            onClick={handleArrive}
            className="w-full bg-[#050B18] text-white py-4 rounded-2xl font-bold text-base hover:bg-gray-800 active:scale-[0.99] transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {lang === "hi" ? "मैं अस्पताल पहुंच गया हूं" : "I Have Reached the Hospital"}
          </button>
        </div>
      </div>
    </>
  );
}