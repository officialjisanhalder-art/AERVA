"use client";

import { motion } from "framer-motion";
import { Activity, BedDouble, Wind, Users, Building2 } from "lucide-react";

/* ─── CSS Isometric Hospital ────────────────────────────────────── */
function HospitalIllustration() {
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden select-none">
      
      {/* Ambient glow */}
      <div className="absolute w-72 h-72 rounded-full bg-[#0052FF]/10 blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute w-40 h-40 rounded-full bg-[#10B981]/8 blur-2xl bottom-8 right-16 pointer-events-none" />

      {/* Orbit rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute w-80 h-80 rounded-full border border-dashed border-[#0052FF]/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        className="absolute w-56 h-56 rounded-full border border-dashed border-[#10B981]/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />

      {/* Floating hospital building */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex flex-col items-center"
      >
        {/* Glow cross above building */}
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative mb-3 w-10 h-10 flex items-center justify-center"
        >
          <div className="absolute w-9 h-2.5 rounded-full bg-[#0052FF] shadow-[0_0_20px_rgba(0,82,255,0.8),0_0_40px_rgba(0,82,255,0.3)]" />
          <div className="absolute w-2.5 h-9 rounded-full bg-[#0052FF] shadow-[0_0_20px_rgba(0,82,255,0.8),0_0_40px_rgba(0,82,255,0.3)]" />
        </motion.div>

        {/* Main building body */}
        <div className="relative flex items-end gap-2">
          
          {/* Left wing */}
          <div
            className="rounded-t-2xl flex-shrink-0"
            style={{
              width: "56px",
              height: "96px",
              background: "linear-gradient(160deg, #f4f7ff 0%, #dce8ff 100%)",
              border: "1px solid rgba(0,82,255,0.1)",
              boxShadow: "4px 6px 20px rgba(0,82,255,0.08), inset -1px -2px 8px rgba(0,82,255,0.04)",
            }}
          >
            <div className="grid grid-cols-2 gap-1 p-2 pt-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-3 rounded-sm" style={{ background: "rgba(0,82,255,0.12)" }} />
              ))}
            </div>
          </div>

          {/* Main tower */}
          <div
            className="rounded-t-3xl flex-shrink-0 relative"
            style={{
              width: "110px",
              height: "186px",
              background: "linear-gradient(160deg, #ffffff 0%, #eaf1ff 55%, #d6e5ff 100%)",
              border: "1px solid rgba(0,82,255,0.12)",
              boxShadow: "0 20px 50px rgba(0,82,255,0.12), 6px 8px 24px rgba(0,82,255,0.08), inset -2px -4px 12px rgba(0,82,255,0.04)",
            }}
          >
            {/* Windows */}
            <div className="absolute inset-x-3 top-5 grid grid-cols-3 gap-1.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{
                    height: "16px",
                    background: i % 5 === 0
                      ? "rgba(0,82,255,0.35)"
                      : i % 3 === 0
                      ? "rgba(0,82,255,0.18)"
                      : "rgba(180,210,255,0.55)",
                    border: "1px solid rgba(0,82,255,0.08)",
                  }}
                />
              ))}
            </div>

            {/* ER label */}
            <div className="absolute bottom-4 inset-x-0 flex justify-center">
              <div className="bg-[#0052FF]/8 border border-[#0052FF]/15 rounded-lg px-2 py-1">
                <span className="text-[9px] font-black text-[#0052FF] tracking-widest">HOSPITAL</span>
              </div>
            </div>
          </div>

          {/* Right wing */}
          <div
            className="rounded-t-2xl flex-shrink-0"
            style={{
              width: "48px",
              height: "72px",
              background: "linear-gradient(160deg, #edf3ff 0%, #d5e5ff 100%)",
              border: "1px solid rgba(0,82,255,0.1)",
              boxShadow: "4px 6px 20px rgba(0,82,255,0.07)",
            }}
          />
        </div>

        {/* Ground shadow */}
        <div
          className="mt-1 rounded-full"
          style={{
            width: "220px",
            height: "8px",
            background: "rgba(0,82,255,0.08)",
            filter: "blur(6px)",
          }}
        />
      </motion.div>

      {/* Floating data nodes */}
      {[
        { label: "ER", value: "Available", color: "#10B981", x: "-135px", y: "-50px", delay: 0 },
        { label: "ICU", value: "4 Beds",   color: "#0052FF", x: "115px",  y: "-70px", delay: 0.8 },
        { label: "Blood", value: "O+ Ready", color: "#EF4444", x: "-120px", y: "80px",  delay: 1.4 },
      ].map((node) => (
        <motion.div
          key={node.label}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: node.delay }}
          className="absolute bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2.5 flex items-center gap-2.5"
          style={{ left: `calc(50% + ${node.x})`, top: `calc(50% + ${node.y})` }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: node.color }} />
          <div>
            <p className="text-[9px] text-gray-400 font-semibold leading-none mb-0.5">{node.label}</p>
            <p className="text-[12px] font-black text-[#0A192F] leading-none">{node.value}</p>
          </div>
        </motion.div>
      ))}

      {/* Bottom badge */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0052FF] text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-[0_0_24px_rgba(0,82,255,0.35)] whitespace-nowrap">
        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
        NearER Partner Portal
      </div>
    </div>
  );
}

/* ─── Section ───────────────────────────────────────────────────── */
export function HospitalPartnerSection() {
  return (
    <section id="for-hospitals" className="py-32 bg-white border-t border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#EEF3FF] rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* Left: CSS Isometric Hospital */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl overflow-hidden relative"
            style={{
              height: "520px",
              background: "linear-gradient(135deg, #EEF3FF 0%, #F5F8FF 55%, #E8F0FF 100%)",
              border: "1px solid rgba(0,82,255,0.1)",
            }}
          >
            <HospitalIllustration />
          </motion.div>

          {/* Right: Text + Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[#0052FF] font-semibold text-sm tracking-widest uppercase mb-4">For Hospitals</p>
            <h2 className="text-4xl md:text-5xl font-black text-[#0A192F] tracking-tight mb-5">
              One network.{" "}
              <span className="text-[#0052FF]">Better emergency coordination.</span>
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-10">
              The NearER Partner Portal lets hospitals update live capacity in real time, so patients are always routed where they can be treated immediately.
            </p>

            {/* Dashboard card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_24px_64px_rgba(0,0,0,0.07)] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0052FF]" />
                  <span className="font-bold text-[#0A192F] text-sm">Live Capacity Dashboard</span>
                </div>
                <span className="text-[11px] bg-[#10B981]/10 text-[#10B981] font-bold px-3 py-1 rounded-full animate-pulse">
                  ● Connected
                </span>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {[
                  { icon: Activity,  label: "ER Beds",      value: "12 / 20", pct: 60,   color: "#0052FF" },
                  { icon: BedDouble, label: "ICU Beds",     value: "4 / 15",  pct: 26,   color: "#DC2626" },
                  { icon: Wind,      label: "Ventilators",  value: "8 / 10",  pct: 80,   color: "#10B981" },
                  { icon: Users,     label: "Trauma Team",  value: "On Duty", pct: null, color: "#10B981" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                    >
                      <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold mb-2">
                        <Icon className="w-3.5 h-3.5" /> {item.label}
                      </div>
                      <p className="text-xl font-black text-[#0A192F] mb-3">{item.value}</p>
                      {item.pct !== null ? (
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
