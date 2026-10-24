"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin, Activity, CheckCircle2, Navigation, AlertTriangle, ShieldCheck, User, Building, HeartPulse, Brain, Droplets, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

const QUICK_EMERGENCIES = [
  { id: "cardiac", labelKey: "emergency.cardiac", label: "Chest Pain / Heart", icon: HeartPulse, color: "text-rose-600 bg-rose-50 border-rose-100 hover:border-rose-300" },
  { id: "stroke", labelKey: "emergency.stroke", label: "Stroke / Numbness", icon: Brain, color: "text-purple-600 bg-purple-50 border-purple-100 hover:border-purple-300" },
  { id: "trauma", labelKey: "emergency.trauma", label: "Accident / Trauma", icon: Droplets, color: "text-amber-600 bg-amber-50 border-amber-100 hover:border-amber-300" },
  { id: "respiratory", labelKey: "emergency.respiratory", label: "Severe Breathing", icon: Stethoscope, color: "text-blue-600 bg-blue-50 border-blue-100 hover:border-blue-300" },
];

export function HeroSection() {
  const { lang } = useLang();

  return (
    <section id="home" className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-gradient-to-b from-[#F6F9FD] via-white to-white">
      {/* Subtle background glow & dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#0052FF_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.12] pointer-events-none" />
      <div className="absolute -top-32 right-1/4 w-96 h-96 bg-[#0052FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Clear, Focused Messaging & Action */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Live Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full border border-blue-200/80 bg-blue-50/80 text-[#0052FF] mb-6 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-[#0052FF] animate-pulse" />
              <span className="font-bold text-xs tracking-wider uppercase">
                {t("hero.badge", lang)}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[62px] font-extrabold text-[#050B18] leading-[1.06] tracking-[-0.035em] mb-6"
            >
              {t("hero.title1", lang)}{" "}
              <span className="bg-gradient-to-r from-[#0052FF] via-[#0066FF] to-[#0084FF] bg-clip-text text-transparent">
                {t("hero.title2", lang)}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed tracking-[-0.015em] mb-8 max-w-xl"
            >
              {t("hero.subtitle", lang)}
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 mb-8 w-full sm:w-auto"
            >
              <Link href="/emergency" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#0052FF] hover:bg-blue-600 text-white font-black text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all cursor-pointer">
                  <span>🚨</span>
                  <span>{t("hero.btn.emergency", lang)}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>

              <Link href="/patient" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-gray-50 text-[#050B18] font-bold text-base border border-gray-200 shadow-sm transition-all cursor-pointer">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{t("hero.btn.passport", lang)}</span>
                </button>
              </Link>

              <Link href="/partner" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-gray-50 text-gray-600 hover:text-[#050B18] font-bold text-base border border-gray-200 shadow-sm transition-all cursor-pointer">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>{t("hero.btn.partner", lang)}</span>
                </button>
              </Link>
            </motion.div>

            {/* Quick Emergency Category Selector */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-full pt-6 border-t border-gray-100"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                {t("hero.quickSelect", lang)}:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {QUICK_EMERGENCIES.map((q) => {
                  const Icon = q.icon;
                  return (
                    <Link
                      key={q.id}
                      href={`/emergency?type=${q.id}`}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${q.color} shadow-xs hover:shadow-sm`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{t(q.labelKey, lang) || q.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>

          </div>

          {/* Right Column: High-Trust Decision Engine Card */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="w-full max-w-md bg-white rounded-3xl border border-gray-200/80 shadow-[0_20px_50px_rgba(0,82,255,0.07)] p-6 relative overflow-hidden"
            >
              {/* Top Banner inside card */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black tracking-wider text-emerald-700 uppercase">
                    Live Verified Match
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                  Decision Engine
                </span>
              </div>

              {/* Hospital Title */}
              <div className="mb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#050B18]">Apollo City Hospital</h3>
                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      Sector 44, Gurgaon • 1.8 km away
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-black">
                      ER OPEN
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-3.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Transit ETA</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-[#050B18]">7</span>
                    <span className="text-xs font-bold text-gray-500">mins (Google Maps)</span>
                  </div>
                </div>
                <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-3.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">ER Beds Available</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-emerald-600">4</span>
                    <span className="text-xs font-bold text-gray-500">of 12 ready</span>
                  </div>
                </div>
              </div>

              {/* Verified Checklist */}
              <div className="space-y-2 mb-6 bg-blue-50/50 border border-blue-100/60 rounded-2xl p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-blue-900 mb-2">
                  Decision Engine Verification:
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>On-Duty Cardiologist Confirmed</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>2 ICU Trauma Beds Reserved</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Blood Bank: O+ & O- in stock</span>
                </div>
              </div>

              {/* Founder Insight Callout */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl mb-6">
                <p className="text-[11px] font-semibold text-amber-900 leading-tight">
                  <span className="font-bold">Why not nearest clinic (2 min)?</span> Clinic has 0 ICU beds and no cardiac team. AERVA avoids a fatal secondary transfer.
                </p>
              </div>

              {/* Navigation Action Button */}
              <Link href="/emergency">
                <button className="w-full py-3.5 px-4 bg-[#050B18] hover:bg-[#0052FF] text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md">
                  <Navigation className="w-4 h-4" />
                  <span>Open Live Emergency Routing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

            </motion.div>
          </div>

        </div>

        {/* Bottom Trust Indicators */}
        <div className="mt-16 pt-8 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052FF] shrink-0 font-black">
              ⚡
            </div>
            <div>
              <p className="text-sm font-black text-[#050B18]">&lt; 10s Match Time</p>
              <p className="text-xs text-gray-500 font-medium">Instant hospital capacity checks</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 font-black">
              🏥
            </div>
            <div>
              <p className="text-sm font-black text-[#050B18]">100% Live Verified</p>
              <p className="text-xs text-gray-500 font-medium">Beds, specialists & blood stock</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 font-black">
              🧭
            </div>
            <div>
              <p className="text-sm font-black text-[#050B18]">Google Maps Driving</p>
              <p className="text-xs text-gray-500 font-medium">Real-time traffic route guidance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 font-black">
              🛡️
            </div>
            <div>
              <p className="text-sm font-black text-[#050B18]">Zero Emergency Delay</p>
              <p className="text-xs text-gray-500 font-medium">Pre-alerts ER team before arrival</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
