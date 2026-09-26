"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const OrbSceneLazy = dynamic(() => import("../3d/OrbScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#0052FF]/20 border-t-[#0052FF] rounded-full animate-spin" />
    </div>
  ),
});

/* ─── Section ───────────────────────────────────────────────────── */
export function DecisionEngineSection() {
  return (
    <section className="py-32 bg-[#050B18] relative overflow-hidden text-white">
      {/* Background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#0052FF]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[#00B2FF] font-semibold text-sm tracking-widest uppercase mb-4">
            Decision Engine
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-black tracking-tight mb-5">
            More than just distance.
            <br />
            <span className="bg-gradient-to-r from-[#0052FF] to-[#00B2FF] bg-clip-text text-transparent">
              A smarter way to choose.
            </span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-gray-400 max-w-xl mx-auto text-lg">
            NearER analyses multiple real-time factors simultaneously to recommend the most suitable emergency destination.
          </motion.p>
        </div>

        {/* Center: 3D Orb with Orbiting Cards */}
        <div className="w-full max-w-[1000px] h-[550px] mx-auto relative">
          <OrbSceneLazy />
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none">
            <motion.div
              animate={{
                boxShadow: ["0 0 20px rgba(0,82,255,0.3)", "0 0 45px rgba(0,82,255,0.6)", "0 0 20px rgba(0,82,255,0.3)"],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="bg-gradient-to-r from-[#0052FF] to-[#003ACC] text-white px-8 py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase pointer-events-auto"
            >
              ↓ Best Destination
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}
