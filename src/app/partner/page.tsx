"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  ArrowRight, 
  Activity, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  User, 
  Key, 
  Stethoscope, 
  Sparkles,
  Zap,
  Radio
} from "lucide-react";
import { MOCK_HOSPITALS } from "@/lib/demo-data";
import { usePartnerHospital, useEmergencyState } from "@/lib/demo-state";

export default function PartnerLogin() {
  const router = useRouter();
  const { hospitalId, switchHospital } = usePartnerHospital();
  const { state } = useEmergencyState();

  const [loginMode, setLoginMode] = useState<"QUICK" | "CREDENTIALS">("QUICK");
  const [selectedHospital, setSelectedHospital] = useState(hospitalId || "h1");
  const [username, setUsername] = useState("cmo@apollo.aerva.org");
  const [password, setPassword] = useState("aerva@hospital2026");
  const [staffRole, setStaffRole] = useState("Chief Medical Officer (CMO)");

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    switchHospital(selectedHospital);
    router.push("/partner/dashboard");
  };

  const handleQuickLogin = (hId: string) => {
    switchHospital(hId);
    router.push("/partner/dashboard");
  };

  const fillDemoStaff = (hId: string, email: string, role: string) => {
    setSelectedHospital(hId);
    setUsername(email);
    setPassword("aerva@demo2026");
    setStaffRole(role);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6">
      <Link href="/" className="flex items-center gap-3 mb-6">
        <Image
          src="/aerva-mark.png"
          alt="AERVA"
          width={40}
          height={26}
          className="h-9 w-auto object-contain"
        />
        <span className="font-black text-[#050B18] tracking-tight text-2xl">
          AER<span className="text-[#0052FF]">VA</span>
        </span>
        <span className="text-[#0052FF] font-bold text-xs bg-blue-50 px-2.5 py-1 rounded-lg ml-1 border border-blue-100">
          HOSPITAL OPERATIONS NETWORK
        </span>
      </Link>

      <div className="w-full max-w-4xl space-y-5">
        {/* Intro */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-[#050B18] mb-1.5">
            Hospital Operations & ER Triage Portal
          </h1>
          <p className="text-xs sm:text-sm font-medium text-gray-500 max-w-lg mx-auto">
            Log in to your hospital station to monitor incoming pre-arrival emergencies, triage acute admissions, and update live ER/ICU capacity telemetry.
          </p>
        </div>

        {/* Login Mode Toggle Tabs */}
        <div className="flex justify-center">
          <div className="bg-white p-1 rounded-2xl border border-gray-200/80 shadow-xs flex gap-1">
            <button
              type="button"
              onClick={() => setLoginMode("QUICK")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                loginMode === "QUICK"
                  ? "bg-[#0052FF] text-white shadow-sm"
                  : "text-gray-600 hover:text-[#050B18] hover:bg-gray-50"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              1-Click Station Selector (Demo Mode)
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("CREDENTIALS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                loginMode === "CREDENTIALS"
                  ? "bg-[#0052FF] text-white shadow-sm"
                  : "text-gray-600 hover:text-[#050B18] hover:bg-gray-50"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Staff Credentials Login
            </button>
          </div>
        </div>

        {/* TAB 1: 1-Click Station Cards (Demo Mode) */}
        {loginMode === "QUICK" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-5 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0052FF] bg-blue-50 px-2.5 py-1 rounded-md">
                  INSTANT 1-CLICK AUTHENTICATION
                </span>
                <h2 className="text-base sm:text-lg font-black text-[#050B18] mt-1">
                  Select Your Hospital Station
                </h2>
              </div>
              {state.status !== "IDLE" && state.status !== "CONFIRMED" && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" /> 1 Active Emergency
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {MOCK_HOSPITALS.map((h) => {
                const hasIncoming =
                  state.status !== "IDLE" &&
                  state.status !== "CONFIRMED" &&
                  state.hospitalId === h.id;
                const isSelected = selectedHospital === h.id;

                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHospital(h.id)}
                    className={`rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer relative ${
                      hasIncoming
                        ? "border-red-500 bg-red-50/40 ring-4 ring-red-100 shadow-md"
                        : isSelected
                        ? "border-[#0052FF] bg-blue-50/30 shadow-md"
                        : "border-gray-100 bg-white hover:border-gray-300"
                    }`}
                  >
                    {hasIncoming && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-red-500 text-white px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                        🚨 REQUEST ARRIVED HERE
                      </div>
                    )}

                    <div className="flex items-start gap-3 mb-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          hasIncoming ? "bg-red-100 text-red-600" : "bg-blue-100 text-[#0052FF]"
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-sm sm:text-base text-[#050B18] truncate">
                            {h.name}
                          </h3>
                          {h.verified ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> VERIFIED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                              UNVERIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                          {h.city || "Regional Network"} • {h.specialists.slice(0, 2).join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded-xl text-center text-xs mb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">
                          ER Status
                        </span>
                        <span
                          className={`font-black ${
                            h.capacity.erBeds.available > 0 ? "text-[#059669]" : "text-red-500"
                          }`}
                        >
                          {h.capacity.erBeds.available > 0
                            ? `${h.capacity.erBeds.available} Beds Free`
                            : "Full"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">
                          ICU Beds
                        </span>
                        <span className="font-black text-[#050B18]">
                          {h.capacity.icuBeds.available}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">
                          Wait Time
                        </span>
                        <span className="font-black text-[#050B18]">~{h.erWaitTime}m</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickLogin(h.id);
                      }}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer ${
                        hasIncoming
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-[#0052FF] hover:bg-blue-600 text-white"
                      }`}
                    >
                      Open {h.name.split(" ")[0]} Dashboard
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <ShieldCheck className="w-4 h-4" /> AERVA Partner Hospital Federation
              </span>
              <span className="text-gray-400 text-center sm:text-right">
                Tap any hospital station button above to instantly open its real-time triage bay.
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: Staff Credentials Login Form */}
        {loginMode === "CREDENTIALS" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8 max-w-xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] mx-auto flex items-center justify-center mb-2 font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-[#050B18]">
                Hospital Staff Authentication
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Enter your authorized clinical credentials to access your hospital's emergency console.
              </p>
            </div>

            {/* Quick Demo Pre-fill Chips */}
            <div className="mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-2">
                ⚡ Quick Demo Credential Autofill:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoStaff("h1", "cmo@apollo.aerva.org", "Chief Medical Officer (CMO)")}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs transition-colors cursor-pointer"
                >
                  Apollo CMO (Dr. Sengupta)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoStaff("h_gmch_guw", "dr.sharma@gmch.aerva.gov.in", "Head of Emergency & Trauma")}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs transition-colors cursor-pointer"
                >
                  GMCH Trauma Chief (Dr. Sharma)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoStaff("h_satribari_guw", "dr.baruah@satribari.org", "Lead Emergency Registrar")}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs transition-colors cursor-pointer"
                >
                  Satribari ER Lead (Dr. Baruah)
                </button>
              </div>
            </div>

            <form onSubmit={handleCredentialLogin} className="space-y-4">
              {/* Hospital Station Select */}
              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1.5">
                  Select Hospital Station
                </label>
                <div className="relative">
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
              </div>

              {/* Staff ID / Email */}
              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1.5">
                  Staff Email / Hospital Medical ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="doctor@hospital.aerva.org"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#050B18] focus:outline-hidden focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>
              </div>

              {/* Password / Clinical PIN */}
              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1.5">
                  Security Password / Clinical Token
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#050B18] focus:outline-hidden focus:ring-2 focus:ring-[#0052FF]"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="text-xs font-bold text-[#050B18] block mb-1.5">
                  Assigned Clinical Role
                </label>
                <div className="relative">
                  <Stethoscope className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
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

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs bg-[#0052FF] hover:bg-blue-600 text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer mt-2"
              >
                Sign In to Hospital Operations Console
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-5 text-center">
              <span className="text-[11px] text-gray-400">
                🔒 Protected by AERVA Bi-Directional Medical Security Protocol
              </span>
            </div>
          </div>
        )}

        {/* Portal Navigation Directory for Judges */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 text-xs text-gray-600 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#050B18]">AERVA System Portals:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            <Link href="/emergency" className="text-[#0052FF] hover:underline bg-blue-50 px-2 py-1 rounded">
              🚑 Patient Triage (/emergency)
            </Link>
            <Link href="/partner" className="text-[#0052FF] hover:underline bg-blue-50 px-2 py-1 rounded">
              🏥 Hospital Portal (/partner)
            </Link>
            <Link href="/reach/login" className="text-[#0052FF] hover:underline bg-blue-50 px-2 py-1 rounded">
              📡 Operator Desk (/reach/login)
            </Link>
            <Link href="/nearby" className="text-[#0052FF] hover:underline bg-blue-50 px-2 py-1 rounded">
              🌐 Discovery & Browser Use (/nearby)
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
