"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Radio, AlertTriangle, Phone, MapPin, Volume2, CheckCircle2, Clock, ArrowRight, ShieldCheck, UserCheck, RefreshCw, Zap, LogOut, Lock } from "lucide-react";
import Link from "next/link";
import { reachService, RuralSosCase, OperatorSession } from "@/lib/services/reachService";

export default function RelayOperatorDashboard() {
  const router = useRouter();
  const [operator, setOperator] = useState<OperatorSession | null>(null);
  const [cases, setCases] = useState<RuralSosCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [isEscalating, setIsEscalating] = useState(false);

  const loadCases = async () => {
    const list = await reachService.getAllCases();
    setCases(list);
    if (!selectedCaseId && list.length > 0) {
      setSelectedCaseId(list[0].caseId);
    }
  };

  useEffect(() => {
    const currentOp = reachService.getCurrentOperator();
    if (!currentOp) {
      router.push("/reach/login");
      return;
    }
    setOperator(currentOp);
    loadCases();
  }, []);

  const handleLogout = () => {
    reachService.logoutOperator();
    router.push("/reach/login");
  };

  const currentCase = cases.find((c) => c.caseId === selectedCaseId) || cases[0];

  // Auto-escalation countdown simulation for PENDING alert
  useEffect(() => {
    if (!currentCase || currentCase.status === "ACKNOWLEDGED" || currentCase.status === "COMPLETED") {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger auto-escalation
          handleAutoEscalate();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentCase?.caseId, currentCase?.status]);

  const handleAutoEscalate = async () => {
    if (!currentCase || isEscalating) return;
    setIsEscalating(true);
    await reachService.escalateCase(
      currentCase.caseId,
      "NO_RESPONSE timeout: Facility did not acknowledge within 30s SLA window"
    );
    await loadCases();
    setCountdown(30);
    setIsEscalating(false);
  };

  const handleAcknowledge = async () => {
    if (!currentCase) return;
    await reachService.acknowledgeAlert(currentCase.caseId);
    await loadCases();
  };

  const handleManualEscalate = async () => {
    if (!currentCase) return;
    setIsEscalating(true);
    await reachService.triggerManualEscalation(
      currentCase.caseId,
      "Operator observed high regional traffic or specialized trauma equipment requirement"
    );
    await loadCases();
    setCountdown(30);
    setIsEscalating(false);
  };

  return (
    <main className="min-h-screen bg-[#070D18] text-white p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Desk Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-800 gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0052FF] flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">
                  AERVA Reach • Relay Operator Desk
                </h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  LIVE RADAR
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Emergency call relay center for keypad and non-internet basic phone calls
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 bg-gray-900 border border-gray-800 px-3.5 py-2 rounded-xl text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="font-black text-gray-200 leading-tight">
                  {operator?.name || "Priya Sharma"} ({operator?.badgeId || "OP-8821"})
                </p>
                <p className="text-[10px] text-gray-400 font-semibold">{operator?.role || "Lead Relay Dispatcher"}</p>
              </div>
            </div>

            <Link
              href="/reach"
              className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 border border-gray-700 transition-colors"
            >
              + Simulate Call
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-xs font-black text-rose-300 border border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Desk</span>
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Left Column: Live Queue (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                Incoming Rural SOS Queue ({cases.length})
              </h3>
              <button
                type="button"
                onClick={loadCases}
                className="text-[11px] font-bold text-blue-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {cases.map((c) => {
                const isSelected = c.caseId === currentCase?.caseId;
                const isPending = c.status === "FACILITY_ALERTED" || c.status === "ESCALATING";

                return (
                  <div
                    key={c.caseId}
                    onClick={() => {
                      setSelectedCaseId(c.caseId);
                      setCountdown(30);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gray-900 border-[#0052FF] shadow-lg shadow-blue-500/10"
                        : "bg-gray-900/60 border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-white">{c.caseId}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          c.status === "ACKNOWLEDGED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : isPending
                            ? "bg-rose-950 text-rose-400 border border-rose-800 animate-pulse"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-gray-300 truncate">
                      {c.reportedLocationText}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {c.emergencySummary}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 mt-3 pt-2.5 border-t border-gray-800">
                      <span>{c.callerNumber}</span>
                      <span className="text-blue-400 font-semibold">{c.selectedFacilityName || "Searching..."}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Case Deep Dive & Action Hub (8 cols) */}
          {currentCase ? (
            <div className="lg:col-span-8 space-y-6">
              
              {/* Active Alert Banner & SLA Countdown */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900 to-[#0A1526] border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                      Alert Dispatched to {currentCase.selectedFacilityName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Hospital has 30 seconds to acknowledge before auto-escalating to next facility.
                  </p>
                </div>

                {currentCase.status !== "ACKNOWLEDGED" && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">SLA Escalation In</span>
                      <p className="text-2xl font-black text-rose-400">{countdown}s</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAcknowledge}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      ✓ Acknowledge (Demo)
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoEscalate}
                      className="px-3 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      ⚡ Escalate Now
                    </button>
                  </div>
                )}

                {currentCase.status === "ACKNOWLEDGED" && (
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-400 text-xs font-black flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Facility Confirmed Intake</span>
                  </span>
                )}
              </div>

              {/* Case Details & Caller Info */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
                  <span className="text-[10px] font-black uppercase text-gray-500">Case Identifier</span>
                  <p className="text-xl font-black text-white mt-1">{currentCase.caseId}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
                  <span className="text-[10px] font-black uppercase text-gray-500">Caller Number</span>
                  <p className="text-xl font-black text-emerald-400 mt-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{currentCase.callerNumber}</span>
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
                  <span className="text-[10px] font-black uppercase text-gray-500">Dialect & Language</span>
                  <p className="text-base font-black text-white mt-1.5">{currentCase.language}</p>
                </div>
              </div>

              {/* Spoken Voice Recordings Player */}
              <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    <span>Original Caller Voice Transcripts & Recordings</span>
                  </h4>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md">
                    Audio Preserved
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Location audio */}
                  <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
                    <p className="text-xs font-black text-gray-300 mb-1">
                      1. "Where are you?" (Kahan hain aap?)
                    </p>
                    <p className="text-xs text-gray-400 italic mb-3">
                      "{currentCase.reportedLocationText}"
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-950/40 border border-blue-900/60 p-2.5 rounded-lg">
                      <Volume2 className="w-4 h-4 shrink-0" />
                      <span>Original Audio Verified (00:04)</span>
                    </div>
                  </div>

                  {/* Emergency audio */}
                  <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
                    <p className="text-xs font-black text-gray-300 mb-1">
                      2. "What happened?" (Kya hua hai?)
                    </p>
                    <p className="text-xs text-gray-400 italic mb-3">
                      "{currentCase.emergencySummary}"
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-400 bg-purple-950/40 border border-purple-900/60 p-2.5 rounded-lg">
                      <Volume2 className="w-4 h-4 shrink-0" />
                      <span>Original Audio Verified (00:06)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Geocoder & Adaptive Radius */}
              <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Geocoding Resolution & Adaptive Search Radius</span>
                </h4>
                <div className="grid sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
                    <span className="text-gray-500 font-bold block mb-1">Resolved Coordinates</span>
                    <span className="font-mono text-gray-200">
                      {currentCase.resolvedLatitude?.toFixed(4)}, {currentCase.resolvedLongitude?.toFixed(4)}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
                    <span className="text-gray-500 font-bold block mb-1">Confidence Score</span>
                    <span className="font-bold text-emerald-400 uppercase">
                      ✓ {currentCase.locationConfidence}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
                    <span className="text-gray-500 font-bold block mb-1">Adaptive Radius</span>
                    <span className="font-bold text-blue-400">
                      {currentCase.searchRadiusKm} km (Expanded)
                    </span>
                  </div>
                </div>
              </div>

              {/* Escalation Audit History */}
              <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Escalation Timeline & Facility Handoffs
                  </h4>
                  <button
                    type="button"
                    onClick={handleManualEscalate}
                    className="text-xs font-bold text-rose-400 hover:text-rose-300 underline"
                  >
                    + Trigger Manual Escalation
                  </button>
                </div>

                {currentCase.escalations.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">
                    No escalations required. Primary facility responding within SLA parameters.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentCase.escalations.map((esc, i) => (
                      <div key={i} className="p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-300">
                            Escalated from <span className="text-rose-400">{esc.fromHospitalName}</span> → <span className="text-emerald-400">{esc.toHospitalName}</span>
                          </p>
                          <p className="text-gray-500 text-[11px] mt-0.5">{esc.reason}</p>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">{esc.createdAt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="lg:col-span-8 text-center py-24 text-gray-500">
              No rural SOS cases currently active. Click "+ Simulate Call" to test.
            </div>
          )}

        </div>

      </div>
    </main>
  );
}
