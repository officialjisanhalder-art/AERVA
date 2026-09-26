"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Radio, KeyRound, ArrowRight, UserCheck, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { reachService, DEMO_OPERATORS } from "@/lib/services/reachService";

export default function RelayOperatorLoginPage() {
  const router = useRouter();
  const [selectedOperatorId, setSelectedOperatorId] = useState(DEMO_OPERATORS[0].id);
  const [pinCode, setPinCode] = useState("8821");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      reachService.loginOperator(selectedOperatorId);
      router.push("/reach/relay");
    }, 600);
  };

  const handleQuickSelect = (opId: string, pin: string) => {
    setSelectedOperatorId(opId);
    setPinCode(pin);
  };

  return (
    <main className="min-h-screen bg-[#070D18] text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Top Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-400 text-xs font-black uppercase tracking-wider mb-4">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>NearER Reach Command</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Relay Operator Portal
          </h1>
          <p className="text-xs font-medium text-gray-400 mt-1.5">
            Secure clearance required for emergency call dispatch and hospital escalation
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Operator Selection */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
                Select Dispatcher Profile
              </label>
              <div className="space-y-2">
                {DEMO_OPERATORS.map((op) => {
                  const isSelected = selectedOperatorId === op.id;
                  const pin = op.id === "op-1" ? "8821" : "4410";

                  return (
                    <div
                      key={op.id}
                      onClick={() => handleQuickSelect(op.id, pin)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-950/40 border-[#0052FF] text-white shadow-md shadow-blue-500/10"
                          : "bg-gray-950/50 border-gray-800 text-gray-400 hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                          isSelected ? "bg-[#0052FF] text-white" : "bg-gray-800 text-gray-400"
                        }`}>
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{op.name}</p>
                          <p className="text-[11px] text-gray-400">{op.role} • {op.badgeId}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-950 px-2 py-0.5 rounded-md border border-blue-900">
                        PIN: {pin}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security PIN */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                Security Dispatcher PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  maxLength={6}
                  placeholder="Enter 4-digit PIN"
                  className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white font-mono tracking-widest text-center text-lg font-bold focus:outline-none focus:border-[#0052FF]"
                  required
                />
                <KeyRound className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 bg-[#0052FF] hover:bg-blue-600 disabled:opacity-50 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
            >
              {isLoading ? (
                <span>Authenticating Terminal...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authenticate & Access Relay Desk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Compliance notice */}
          <div className="mt-6 pt-5 border-t border-gray-800 text-center">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
              Authorized National Emergency Personnel Only. Live calls and location telemetry are encrypted under ISO-27001 medical standards.
            </p>
          </div>

        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/reach"
            className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            ← Return to NearER Reach Public Voice SOS
          </Link>
        </div>

      </div>
    </main>
  );
}
