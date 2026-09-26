"use client";

import { motion } from "framer-motion";
import { AlertCircle, Server, Building, MapPin, Share2, Ambulance } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { icon: AlertCircle, title: "Report Emergency", desc: "Select type & identify location." },
  { icon: Server, title: "Analyze in Real Time", desc: "NearER checks hospital data." },
  { icon: Building, title: "Get Best Hospital", desc: "Most appropriate destination." },
  { icon: MapPin, title: "Navigate", desc: "Route, traffic and ETA." },
  { icon: Share2, title: "Share & Notify", desc: "Share ETA and details." },
  { icon: Ambulance, title: "Reach Hospital", desc: "Complete the journey." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50/50 relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold text-brand-navy tracking-tight"
          >
            From emergency to the right care<br />
            <span className="text-brand-blue">in just a few steps.</span>
          </motion.h2>
        </div>

        <div className="relative">
          {/* Connecting Line (Background) */}
          <div className="absolute top-12 left-[10%] right-[10%] h-0.5 bg-gray-200 hidden lg:block" />
          
          {/* Animated Connecting Line */}
          <motion.div 
            initial={{ width: "0%" }}
            whileInView={{ width: "80%" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute top-12 left-[10%] h-0.5 bg-brand-blue hidden lg:block origin-left"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-24 h-24 rounded-2xl bg-white shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center justify-center mb-6 relative group-hover:-translate-y-2 transition-transform duration-300">
                    <Icon className="w-10 h-10 text-brand-blue" strokeWidth={1.5} />
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-brand-navy text-white text-sm font-bold flex items-center justify-center border-4 border-gray-50">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-brand-navy mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
