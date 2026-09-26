"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

function NetworkMap() {
  const nodes = [
    { x: 50, y: 50, label: "Hospital A", color: "#0052FF" },
    { x: 20, y: 30, label: "Hospital B", color: "#0052FF" },
    { x: 80, y: 25, label: "Hospital C", color: "#0052FF" },
    { x: 15, y: 65, label: "Blood Bank", color: "#DC2626" },
    { x: 85, y: 70, label: "Ambulance", color: "#10B981" },
    { x: 50, y: 82, label: "Gov Portal", color: "#7C3AED" },
    { x: 35, y: 15, label: "Diag Lab", color: "#D97706" },
    { x: 70, y: 50, label: "Clinic", color: "#0052FF" },
  ];

  const connections = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
    [1, 6], [2, 7], [3, 5], [4, 5],
  ];

  return (
    <div className="absolute inset-0 overflow-hidden opacity-40">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        {connections.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x} y1={nodes[a].y}
            x2={nodes[b].x} y2={nodes[b].y}
            stroke="#0052FF"
            strokeWidth="0.3"
            strokeOpacity="0.4"
          />
        ))}
        {nodes.map((node, i) => (
          <circle key={i} cx={node.x} cy={node.y} r="1.5" fill={node.color} opacity="0.6" />
        ))}
      </svg>
    </div>
  );
}

export function FinalCTASection() {
  return (
    <section className="relative min-h-[80vh] bg-[#050B18] flex items-center justify-center overflow-hidden">
      {/* Network background */}
      <NetworkMap />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050B18] via-[#050B18]/80 to-[#050B18]/60" />
      <div className="absolute inset-0 bg-gradient-radial from-[#0052FF]/10 via-transparent to-transparent" />
      
      {/* Center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0052FF]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo icon */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-10"
            style={{
              background: "radial-gradient(circle at 30% 30%, #1a5cff, #0036cc)",
              boxShadow: "0 0 60px rgba(0,82,255,0.4)",
            }}
          >
            <span className="text-white font-black text-4xl">+</span>
          </motion.div>

          <p className="text-[#00B2FF] font-semibold text-sm tracking-[0.2em] uppercase mb-6">
            Every minute matters
          </p>

          <h2 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Find the right care,
            <br />
            <span className="bg-gradient-to-r from-[#0052FF] to-[#00B2FF] bg-clip-text text-transparent">
              faster.
            </span>
          </h2>

          <p className="text-xl text-gray-400 mb-14 max-w-lg mx-auto">
            Don&apos;t just find the nearest hospital.{" "}
            <span className="text-white font-semibold">Find the right one.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group bg-[#0052FF] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-blue-500 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(0,82,255,0.5)] flex items-center justify-center gap-2">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white/8 border border-white/15 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/12 transition-all">
              Learn More
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
