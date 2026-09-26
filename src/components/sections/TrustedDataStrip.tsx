"use client";

import { motion } from "framer-motion";
import { Building2, Droplet, Landmark, Truck, ActivitySquare, ShieldCheck } from "lucide-react";
import { AlertCircle, Server, Building, MapPin, Share2, Ambulance } from "lucide-react";

const sources = [
  { icon: Building2, label: "Hospitals" },
  { icon: Droplet, label: "Blood Banks" },
  { icon: Landmark, label: "Government Portals" },
  { icon: Truck, label: "Ambulance Networks" },
  { icon: ActivitySquare, label: "Diagnostic Labs" },
  { icon: ShieldCheck, label: "On-Ground Verification" },
];

const steps = [
  { icon: AlertCircle, num: "01", title: "Report Emergency", desc: "Select the emergency type. Your location is identified automatically." },
  { icon: Server, num: "02", title: "Analyze in Real Time", desc: "NearER checks live hospital capacity, specialists and blood availability." },
  { icon: Building, num: "03", title: "Get Best Hospital", desc: "The most appropriate destination is recommended instantly." },
  { icon: MapPin, num: "04", title: "Navigate", desc: "Get the fastest route with live traffic and accurate ETA." },
  { icon: Share2, num: "05", title: "Share & Notify", desc: "Share your ETA and hospital details with your emergency contact." },
  { icon: Ambulance, num: "06", title: "Reach Hospital", desc: "Arrive at the right hospital with the right care ready." },
];

export function TrustedDataStrip() {
  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="container mx-auto px-6">
        <p className="text-center text-xs font-bold text-gray-300 tracking-[0.2em] uppercase mb-10">
          Trusted data from multiple sources
        </p>
        <div className="flex flex-wrap justify-center gap-10 md:gap-20">
          {sources.map((source, i) => {
            const Icon = source.icon;
            return (
              <motion.div
                key={source.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -3 }}
                className="flex flex-col items-center gap-3 group cursor-default"
              >
                <div className="w-11 h-11 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-[#EEF3FF] group-hover:border-[#0052FF]/20 transition-all">
                  <Icon className="w-5 h-5 text-gray-300 group-hover:text-[#0052FF] transition-colors" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-semibold text-gray-400 group-hover:text-[#0A192F] transition-colors">
                  {source.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 bg-gray-50/50 relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#0052FF] font-semibold text-sm tracking-widest uppercase mb-4"
          >
            How It Works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-[#0A192F] tracking-tight"
          >
            From emergency to the right care
            <br />
            <span className="text-[#0052FF]">in just a few steps.</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-white rounded-3xl p-7 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,82,255,0.08)] hover:border-[#0052FF]/20 transition-all hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-[#EEF3FF] rounded-2xl flex items-center justify-center group-hover:bg-[#0052FF] transition-colors">
                    <Icon className="w-5 h-5 text-[#0052FF] group-hover:text-white transition-colors" strokeWidth={1.5} />
                  </div>
                  <span className="text-3xl font-black text-gray-100 group-hover:text-[#0052FF]/10 transition-colors">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#0A192F] mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
