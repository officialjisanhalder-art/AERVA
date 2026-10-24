"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Map, 
  List, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Navigation2, 
  ArrowRight,
  UserCheck
} from "lucide-react";
import { useEmergencyState, useHospitalData } from "@/lib/demo-state";
import { AppNavbar } from "@/components/app/AppNavbar";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

export default function NearbyHospitalsPage() {
  const router = useRouter();
  const { state } = useEmergencyState();
  const { hospitals } = useHospitalData();
  const { lang } = useLang();
  const [viewMode, setViewMode] = useState<"MAP" | "LIST">("LIST");
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(hospitals[0]?.id || "h1");

  const locationLabel = state.location 
    ? `${state.location.area}, ${state.location.city}`
    : "Detected Location Area";

  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];

  return (
    <>
      <AppNavbar title={t("hospitals.title", lang)} backTo="/emergency/location" />
      
      <main className="pt-20 pb-36 px-4 sm:px-6 max-w-3xl mx-auto">
        {/* Location Banner */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-[#059669] flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t("hospitals.radius", lang)}</div>
              <div className="text-sm font-bold text-[#050B18]">{locationLabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-green-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {hospitals.length} {t("hospitals.discovered", lang)}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-[#050B18]">{t("hospitals.heading", lang)}</h2>
            <p className="text-xs text-gray-500 font-medium">{t("hospitals.subheading", lang)}</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setViewMode("LIST")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "LIST" 
                  ? "bg-white text-[#0052FF] shadow-sm" 
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <List className="w-3.5 h-3.5" /> {t("hospitals.list", lang)}
            </button>
            <button
              onClick={() => setViewMode("MAP")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "MAP" 
                  ? "bg-white text-[#0052FF] shadow-sm" 
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Map className="w-3.5 h-3.5" /> {t("hospitals.map", lang)}
            </button>
          </div>
        </div>

        {/* Map View */}
        {viewMode === "MAP" ? (
          <div className="space-y-4">
            <div 
              className="w-full h-80 rounded-3xl relative overflow-hidden shadow-sm border border-slate-700"
              style={{
                background: "#1e293b",
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
                backgroundSize: "24px 24px"
              }}
            >
              {/* Radar ring animation */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                {[120, 200, 280].map((size, idx) => (
                  <motion.div
                    key={idx}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3, delay: idx * 0.8 }}
                    style={{ width: size, height: size }}
                    className="absolute border border-blue-500/20 rounded-full"
                  />
                ))}
              </div>

              {/* User location pin in center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
                <div className="w-5 h-5 rounded-full bg-[#059669] border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span className="text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-md mt-1 backdrop-blur-sm whitespace-nowrap">
                  YOU ({locationLabel.split(",")[0]})
                </span>
              </div>

              {/* Mock Hospital Markers positioned radially */}
              {hospitals.map((h, i) => {
                const positions = [
                  { top: "25%", left: "30%" },
                  { top: "30%", left: "75%" },
                  { top: "70%", left: "70%" },
                  { top: "65%", left: "20%" },
                ];
                const pos = positions[i % positions.length];
                const isSelected = h.id === selectedHospitalId;

                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHospitalId(h.id)}
                    style={{ top: pos.top, left: pos.left }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center transition-transform hover:scale-110 ${
                      isSelected ? "scale-110" : "opacity-85"
                    }`}
                  >
                    <div className={`px-2.5 py-1 rounded-xl font-bold text-xs shadow-lg flex items-center gap-1.5 border ${
                      isSelected 
                        ? "bg-[#0052FF] text-white border-white ring-4 ring-blue-500/30" 
                        : "bg-white/90 text-gray-900 border-white/50 backdrop-blur-md"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${h.capacity.erBeds.available > 0 ? "bg-green-500" : "bg-red-500"}`} />
                      {h.name.split(" ")[0]}
                      <span className="text-[10px] opacity-75 font-mono">{h.eta}m</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected hospital preview card below map */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0052FF] mb-1">
                    {selectedHospital.verified ? (
                      <span className="flex items-center gap-1 text-[#059669]"><ShieldCheck className="w-3.5 h-3.5" /> AERVA Verified</span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500"><AlertTriangle className="w-3.5 h-3.5" /> Unverified Feed</span>
                    )}
                    <span>•</span>
                    <span className="text-gray-400">{selectedHospital.lastUpdated}</span>
                  </div>
                  <h3 className="text-lg font-black text-[#050B18]">{selectedHospital.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-[#050B18]">{selectedHospital.eta} min</div>
                  <div className="text-xs text-gray-400 font-bold">{selectedHospital.distance} km away</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-center">
                <div className="bg-gray-50 p-2.5 rounded-xl">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">ER Status</div>
                  <div className={`text-xs font-black ${selectedHospital.capacity.erBeds.available > 0 ? "text-[#059669]" : "text-red-500"}`}>
                    {selectedHospital.capacity.erBeds.available > 0 ? `${selectedHospital.capacity.erBeds.available} Beds Free` : "ER Full"}
                  </div>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">ICU Capacity</div>
                  <div className="text-xs font-black text-[#050B18]">{selectedHospital.capacity.icuBeds.available} Beds</div>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Wait Time</div>
                  <div className="text-xs font-black text-[#050B18]">~{selectedHospital.erWaitTime} mins</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {hospitals.map((h) => {
              const isErAvailable = h.capacity.erBeds.available > 0;
              return (
                <div 
                  key={h.id}
                  className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:border-[#0052FF]/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        {h.verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-green-50 text-[#059669] px-2 py-0.5 rounded-md">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3" /> Unverified
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-medium">Updated {h.lastUpdated}</span>
                      </div>
                      <h3 className="text-lg font-black text-[#050B18]">{h.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-[#0052FF]">{h.eta} min</span>
                      <p className="text-xs text-gray-400 font-bold">{h.distance} km</p>
                    </div>
                  </div>

                  {/* Doctor in Charge banner */}
                  {h.doctorInCharge && (
                    <div className="mb-3 p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-[#050B18]">
                          {h.doctorInCharge.name}
                        </span>
                        <span className="text-[10px] text-emerald-800 font-medium hidden sm:inline">
                          ({h.doctorInCharge.designation})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md font-semibold">
                        {h.doctorInCharge.shift.split(" ")[0]} Shift
                      </span>
                    </div>
                  )}

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 my-3 p-3 bg-gray-50 rounded-2xl">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">ER Beds</div>
                      <div className={`text-xs font-black ${isErAvailable ? "text-[#059669]" : "text-red-500"}`}>
                        {isErAvailable ? `${h.capacity.erBeds.available} Available` : "No Beds"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">ICU Beds</div>
                      <div className="text-xs font-black text-[#050B18]">
                        {h.capacity.icuBeds.available} Available
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Wait Time</div>
                      <div className="text-xs font-black text-[#050B18]">
                        ~{h.erWaitTime} mins
                      </div>
                    </div>
                  </div>

                  {/* Specialists tags */}
                  <div className="mb-3">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">On-Duty Specialists</div>
                    <div className="flex flex-wrap gap-1.5">
                      {h.specialists.map((s, idx) => (
                        <span key={idx} className="text-[11px] font-semibold bg-blue-50 text-[#0052FF] px-2.5 py-0.5 rounded-lg">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Blood Availability dots */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                    <span className="font-bold text-gray-400 text-[11px] uppercase">Blood Bank:</span>
                    <div className="flex gap-2">
                      {Object.entries(h.bloodBank).slice(0, 3).map(([type, status]) => (
                        <span key={type} className="flex items-center gap-1 font-semibold text-[11px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            status === "Available" ? "bg-green-500" : status === "Limited" ? "bg-amber-500" : "bg-red-500"
                          }`} />
                          {type}: {status}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Guidance notice */}
        <div className="mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-900 leading-relaxed">
          <span className="font-bold text-[#0052FF]">
            {lang === "hi" ? "AERVA इंटेलिजेंट मिलान:" : "AERVA Intelligent Matching:"}
          </span>{" "}
          {lang === "hi"
            ? "निकटतम अस्पताल हमेशा सबसे अच्छा नहीं होता। डिसीजन इंजन विशेषज्ञता, लाइव क्षमता और ईटीए का विश्लेषण करता है।"
            : "Nearest hospital is not always best. The Decision Engine will analyze capability, live capacity, travel ETA, and blood availability to match your specific emergency."}
        </div>
      </main>

      {/* Floating Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent z-40">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push("/emergency")}
            className="w-full bg-[#0052FF] text-white py-4 rounded-2xl font-bold text-base hover:bg-blue-600 active:scale-[0.99] transition-all shadow-[0_10px_30px_-10px_rgba(0,82,255,0.5)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {t("hospitals.continue", lang)}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
