"use client";

import { useState, useEffect } from "react";
import { AppNavbar } from "@/components/app/AppNavbar";
import { 
  Clock, MapPin, Activity, ShieldCheck, ArrowRight, Loader2, 
  Star, Phone, ShieldAlert, AlertTriangle, Globe, ExternalLink, Sparkles, CheckCircle2, Search
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const CATEGORIES = ["Hospitals", "Pharmacies", "Diagnostics", "Blood Banks", "Ambulances"];

export default function NearbyPage() {
  const [activeCategory, setActiveCategory] = useState("Hospitals");
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 28.4595, lng: 77.0724 }); // Default: Delhi-NCR / Gurgaon
  const [attribution, setAttribution] = useState("Google Places API (New) & AERVA Verified Registry");
  // Active research tasks tracking map: hospitalId -> { status, taskId, liveUrl, stepCount }
  const [researchState, setResearchState] = useState<Record<string, { status: string; taskId?: string; liveUrl?: string | null }>>({});

  const handleStartResearch = async (hospitalId: string, hospitalName: string, address?: string) => {
    setResearchState((prev) => ({
      ...prev,
      [hospitalId]: { status: "RUNNING" },
    }));

    try {
      const res = await fetch(`/api/hospitals/${hospitalId}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalName, address }),
      });
      const data = await res.json();
      const taskId = data.taskId;

      if (!taskId) {
        setResearchState((prev) => ({ ...prev, [hospitalId]: { status: "FAILED" } }));
        return;
      }

      setResearchState((prev) => ({
        ...prev,
        [hospitalId]: { status: data.status || "RUNNING", taskId, liveUrl: data.liveUrl },
      }));

      // If cached or immediately finished
      if (data.cached && data.record) {
        updateHospitalWithResearch(hospitalId, data.record);
        setResearchState((prev) => ({
          ...prev,
          [hospitalId]: { status: "COMPLETED", taskId, liveUrl: data.liveUrl },
        }));
        return;
      }

      // Poll task progress
      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/hospitals/${hospitalId}/research/${taskId}`);
          if (pollRes.ok) {
            const taskData = await pollRes.json();
            if (taskData.status === "COMPLETED" || taskData.status === "FAILED") {
              clearInterval(pollInterval);
              setResearchState((prev) => ({
                ...prev,
                [hospitalId]: { status: taskData.status, taskId, liveUrl: taskData.live_url },
              }));
              if (taskData.status === "COMPLETED") {
                updateHospitalWithResearch(hospitalId, taskData);
              }
            }
          }
        } catch (pollErr) {
          console.warn("Polling error:", pollErr);
        }
      }, 3000);

      // Timeout safety after 45s
      setTimeout(() => clearInterval(pollInterval), 45000);
    } catch (err) {
      console.error("Research initiation failed:", err);
      setResearchState((prev) => ({ ...prev, [hospitalId]: { status: "FAILED" } }));
    }
  };

  const updateHospitalWithResearch = (hospitalId: string, record: any) => {
    setHospitals((prev) =>
      prev.map((h) => {
        const id = h.hospital_id || h.placeId;
        if (id === hospitalId) {
          return {
            ...h,
            website_research: {
              status: record.status,
              verification_label: record.verification_label,
              retrieved_at: record.retrieved_at,
              freshness_status: record.freshness_status,
              findings: record.findings,
              source_urls: record.source_urls,
              disclaimer: record.disclaimer,
              live_url: record.live_url,
            },
          };
        }
        return h;
      })
    );
  };

  // Auto-detect user geolocation
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    async function fetchNearby() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/hospitals/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=20000`);
        const data = await res.json();
        const list = data.results || data.hospitals || [];
        setHospitals(list);
        if (data.google_attribution || data.googleAttributionRequired) {
          setAttribution("Google Places API (New) & AERVA Healthcare Registry");
        }
      } catch (err) {
        console.error("Failed to fetch nearby places:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNearby();
  }, [activeCategory, userLocation.lat, userLocation.lng]);

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col h-screen overflow-hidden">
      <AppNavbar title="AERVA Healthcare Discovery" backTo="/" />

      {/* Filter Chips */}
      <div className="pt-20 pb-4 px-4 bg-white border-b border-gray-100 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-[#0052FF] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Map & Hospital Listings */}
      <div className="flex-1 relative flex flex-col">
        {/* Map Header Preview */}
        <div className="h-44 bg-blue-50 relative overflow-hidden shrink-0 border-b border-blue-100">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* User Location Marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-4 h-4 bg-[#0052FF] rounded-full border-2 border-white shadow-md" />
            </div>
            <span className="text-[10px] font-bold text-blue-900 bg-white/90 px-2 py-0.5 rounded shadow mt-1">
              Your Location
            </span>
          </div>

          <div className="absolute top-3 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] font-bold text-gray-700 shadow-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Google Places (New) Live Geofence
          </div>

          <div className="absolute bottom-2 right-4 text-[10px] text-gray-500 font-medium">
            {attribution}
          </div>
        </div>

        {/* Bottom Sheet List */}
        <div className="flex-1 bg-white flex flex-col relative z-10 overflow-hidden">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 shrink-0" />

          <div className="px-4 pb-3 flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-black text-[#050B18] text-lg">
                Verified Emergency Facilities
              </h2>
              <p className="text-xs text-gray-500">
                Discovered via Google Places & validated against AERVA telemetry
              </p>
            </div>
            <span className="text-xs font-bold text-[#0052FF] bg-blue-50 px-2.5 py-1 rounded-full">
              {hospitals.length} Found
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#0052FF]" />
                <p className="text-sm font-semibold">Discovering nearby hospitals via Google Places...</p>
              </div>
            ) : hospitals.length > 0 ? (
              hospitals.map((place, idx) => {
                const isVerifiedCurrent = place.verification_status === "AERVA_VERIFIED_CURRENT";
                const isVerifiedOutdated = place.verification_status === "AERVA_VERIFIED_OUTDATED";
                const isUnverified = place.verification_status === "UNVERIFIED";

                return (
                  <motion.div
                    key={place.hospital_id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-300 transition-colors shadow-xs flex flex-col"
                  >
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-[#050B18] text-base mb-1">
                          {place.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {place.distance_km} km • ~{place.eta_minutes} mins
                          </span>
                          {place.google_rating && (
                            <span className="flex items-center gap-1 text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-current" /> {place.google_rating} ({place.google_user_ratings_total || 0})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Verification Classification Badge */}
                      {isVerifiedCurrent && (
                        <div className="bg-emerald-50 border border-emerald-200 text-[#059669] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> AERVA Verified
                        </div>
                      )}
                      {isVerifiedOutdated && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Outdated Data
                        </div>
                      )}
                      {isUnverified && (
                        <div className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> Unverified
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-600 flex items-start gap-2 mb-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                      <span>{place.address}</span>
                    </div>

                    {/* Bed Capacity Strip — Zero fabrication for unverified */}
                    <div className="mt-2 py-2 px-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                      {isUnverified ? (
                        <span className="text-gray-500 italic flex items-center gap-1">
                          Resource availability unknown (facility unverified in AERVA telemetry)
                        </span>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 font-bold text-gray-800">
                            <Activity className="w-3.5 h-3.5 text-[#0052FF]" />
                            <span>ER Beds:</span>
                            <span className="text-[#059669] font-black">
                              {place.capacity?.er_beds_available ?? 0} open
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-gray-800">
                            <span>ICU:</span>
                            <span className="text-blue-700 font-black">
                              {place.capacity?.icu_beds_available ?? 0} open
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Status: <span className="text-emerald-700 font-bold">{place.capacity?.er_status || "OPEN"}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {place.phone_number && (
                      <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <a href={`tel:${place.phone_number}`} className="font-bold text-[#0052FF]">
                          {place.phone_number}
                        </a>
                      </div>
                    )}

                    {/* BROWSER USE CLOUD — Public Website Research & Verification Section */}
                    {(() => {
                      const hId = place.hospital_id || place.placeId;
                      const activeTask = researchState[hId];
                      const isTaskRunning = activeTask?.status === "RUNNING";
                      const research = place.website_research;
                      const hasResearch = Boolean(research && research.status === "COMPLETED");

                      return (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <Globe className="w-3.5 h-3.5 text-blue-600" />
                              <span>Public Website Information</span>
                              <span className="text-[10px] font-normal text-slate-400">(Browser Use Cloud)</span>
                            </div>

                            {/* Status Tag */}
                            {isTaskRunning ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Autonomous Researching...
                              </span>
                            ) : hasResearch ? (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" /> Website Info Found
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                Not Researched
                              </span>
                            )}
                          </div>

                          {/* Extracted Public Findings */}
                          {hasResearch ? (
                            <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                              <div className="flex flex-wrap gap-1.5 text-[11px]">
                                {research.findings?.listed_emergency_department && (
                                  <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium text-slate-700">
                                    🏥 Listed ER: <strong className="text-emerald-700">Yes</strong>
                                  </span>
                                )}
                                {research.findings?.listed_icu && (
                                  <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium text-slate-700">
                                    🛏️ Listed ICU: <strong className="text-emerald-700">Yes</strong>
                                  </span>
                                )}
                                {research.findings?.listed_ambulance && (
                                  <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium text-slate-700">
                                    🚑 Listed Ambulance: <strong className="text-emerald-700">Yes</strong>
                                  </span>
                                )}
                                {research.findings?.listed_oxygen && (
                                  <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium text-slate-700">
                                    💨 Listed Oxygen: <strong className="text-emerald-700">Yes</strong>
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-600 italic">
                                {research.findings?.facilities_summary}
                              </p>

                              {/* Clinical Warning */}
                              <div className="text-[10px] text-amber-800 bg-amber-50/80 border border-amber-200/60 p-1.5 rounded font-medium">
                                ⚠️ {research.disclaimer || "Public website information only. NOT confirmed live bed capacity or operational availability."}
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                                {research.source_urls && research.source_urls[0] ? (
                                  <a
                                    href={research.source_urls[0]}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                                  >
                                    Official Source <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <span>Source: Public Web Domain</span>
                                )}

                                {research.live_url && (
                                  <a
                                    href={research.live_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-purple-600 font-semibold hover:underline flex items-center gap-1"
                                  >
                                    Live Session Viewer <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] text-slate-500">
                                Official website facilities unverified. Research public portal via Browser Use Cloud.
                              </span>
                              <button
                                onClick={() => handleStartResearch(hId, place.name, place.address)}
                                disabled={isTaskRunning}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                              >
                                {isTaskRunning ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Researching...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                    <span>Research Website</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 font-medium">
                        Google Place ID: {place.google_place_id ? `${place.google_place_id.slice(0, 15)}...` : "Internal"}
                      </span>

                      <Link
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + place.address)}`}
                        target="_blank"
                        className="text-xs font-bold bg-[#0052FF] text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition"
                      >
                        Directions <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p>No hospitals found in this radius.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
