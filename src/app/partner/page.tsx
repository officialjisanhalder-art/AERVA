"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Activity, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { MOCK_HOSPITALS } from "@/lib/demo-data";
import { usePartnerHospital, useEmergencyState } from "@/lib/demo-state";

export default function PartnerLogin() {
  const router = useRouter();
  const { hospitalId, switchHospital } = usePartnerHospital();
  const { state } = useEmergencyState();

  const [selectedHospital, setSelectedHospital] = useState(hospitalId || "h3");
  const [username, setUsername] = useState("staff-access");
  const [password, setPassword] = useState("••••••••");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    switchHospital(selectedHospital);
    router.push("/partner/dashboard");
  };

  const handleQuickLogin = (hId: string) => {
    switchHospital(hId);
    router.push("/partner/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6">
      <Link href="/" className="flex items-center gap-3 mb-8">
        <Image
          src="/aerva-mark.png"
          alt="AERVA"
          width={40}
          height={26}
          className="h-9 w-auto object-contain"
        />
        <span className="font-black text-[#050B18] tracking-tight text-2xl">AER<span className="text-[#0052FF]">VA</span></span>
        <span className="text-[#0052FF] font-bold text-xs bg-blue-50 px-2.5 py-1 rounded-lg ml-1 border border-blue-100">
          HOSPITAL NETWORK
        </span>
      </Link>

      <div className="w-full max-w-4xl space-y-6">
        
        {/* Intro */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-[#050B18] mb-2">Hospital Operations Portal</h1>
          <p className="text-sm font-medium text-gray-500 max-w-lg mx-auto">
            Select your hospital station to monitor incoming pre-arrival emergencies, manage live ER/ICU capacity, and triage patients.
          </p>
        </div>

        {/* Hackathon Quick Hospital Selector Cards */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0052FF] bg-blue-50 px-2.5 py-1 rounded-md">
                DEMO LOGIN • SELECT HOSPITAL STATION
              </span>
              <h2 className="text-lg font-black text-[#050B18] mt-1">Available Hospital Portals</h2>
            </div>
            {state.status !== "IDLE" && state.status !== "CONFIRMED" && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" /> 1 Active Emergency
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_HOSPITALS.map((h) => {
              const hasIncoming = state.status !== "IDLE" && state.status !== "CONFIRMED" && state.hospitalId === h.id;
              const isSelected = selectedHospital === h.id;

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHospital(h.id)}
                  className={`rounded-2xl p-5 border-2 transition-all cursor-pointer relative ${
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

                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      hasIncoming ? "bg-red-100 text-red-600" : "bg-blue-100 text-[#0052FF]"
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-[#050B18] leading-tight">{h.name}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {h.specialists.slice(0, 2).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-xl text-center text-xs mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">ER Status</span>
                      <span className={`font-black ${h.capacity.erBeds.available > 0 ? "text-[#059669]" : "text-red-500"}`}>
                        {h.capacity.erBeds.available > 0 ? `${h.capacity.erBeds.available} Beds Free` : "Full"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">ICU Beds</span>
                      <span className="font-black text-[#050B18]">{h.capacity.icuBeds.available}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Wait Time</span>
                      <span className="font-black text-[#050B18]">~{h.erWaitTime}m</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin(h.id);
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm ${
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

          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <ShieldCheck className="w-4 h-4" /> AERVA Partner Hospital Federation
            </span>
            <span className="text-gray-400">
              Select any hospital station above to test dual-sided hospital triage in real time.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
