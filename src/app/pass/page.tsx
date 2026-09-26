"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Phone, 
  Hospital, 
  Heart, 
  UserCheck, 
  Activity, 
  FileBadge, 
  Download, 
  Copy, 
  Check, 
  ArrowLeft,
  Share2,
  Lock,
  Stethoscope
} from "lucide-react";
import Link from "next/link";
import { useEmergencyState } from "@/lib/demo-state";
import { addHospitalAdmission, addPatientHistory, EmergencyVisitHistory } from "@/lib/history-service";
import { emergencyService } from "@/lib/services/emergencyService";
import { MOCK_HOSPITALS } from "@/lib/demo-data";

function PassContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state, updateCase, updateState, cases } = useEmergencyState();

  const caseIdFromUrl = searchParams.get("caseId") || searchParams.get("id");
  const activeCaseId = caseIdFromUrl || state.caseId || "NR-10482";

  // Find matching case from state or URL params
  const matchedCase = cases.find(c => c.caseId === activeCaseId) || (state.caseId === activeCaseId ? state : null);

  const patientName = searchParams.get("patient") || searchParams.get("name") || matchedCase?.patientName || state.patientName || "Jisan Halder";
  const bloodGroup = searchParams.get("blood") || searchParams.get("bg") || matchedCase?.bloodGroup || state.bloodGroup || "O+";
  const emergencyType = matchedCase?.emergencyId ? `${matchedCase.emergencyId.toUpperCase()} Emergency` : "Acute Respiratory / Cardiac Alert";
  const hospitalNameParam = searchParams.get("hospital");
  const hospitalIdParam = matchedCase?.hospitalId || state.hospitalId || "h2";
  const hospitalObj = MOCK_HOSPITALS.find(h => h.id === hospitalIdParam) || MOCK_HOSPITALS[0];
  const hospitalName = hospitalNameParam || hospitalObj.name;
  const assignedBay = matchedCase?.assignedBed || state.assignedBed || "Red Bay 01 (Critical Resuscitation)";
  const doctorName = hospitalObj.doctorInCharge?.name || "Dr. Debashis Roy";
  const doctorRole = hospitalObj.doctorInCharge?.designation || "Senior Consultant - Emergency Triage";

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [admitted, setAdmitted] = useState(
    matchedCase?.status === "ARRIVED" || matchedCase?.status === "CONFIRMED" || state.status === "ARRIVED"
  );
  const [copied, setCopied] = useState(false);
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate scannable QR data URL for this pass
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://nearer.app";
    const passUrl = `${origin}/pass?caseId=${encodeURIComponent(activeCaseId)}&patient=${encodeURIComponent(patientName)}&blood=${encodeURIComponent(bloodGroup)}&hospital=${encodeURIComponent(hospitalName)}`;

    QRCode.toDataURL(passUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: "#050B18",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating Pass QR code:", err));
  }, [activeCaseId, patientName, bloodGroup, hospitalName]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `NearER-Pass-${activeCaseId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleConfirmAdmission = async () => {
    setIsAdmitting(true);

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }) + ", " + now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const visitItem: EmergencyVisitHistory = {
      id: `ev-${Date.now()}`,
      caseId: activeCaseId,
      timestamp: formattedDate,
      hospitalId: hospitalIdParam,
      hospitalName: hospitalName,
      hospitalAddress: hospitalObj.address || "Salt Lake, Kolkata",
      emergencyType: emergencyType,
      doctorInChargeName: doctorName,
      doctorInChargeRole: doctorRole,
      originArea: state.location ? `${state.location.area}, ${state.location.city}` : "Salt Lake City, Kolkata",
      status: "ADMITTED",
      triageBay: assignedBay,
      greenCorridorUsed: state.greenCorridorAlerted || false,
      etaMinutes: 0,
      patientName: patientName,
    };

    // Save to both hospital admissions log & patient history
    addPatientHistory(visitItem);
    addHospitalAdmission(visitItem);

    // Update global state & Supabase
    updateCase(activeCaseId, { status: "ARRIVED", assignedBed: assignedBay });
    if (state.caseId === activeCaseId) {
      updateState({ status: "ARRIVED", assignedBed: assignedBay });
    }

    try {
      await emergencyService.updateCaseStatus(activeCaseId, "ARRIVED");
    } catch (e) {
      console.warn("Supabase pass status update non-fatal error:", e);
    }

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100, 50, 150]);
    }

    setIsAdmitting(false);
    setAdmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#050B18] text-white selection:bg-[#0052FF] selection:text-white pb-16">
      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-[#050B18]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-[#0052FF] uppercase">NearER Emergency</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h1 className="text-sm font-bold text-gray-300">Live Triage Admission Pass</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-all text-gray-200"
              title="Share or copy pass URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Share"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Official Security Verification Banner */}
        <div className="bg-gradient-to-r from-blue-950/60 via-[#0052FF]/20 to-purple-950/40 border border-[#0052FF]/40 rounded-3xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#0052FF]/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0052FF] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    VERIFIED ENCRYPTED PASS
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">
                    Live: {currentTime || "Active"}
                  </span>
                </div>
                <h2 className="text-base font-black text-white mt-1">
                  NearER Instant Triage Admission System
                </h2>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${
                admitted ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
              }`}>
                {admitted ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-blue-400" />}
                {admitted ? "ADMITTED" : "EN ROUTE"}
              </span>
            </div>
          </div>
        </div>

        {/* The Pass Card (Physical-looking Credential) */}
        <div className="bg-white text-[#050B18] rounded-3xl shadow-2xl p-6 relative overflow-hidden border border-gray-100">
          
          {/* Watermark badge */}
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 opacity-5 pointer-events-none select-none">
            <FileBadge className="w-64 h-64 text-[#050B18]" />
          </div>

          {/* Pass Header */}
          <div className="flex items-start justify-between pb-4 border-b border-gray-100 relative z-10">
            <div>
              <span className="text-[10px] font-black tracking-widest text-[#0052FF] uppercase">
                EMERGENCY TRIAGE HANDOVER CREDENTIAL
              </span>
              <h3 className="text-2xl font-black tracking-tight text-[#050B18]">
                {patientName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-red-500 text-white font-black text-xs px-2.5 py-0.5 rounded-md shadow-sm">
                  Blood Group: {bloodGroup}
                </span>
                <span className="text-xs font-bold text-gray-500">
                  {emergencyType}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Case Identification</span>
              <span className="inline-block bg-gray-100 text-[#050B18] font-mono font-black text-sm px-3 py-1 rounded-xl mt-0.5">
                {activeCaseId}
              </span>
            </div>
          </div>

          {/* Central Interactive QR Code Display */}
          <div className="py-6 flex flex-col items-center justify-center text-center relative z-10">
            <div className="bg-white p-3 rounded-2xl border-2 border-gray-200 shadow-md relative group">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={qrDataUrl} 
                  alt={`Emergency Pass QR Code for Case ${activeCaseId}`} 
                  className="w-48 h-48 rounded-xl object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-50 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#0052FF] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleDownloadQr}
                className="text-xs font-bold text-gray-600 hover:text-[#0052FF] bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Save QR to Phone
              </button>
              <button
                onClick={handleCopyLink}
                className="text-xs font-bold text-gray-600 hover:text-[#0052FF] bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Link
              </button>
            </div>

            <p className="text-xs text-gray-500 font-bold mt-2">
              Scan with any phone camera or hospital triage barcode reader for zero-delay entry.
            </p>
          </div>

          {/* Reserved Hospital & Bay Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 relative z-10">
            <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-[11px] font-black text-blue-900 uppercase">
                <Hospital className="w-4 h-4 text-[#0052FF]" /> Destination Hospital
              </div>
              <div className="font-black text-sm text-[#050B18] mt-1">
                {hospitalName}
              </div>
              <div className="text-[11px] text-gray-600 mt-0.5">
                {hospitalObj.address || "Kolkata Triage Network"}
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-[11px] font-black text-emerald-900 uppercase">
                <Lock className="w-4 h-4 text-emerald-600" /> Locked Triage Bay
              </div>
              <div className="font-black text-sm text-emerald-950 mt-1">
                {assignedBay}
              </div>
              <div className="text-[11px] text-gray-600 mt-0.5 flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                Lead: {doctorName}
              </div>
            </div>
          </div>

          {/* Real-time Triage Handover Status Bar */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-bold relative z-10">
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${admitted ? "bg-emerald-500" : "bg-blue-500 animate-ping"}`} />
              {admitted ? "Triage Handover Completed" : "Waiting for ER Admission Handover"}
            </span>
            <span className="font-mono text-[11px] text-gray-400">NearER Engine v2.4</span>
          </div>
        </div>

        {/* 1-Tap Admission Action Button (For Hospital Triage Staff or Patient Confirmation) */}
        <div className="space-y-3">
          {!admitted ? (
            <button
              onClick={handleConfirmAdmission}
              disabled={isAdmitting}
              className="w-full bg-[#0052FF] hover:bg-blue-600 active:scale-[0.99] text-white p-4 rounded-2xl font-black text-base shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              {isAdmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Logging Admission to Hospital Registry...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>⚡ ADMIT PATIENT (COMPLETE TRIAGE HANDOVER)</span>
                </>
              )}
            </button>
          ) : (
            <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>TRIAGE ADMISSION CONFIRMED & BAY UNLOCKED</span>
              </div>
              <p className="text-xs text-gray-300">
                Patient has been admitted to <strong>{assignedBay}</strong> at <strong>{hospitalName}</strong>. Logged to hospital records and patient health passport.
              </p>
            </div>
          )}

          {/* Secondary Action Links */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link
              href="/partner/dashboard"
              className="bg-white/10 hover:bg-white/15 text-white py-3 px-4 rounded-2xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-2"
            >
              <Hospital className="w-4 h-4 text-blue-400" /> Hospital Portal
            </Link>
            <Link
              href="/patient"
              className="bg-white/10 hover:bg-white/15 text-white py-3 px-4 rounded-2xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" /> Patient Passport
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function PassPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050B18] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0052FF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PassContent />
    </Suspense>
  );
}
