"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  UserCheck,
  Loader2,
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { useEmergencyState, useHospitalData } from "@/lib/demo-state";
import { AppNavbar } from "@/components/app/AppNavbar";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";
import { locationService } from "@/lib/services/locationService";

export default function NearbyHospitalsPage() {
  const router = useRouter();
  const { state, updateState } = useEmergencyState();
  const { hospitals: fallbackHospitals } = useHospitalData();
  const { lang } = useLang();
  const [viewMode, setViewMode] = useState<"MAP" | "LIST">("LIST");

  const userLat = state.location?.lat || 22.5804;
  const userLng = state.location?.lng || 88.4173;

  const [nearbyList, setNearbyList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");

  useEffect(() => {
    if (!state.location || (state.location.lat === 22.5804 && state.location.lng === 88.4173)) {
      locationService
        .getCurrentPosition()
        .then((geo) => {
          updateState({
            location: {
              lat: geo.latitude,
              lng: geo.longitude,
              area: geo.locality || "Current Location",
              city: geo.city || "Nearby Area",
            },
          });
        })
        .catch(async () => {
          const ipLoc = await locationService.getIpFallbackLocation();
          updateState({
            location: {
              lat: ipLoc.latitude,
              lng: ipLoc.longitude,
              area: ipLoc.locality || "Detected City",
              city: ipLoc.city || "Local",
            },
          });
        });
    }
  }, [state.location, updateState]);

  useEffect(() => {
    let isMounted = true;
    async function loadGeofenced() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/hospitals/nearby?lat=${userLat}&lng=${userLng}&radius=50000`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.results) && data.results.length > 0) {
            setNearbyList(data.results);
            if (!selectedHospitalId) {
              const firstId = data.results[0].hospital_id || data.results[0].placeId;
              setSelectedHospitalId(firstId);
            }
          }
        }
      } catch (err) {
        console.warn("[NearbyHospitals] Geofenced load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadGeofenced();
    return () => { isMounted = false; };
  }, [userLat, userLng]);

  // Format discovered facilities into display objects
  const displayHospitals = nearbyList.length > 0
    ? nearbyList.map((item) => {
        const isVerified =
          item.verification_status === "AERVA_VERIFIED_CURRENT" ||
          item.verificationStatus === "aerva_verified";
        const erBeds = item.resources?.generalBeds ?? item.capacity?.er_beds_available ?? null;
        const icuBeds = item.resources?.icuBeds ?? item.capacity?.icu_beds_available ?? null;

        return {
          id: item.hospital_id || item.placeId,
          name: item.name,
          address: item.address || "Discovered Emergency Facility",
          distance: item.distance_km ?? 2.5,
          eta: item.eta_minutes ?? 7,
          verified: isVerified,
          verificationStatus: item.verification_status || item.verificationStatus,
          lastUpdated: item.lastResourceUpdate ? "Recently updated" : "Unverified public listing",
          hasResources: isVerified && item.resources !== null,
          capacity: {
            erBeds: { available: erBeds, total: 20 },
            icuBeds: { available: icuBeds, total: 10 },
          },
          erWaitTime: isVerified ? 5 : 20,
          specialists: isVerified 
            ? ["Emergency Medicine", "Intensive Care", "Cardiology"] 
            : ["Emergency Care", "Trauma Triage"],
          bloodBank: { 
            "O+": isVerified ? "Available" : "Call to Verify", 
            "A+": isVerified ? "Available" : "Call to Verify",
            "B+": isVerified ? "Available" : "Call to Verify"
          },
          doctorInCharge: isVerified
            ? { name: "Dr. On-Duty Medical Registrar", designation: "Critical Care Specialist", shift: "Active Shift" }
            : undefined,
          notice: item.notice || "Resource availability unverified or outdated. Contact hospital directly.",
          googleMapsUri: item.googleMapsUri,
        };
      })
    : fallbackHospitals.map(h => ({
        ...h,
        address: h.address || "Salt Lake, Sector V, Kolkata",
        hasResources: true,
        verificationStatus: h.verified ? "AERVA_VERIFIED_CURRENT" : "UNVERIFIED",
        notice: "Hospital-reported availability; call to confirm before travel.",
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}`,
      }));

  const activeSelectedId = selectedHospitalId || displayHospitals[0]?.id || "h1";
  const selectedHospital = displayHospitals.find(h => h.id === activeSelectedId) || displayHospitals[0];

  const locationLabel = state.location 
    ? `${state.location.area}, ${state.location.city}`
    : "Detected Location Area";

  const handleSelectAndProceed = () => {
    if (selectedHospital) {
      updateState({ hospitalId: selectedHospital.id });
    }
    router.push("/emergency");
  };

  return (
    <>
      <AppNavbar title={t("hospitals.title", lang)} backTo="/emergency/location" />
      
      <main className="pt-20 pb-36 px-4 sm:px-6 max-w-3xl mx-auto">
        {/* Location Banner with 50km Geofence Indicator */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-[#059669] flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                50 KM Emergency Geofence Range
              </div>
              <div className="text-sm font-bold text-[#050B18]">{locationLabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/emergency/location"
              className="text-xs font-bold text-[#0052FF] hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors border border-blue-100"
            >
              Change
            </Link>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-green-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {displayHospitals.length} {t("hospitals.discovered", lang)}
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-[#050B18]">{t("hospitals.heading", lang)}</h2>
            <p className="text-xs text-gray-500 font-medium">Facilities within 50 km of your pin (verified vs public)</p>
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

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0052FF] mb-3" />
            <p className="text-sm font-bold text-gray-800">Scanning 50 km geofence for hospitals...</p>
            <p className="text-xs text-gray-400 mt-1">Cross-referencing live facilities with AERVA verified database</p>
          </div>
        ) : viewMode === "MAP" ? (
          /* Map / Radar View */
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

              {/* Radial Hospital Markers */}
              {displayHospitals.slice(0, 8).map((h, i) => {
                const positions = [
                  { top: "25%", left: "30%" },
                  { top: "28%", left: "72%" },
                  { top: "68%", left: "75%" },
                  { top: "65%", left: "22%" },
                  { top: "18%", left: "50%" },
                  { top: "50%", left: "82%" },
                  { top: "80%", left: "45%" },
                  { top: "45%", left: "15%" },
                ];
                const pos = positions[i % positions.length];
                const isSelected = h.id === activeSelectedId;

                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHospitalId(h.id)}
                    style={{ top: pos.top, left: pos.left }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center transition-transform hover:scale-110 cursor-pointer ${
                      isSelected ? "scale-110 z-40" : "opacity-85"
                    }`}
                  >
                    <div className={`px-2.5 py-1 rounded-xl font-bold text-xs shadow-lg flex items-center gap-1.5 border ${
                      isSelected 
                        ? "bg-[#0052FF] text-white border-white ring-4 ring-blue-500/30" 
                        : "bg-white/90 text-gray-900 border-white/50 backdrop-blur-md"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${h.verified ? "bg-green-500" : "bg-amber-500"}`} />
                      <span className="truncate max-w-[100px]">{h.name.split(" ")[0]}</span>
                      <span className="text-[10px] opacity-75 font-mono">{h.eta}m</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected hospital preview card below map */}
            {selectedHospital && (
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      {selectedHospital.verified ? (
                        <span className="flex items-center gap-1 text-[#059669] bg-green-50 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3.5 h-3.5" /> AERVA Verified Database
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3.5 h-3.5" /> Unverified (Public Listing)
                        </span>
                      )}
                      <span>•</span>
                      <span className="text-gray-400">{selectedHospital.lastUpdated}</span>
                    </div>
                    <h3 className="text-lg font-black text-[#050B18]">{selectedHospital.name}</h3>
                    <p className="text-xs text-gray-500 truncate max-w-sm mt-0.5">{selectedHospital.address}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-[#050B18]">{selectedHospital.eta} min</div>
                    <div className="text-xs text-gray-400 font-bold">{selectedHospital.distance} km away</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-center">
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">ER Status</div>
                    <div className={`text-xs font-black ${
                      selectedHospital.verified 
                        ? (selectedHospital.capacity.erBeds.available !== null && selectedHospital.capacity.erBeds.available > 0 ? "text-[#059669]" : "text-red-500")
                        : "text-amber-600"
                    }`}>
                      {selectedHospital.verified 
                        ? (selectedHospital.capacity.erBeds.available !== null && selectedHospital.capacity.erBeds.available > 0 ? `${selectedHospital.capacity.erBeds.available} Beds Free` : "ER Full")
                        : "Unverified"}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">ICU Capacity</div>
                    <div className="text-xs font-black text-[#050B18]">
                      {selectedHospital.verified && selectedHospital.capacity.icuBeds.available !== null
                        ? `${selectedHospital.capacity.icuBeds.available} Beds`
                        : "Unverified"}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Wait Time</div>
                    <div className="text-xs font-black text-[#050B18]">
                      {selectedHospital.verified ? `~${selectedHospital.erWaitTime} mins` : "Call Hospital"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {displayHospitals.map((h) => {
              const isSelected = h.id === activeSelectedId;
              const isErAvailable = h.capacity?.erBeds?.available !== null && h.capacity?.erBeds?.available > 0;

              return (
                <div 
                  key={h.id}
                  onClick={() => setSelectedHospitalId(h.id)}
                  className={`bg-white rounded-3xl border p-5 shadow-sm transition-all cursor-pointer ${
                    isSelected 
                      ? "border-[#0052FF] ring-2 ring-[#0052FF]/20 shadow-md" 
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {h.verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-green-50 text-[#059669] px-2 py-0.5 rounded-md">
                            <ShieldCheck className="w-3 h-3" /> AERVA Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3" /> Unverified Facility
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-medium">{h.lastUpdated}</span>
                      </div>
                      <h3 className="text-lg font-black text-[#050B18]">{h.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{h.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-black text-[#0052FF]">{h.eta} min</span>
                      <p className="text-xs text-gray-400 font-bold">{h.distance} km</p>
                    </div>
                  </div>

                  {/* Doctor in Charge banner (if verified) */}
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
                        {h.doctorInCharge.shift}
                      </span>
                    </div>
                  )}

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 my-3 p-3 bg-gray-50 rounded-2xl text-center">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">ER Beds</div>
                      <div className={`text-xs font-black ${
                        h.verified 
                          ? (isErAvailable ? "text-[#059669]" : "text-red-500") 
                          : "text-amber-600"
                      }`}>
                        {h.verified 
                          ? (isErAvailable ? `${h.capacity.erBeds.available} Available` : "No Beds")
                          : "Unverified"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">ICU Beds</div>
                      <div className="text-xs font-black text-[#050B18]">
                        {h.verified && h.capacity?.icuBeds?.available !== null 
                          ? `${h.capacity.icuBeds.available} Available` 
                          : "Unverified"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Wait Time</div>
                      <div className="text-xs font-black text-[#050B18]">
                        {h.verified ? `~${h.erWaitTime} mins` : "Call to Verify"}
                      </div>
                    </div>
                  </div>

                  {/* Unverified Clinical Disclaimer */}
                  {!h.verified && (
                    <div className="mb-3 p-2 bg-amber-50/60 border border-amber-100 rounded-xl text-[11px] text-amber-800 flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{h.notice}</span>
                    </div>
                  )}

                  {/* Specialists tags */}
                  <div className="mb-2">
                    <div className="flex flex-wrap gap-1.5">
                      {h.specialists.map((s: string, idx: number) => (
                        <span key={idx} className="text-[11px] font-semibold bg-blue-50 text-[#0052FF] px-2.5 py-0.5 rounded-lg">
                          {s}
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
            {lang === "hi" ? "AERVA इंटेलिजेंट मिलान:" : "AERVA Intelligent Geofencing:"}
          </span>{" "}
          {lang === "hi"
            ? "50 किमी दायरे के सभी अस्पतालों का विश्लेषण किया जाता है। वास्तविक क्षमता केवल सत्यापित अस्पतालों द्वारा रिपोर्ट की जाती है।"
            : "Scanning all facilities within the 50 km geofence. Confirmed resource availability is only displayed for verified database partners."}
        </div>
      </main>

      {/* Floating Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent z-40">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleSelectAndProceed}
            className="w-full bg-[#0052FF] text-white py-4 rounded-2xl font-bold text-base hover:bg-blue-600 active:scale-[0.99] transition-all shadow-[0_10px_30px_-10px_rgba(0,82,255,0.5)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {selectedHospital ? `Proceed to Emergency Intake` : t("hospitals.continue", lang)}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
