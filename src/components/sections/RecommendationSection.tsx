"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Navigation, Zap, Shield, TrendingUp } from "lucide-react";

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px]">
      {/* Phone Shell */}
      <div
        className="relative rounded-[44px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.25)]"
        style={{
          background: "linear-gradient(145deg, #1a1a2e 0%, #0d0d1a 100%)",
          padding: "12px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Screen */}
        <div className="relative rounded-[36px] overflow-hidden bg-white" style={{ aspectRatio: "9/19" }}>
          {/* Status bar */}
          <div className="absolute top-0 inset-x-0 h-8 bg-[#0A192F] flex items-center justify-between px-5 z-10">
            <span className="text-white text-[10px] font-bold">9:41</span>
            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full" />
            <div className="w-6 h-3 border border-white/60 rounded-sm" />
          </div>

          {/* Nav header */}
          <div className="bg-[#0A192F] pt-9 pb-5 px-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold text-sm">Navigation</span>
              <span className="text-[10px] bg-[#10B981] text-white font-bold px-2 py-0.5 rounded-full uppercase">Live</span>
            </div>
            <p className="text-white text-2xl font-black">8 min <span className="text-sm font-normal text-white/60">| 1.8 km</span></p>
            <p className="text-[#00B2FF] text-[11px] mt-1 font-medium">Fastest Route • Live Traffic</p>
          </div>

          {/* Map area */}
          <div className="relative bg-[#EEF2F7] flex-1" style={{ height: "320px" }}>
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-40" style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }} />

            {/* Road lines */}
            <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-white/80" />
            <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-white/80" />

            {/* Route SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 320" preserveAspectRatio="none">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {/* Shadow route */}
              <path d="M 80 90 C 80 160 200 200 200 280" fill="none" stroke="rgba(0,82,255,0.2)" strokeWidth="12" strokeLinecap="round" />
              {/* Main route */}
              <path d="M 80 90 C 80 160 200 200 200 280" fill="none" stroke="#0052FF" strokeWidth="6" strokeLinecap="round" filter="url(#glow)" />
            </svg>

            {/* User pin */}
            <div className="absolute top-[26%] left-[27%] w-4 h-4 bg-[#0A192F] rounded-full border-2 border-white shadow-lg">
              <div className="absolute inset-0.5 rounded-full bg-white" />
            </div>

            {/* Hospital pin */}
            <div className="absolute bottom-[16%] right-[24%] flex flex-col items-center">
              <div className="w-9 h-9 bg-[#0052FF] rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(0,82,255,0.5)] border-2 border-white">
                <span className="text-white font-black text-base">+</span>
              </div>
              <div className="w-2 h-2 bg-[#0052FF] rotate-45 -mt-1 shadow-md" />
            </div>

            {/* Bottom destination card */}
            <div className="absolute bottom-3 inset-x-3 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3 border border-gray-100">
              <div className="w-9 h-9 bg-[#EEF3FF] rounded-xl flex items-center justify-center flex-shrink-0">
                <Navigation className="w-4 h-4 text-[#0052FF]" />
              </div>
              <div>
                <p className="font-bold text-[#0A192F] text-xs">Apollo City Hospital</p>
                <p className="text-[10px] text-gray-400">Main Entrance · ER Wing</p>
              </div>
              <div className="ml-auto">
                <ArrowRight className="w-4 h-4 text-[#0052FF]" />
              </div>
            </div>
          </div>
        </div>

        {/* Phone side buttons */}
        <div className="absolute -right-[3px] top-28 w-[3px] h-16 bg-gray-700 rounded-r" />
        <div className="absolute -left-[3px] top-24 w-[3px] h-10 bg-gray-700 rounded-l" />
        <div className="absolute -left-[3px] top-36 w-[3px] h-10 bg-gray-700 rounded-l" />
      </div>

      {/* Phone shadow */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-10 bg-[#0052FF]/10 rounded-full blur-2xl" />
    </div>
  );
}

export function RecommendationSection() {
  return (
    <section className="py-32 bg-gradient-to-b from-white to-slate-50/60 relative overflow-hidden">
      {/* Decorative background blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#0052FF]/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#0052FF] font-semibold text-sm tracking-widest uppercase mb-4"
          >
            Hospital Recommendation
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-[#0A192F] tracking-tight mb-5"
          >
            See what matters.
            <br />
            <span className="text-[#0052FF]">Make informed decisions.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 max-w-xl mx-auto text-lg"
          >
            Live hospital status, capacity and specialist availability — before you start moving.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-12 items-center">

          {/* Left: Result Card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="bg-white rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.08)] border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-[#0052FF] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  ✦ Best Match
                </span>
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  Live Verified · Just now
                </div>
              </div>

              <h3 className="text-3xl font-black text-[#0A192F] mb-1">Apollo City Hospital</h3>
              <p className="text-gray-400 text-sm mb-8">Multi-Speciality Emergency Centre</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#EEF3FF] rounded-2xl p-5">
                  <p className="text-xs font-semibold text-[#0052FF] mb-2 uppercase tracking-wider">Travel Time</p>
                  <p className="text-3xl font-black text-[#0A192F]">8 min</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5">
                  <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Distance</p>
                  <p className="text-3xl font-black text-[#0A192F]">1.8 km</p>
                </div>
              </div>

              <div className="space-y-4 mb-8 pb-8 border-b border-gray-100">
                {[
                  { label: "ER Availability", value: "Available" },
                  { label: "ICU Beds", value: "4 Available" },
                  { label: "Relevant Specialist", value: "On Duty" },
                  { label: "Blood (O+)", value: "In Stock" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2.5 text-gray-600 font-medium text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      {label}
                    </span>
                    <span className="text-sm font-bold text-[#0A192F]">{value}</span>
                  </div>
                ))}
              </div>

              <button className="w-full bg-[#0052FF] text-white py-4 rounded-2xl font-bold text-base hover:bg-blue-600 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,82,255,0.3)] flex items-center justify-center gap-2 group">
                <Navigation className="w-4 h-4" />
                Navigate Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Center: Phone */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring", stiffness: 60 }}
            className="hidden lg:block"
          >
            <PhoneMockup />
          </motion.div>

          {/* Right: Feature cards */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-4"
          >
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#EEF3FF] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-5 h-5 text-[#0052FF]" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0A192F] mb-1">Navigate with confidence.</h4>
                  <p className="text-sm text-gray-500 mb-4">Real-time routing with live traffic updates.</p>
                  <div className="space-y-2">
                    {["Live traffic updates", "Alternate routes", "ETA updates", "Offline fallback"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0052FF]" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0A192F] p-6 rounded-3xl shadow-[0_8px_30px_rgba(10,25,47,0.2)]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-[#00B2FF]" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Real-time Matching</h4>
                  <p className="text-sm text-gray-400">Decision Engine analyses 6 live factors to match you to the right care.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#10B981]/10 border border-[#10B981]/20 p-6 rounded-3xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#10B981]/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0A192F] mb-1">Verified Data</h4>
                  <p className="text-sm text-gray-500">All hospital data is cross-verified through multiple trusted sources.</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
