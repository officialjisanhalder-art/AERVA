"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Building2,
  Radio,
  User,
  Lock,
  Key,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Stethoscope,
  Phone,
  CheckCircle2,
  Sparkles,
  Zap,
  HeartPulse,
  ChevronRight
} from "lucide-react";
import { MOCK_HOSPITALS } from "@/lib/demo-data";
import { usePartnerHospital, useEmergencyState } from "@/lib/demo-state";
import { reachService } from "@/lib/services/reachService";
import { authService } from "@/lib/services/authService";

type RoleType = "HOSPITAL" | "DISPATCHER" | "PATIENT";

export default function UnifiedLoginPage() {
  const router = useRouter();
  const { hospitalId, switchHospital } = usePartnerHospital();
  const { state: emergencyState } = useEmergencyState();

  const [activeRole, setActiveRole] = useState<RoleType>("HOSPITAL");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hospital credentials state
  const [selectedHospital, setSelectedHospital] = useState(hospitalId || "h1");
  const [hospitalEmail, setHospitalEmail] = useState("cmo@apollo.aerva.org");
  const [hospitalPassword, setHospitalPassword] = useState("aerva@hospital2026");
  const [hospitalRole, setHospitalRole] = useState("Chief Medical Officer (CMO)");

  // Dispatcher credentials state
  const [dispatcherId, setDispatcherId] = useState("op_1");
  const [dispatcherEmail, setDispatcherEmail] = useState("dispatcher.op402@assam.108.gov.in");
  const [dispatcherPin, setDispatcherPin] = useState("108-DISPATCH");

  // Patient credentials state
  const [patientPhone, setPatientPhone] = useState("+91 98765 43210");
  const [patientPin, setPatientPin] = useState("4321");

  // Hospital Sign In Handler
  const handleHospitalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      switchHospital(selectedHospital);
      await authService.login(hospitalEmail, hospitalPassword);
      router.push("/partner/dashboard");
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Dispatcher Sign In Handler
  const handleDispatcherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      reachService.loginOperator(dispatcherId);
      router.push("/reach/relay");
    } catch (err: any) {
      setErrorMsg(err?.message || "Dispatcher session creation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Patient Sign In Handler
  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await authService.login(patientPhone, patientPin);
      router.push("/patient");
    } catch (err: any) {
      setErrorMsg(err?.message || "Patient sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-blue-50/20 to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* AERVA Brand Header */}
      <Link href="/" className="flex items-center gap-2.5 mb-6 hover:opacity-90 transition-opacity">
        <Image
          src="/aerva-mark.png"
          alt="AERVA"
          width={42}
          height={28}
          className="h-9 w-auto object-contain"
        />
        <span className="font-black text-[#050B18] tracking-tight text-2xl">
          AER<span className="text-[#0052FF]">VA</span>
        </span>
        <span className="text-[#0052FF] font-bold text-xs bg-blue-50 px-2.5 py-1 rounded-lg ml-1 border border-blue-100 shadow-2xs">
          UNIFIED ACCESS PORTAL
        </span>
      </Link>

      <div className="w-full max-w-xl space-y-5">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-[#050B18] tracking-tight">
            Sign In to AERVA
          </h1>
          <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
            Secure, synchronized access for hospital teams, emergency dispatchers, and patients.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-xs grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => { setActiveRole("HOSPITAL"); setErrorMsg(null); }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
              activeRole === "HOSPITAL"
                ? "bg-[#0052FF] text-white shadow-sm"
                : "text-gray-600 hover:text-[#050B18] hover:bg-gray-50"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Hospital ER</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveRole("DISPATCHER"); setErrorMsg(null); }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
              activeRole === "DISPATCHER"
                ? "bg-[#0052FF] text-white shadow-sm"
                : "text-gray-600 hover:text-[#050B18] hover:bg-gray-50"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Dispatcher 108</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveRole("PATIENT"); setErrorMsg(null); }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
              activeRole === "PATIENT"
                ? "bg-[#0052FF] text-white shadow-sm"
                : "text-gray-600 hover:text-[#050B18] hover:bg-gray-50"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Patient ID</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PORTAL 1: HOSPITAL CLINICAL STAFF */}
        {activeRole === "HOSPITAL" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0052FF] bg-blue-50 px-2 py-0.5 rounded">
                  CLINICAL PORTAL
                </span>
                <h2 className="text-lg font-black text-[#050B18] mt-1">
                  Hospital ER & Operations Console
                </h2>
              </div>
              {emergencyState.status !== "IDLE" && emergencyState.status !== "CONFIRMED" && (
                <span className="text-[11px] font-black text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
                  🚨 Active Patient In Queue
                </span>
              )}
            </div>

            {/* Quick Demo Pre-fill Chips for Judges */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1.5">
                ⚡ 1-Tap Demo Logins for Judges:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHospital("h1");
                    setHospitalEmail("cmo@apollo.aerva.org");
                    setHospitalRole("Chief Medical Officer (CMO)");
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs transition-colors cursor-pointer"
                >
                  Apollo CMO (Kolkata)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHospital("h_gmch_guw");
                    setHospitalEmail("dr.sharma@gmch.aerva.gov.in");
                    setHospitalRole("Head of Emergency & Trauma");
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs transition-colors cursor-pointer"
                >
                  GMCH Lead (Guwahati)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHospital("h_satribari_guw");
                    setHospitalEmail("dr.baruah@satribari.org");
                    setHospitalRole("Lead Emergency Registrar");
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs transition-colors cursor-pointer"
                >
                  Satribari ER Lead
                </button>
              </div>
            </div>

            <form onSubmit={handleHospitalLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1">
                  Select Hospital Station
                </label>
                <select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#050B18] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0052FF]"
                >
                  {MOCK_HOSPITALS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city || "Regional"}) {h.verified ? "• [Verified]" : "• [Unverified]"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1">
                  Staff Email / Hospital Medical ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={hospitalEmail}
                    onChange={(e) => setHospitalEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#050B18] focus:outline-hidden focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1">
                  Security Password / Clinical Token
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={hospitalPassword}
                    onChange={(e) => setHospitalPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#050B18] focus:outline-hidden focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1">
                  On-Duty Clinical Role
                </label>
                <div className="relative">
                  <Stethoscope className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={hospitalRole}
                    onChange={(e) => setHospitalRole(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#050B18] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0052FF]"
                  >
                    <option value="Chief Medical Officer (CMO)">Chief Medical Officer (CMO)</option>
                    <option value="Head of Emergency & Trauma">Head of Emergency & Trauma</option>
                    <option value="Lead Emergency Registrar">Lead Emergency Registrar</option>
                    <option value="Triage Nurse Lead">Triage Nurse Lead</option>
                    <option value="Bed & Resource Coordinator">Bed & Resource Coordinator</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-xs bg-[#0052FF] hover:bg-blue-600 text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "Authenticating..." : "Sign In to Hospital Operations Bay"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <Link
                href="/partner"
                className="text-xs font-bold text-[#0052FF] hover:underline flex items-center justify-center gap-1"
              >
                Prefer 1-Click Station Cards? Switch to Hospital Grid
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* PORTAL 2: EMERGENCY DISPATCHER (REACH RELAY) */}
        {activeRole === "DISPATCHER" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8 space-y-4"
          >
            <div className="border-b border-gray-100 pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                REACH RELAY DISPATCH DESK
              </span>
              <h2 className="text-lg font-black text-[#050B18] mt-1">
                Emergency 108 / 112 Dispatcher Console
              </h2>
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800">
              <span className="font-bold">Fleet Telemetry Active:</span> Real-time green corridor routing and hospital communication desk.
            </div>

            <form onSubmit={handleDispatcherLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1">
                  Assigned Dispatch Station
                </label>
                <select
                  value={dispatcherId}
                  onChange={(e) => setDispatcherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#050B18] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0052FF]"
                >
                  <option value="op_1">Central Emergency 108 Desk (Station OP-402)</option>
                  <option value="op_2">Traffic Intercept Controller (Tower 7)</option>
                  <option value="op_3">Regional Ambulance Fleet Supervisor</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1">
                  Operator Dispatch Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={dispatcherEmail}
                    onChange={(e) => setDispatcherEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#050B18] focus:outline-hidden focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1">
                  Dispatcher Security PIN
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={dispatcherPin}
                    onChange={(e) => setDispatcherPin(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#050B18] focus:outline-hidden focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "Establishing Radio Link..." : "Sign In to Dispatch Operations Console"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* PORTAL 3: PATIENT EMERGENCY PASSPORT */}
        {activeRole === "PATIENT" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8 space-y-4"
          >
            <div className="border-b border-gray-100 pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                PATIENT PORTAL
              </span>
              <h2 className="text-lg font-black text-[#050B18] mt-1">
                Universal Health Passport Sign In
              </h2>
            </div>

            <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 text-xs text-purple-800">
              Access your emergency blood group, linked allergies, pre-arrival consent, and emergency contact card.
            </div>

            <form onSubmit={handlePatientLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#050B18] focus:outline-hidden focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1">
                  Security PIN / Health Token
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={patientPin}
                    onChange={(e) => setPatientPin(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#050B18] focus:outline-hidden focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "View My Emergency Health Passport"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <Link
                href="/emergency"
                className="text-xs font-bold text-[#0052FF] hover:underline"
              >
                Need Immediate Emergency Help? Start Emergency Triage &rarr;
              </Link>
            </div>
          </motion.div>
        )}

        {/* Security & System Info Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 pt-2 px-2 text-center sm:text-left">
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <ShieldCheck className="w-4 h-4" /> Commercial Weight = 0 • Zero Fabrication
          </span>
          <span>AERVA Healthcare Operating System</span>
        </div>
      </div>
    </div>
  );
}
