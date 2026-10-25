"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  Compass, 
  Edit3,
  ExternalLink,
  AlertCircle,
  Radio,
  LocateFixed
} from "lucide-react";
import { useEmergencyState } from "@/lib/demo-state";
import { AppNavbar } from "@/components/app/AppNavbar";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";
import { locationService, GeoLocation } from "@/lib/services/locationService";

interface LocationData {
  lat: number;
  lng: number;
  area: string;
  city: string;
  accuracy?: number;
  source?: GeoLocation["source"];
}

export default function EmergencyLocationPage() {
  const router = useRouter();
  const { state, updateState } = useEmergencyState();
  const { lang } = useLang();

  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData>({
    lat: state.location?.lat || 22.5804,
    lng: state.location?.lng || 88.4173,
    area: state.location?.area || "Salt Lake, Sector V",
    city: state.location?.city || "Kolkata",
    accuracy: 10,
    source: "gps_high_accuracy",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editArea, setEditArea] = useState(locationData.area);
  const [editCity, setEditCity] = useState(locationData.city);

  const fetchLiveLocation = async (forceHighAccuracy = false) => {
    setIsLocating(true);
    setErrorMsg(null);
    try {
      const geo = await locationService.getCurrentPosition({ forceHighAccuracy });
      const updated: LocationData = {
        lat: geo.latitude,
        lng: geo.longitude,
        area: geo.locality || "Current Location",
        city: geo.city || "Detected City",
        accuracy: geo.accuracy,
        source: geo.source,
      };
      setLocationData(updated);
      setEditArea(updated.area);
      setEditCity(updated.city);
      updateState({
        location: {
          lat: updated.lat,
          lng: updated.lng,
          area: updated.area,
          city: updated.city,
        },
      });
    } catch (err: any) {
      console.warn("[AERVA GPS] Detection error:", err);
      setErrorMsg(
        err?.message || "Location access was blocked or unavailable. You can edit your area below or tap Recalibrate."
      );
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    // If no existing saved location, auto-detect immediately
    if (!state.location || (state.location.lat === 22.5804 && state.location.lng === 88.4173)) {
      fetchLiveLocation(false);
    } else {
      // Sync with pre-existing state
      setLocationData({
        lat: state.location.lat,
        lng: state.location.lng,
        area: state.location.area,
        city: state.location.city,
        source: "gps_high_accuracy",
      });
      setEditArea(state.location.area);
      setEditCity(state.location.city);
    }
  }, []);

  const handleSaveLocation = () => {
    if (!editArea.trim() || !editCity.trim()) return;
    const updated: LocationData = {
      ...locationData,
      area: editArea.trim(),
      city: editCity.trim(),
    };
    setLocationData(updated);
    updateState({
      location: {
        lat: updated.lat,
        lng: updated.lng,
        area: updated.area,
        city: updated.city,
      },
    });
    setIsEditing(false);
  };

  const handleProceed = () => {
    updateState({
      location: {
        lat: locationData.lat,
        lng: locationData.lng,
        area: locationData.area,
        city: locationData.city,
      },
    });
    router.push("/emergency");
  };

  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${locationData.lat},${locationData.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${locationData.lat},${locationData.lng}`;

  return (
    <>
      <AppNavbar title={t("location.title", lang)} backTo="/" />

      <main className="pt-24 pb-36 px-4 sm:px-6 max-w-xl mx-auto">
        {/* Status Indicator */}
        <div className="flex flex-col items-center text-center mb-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full mb-3 shadow-sm ${
              locationData.source === "ip_approximate"
                ? "text-amber-800 bg-amber-50 border border-amber-200"
                : "text-[#059669] bg-emerald-50 border border-emerald-200"
            }`}
          >
            {isLocating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0052FF]" />
                <span>{lang === "hi" ? "GPS लॉक किया जा रहा है..." : "LOCKING LIVE GPS..."}</span>
              </>
            ) : locationData.source === "ip_approximate" ? (
              <>
                <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>ESTIMATED CITY LOCATION</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span>{lang === "hi" ? "लाइव GPS स्थान सक्रिय" : "LIVE GPS LOCKED"}</span>
              </>
            )}
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#050B18] tracking-tight">
            {isLocating 
              ? t("location.detecting", lang)
              : (lang === "hi" ? "आपका आपातकालीन स्थान" : "Your Emergency Location")}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {lang === "hi" 
              ? "अस्पताल और एम्बुलेंस इस क्षेत्र में समन्वयित होंगे" 
              : "Hospitals and emergency responders will be dispatched to this exact pin"}
          </p>
        </div>

        {/* Error Alert if Location Access Blocked */}
        {errorMsg && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">GPS Notification: </span>
              {errorMsg}
            </div>
          </div>
        )}

        {/* Current Location Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-6 h-6 text-[#0052FF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Current Pin Location</span>
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                    {locationData.lat.toFixed(4)}°, {locationData.lng.toFixed(4)}°
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#050B18] leading-tight mt-0.5">
                  {locationData.area}
                </h2>
                <p className="text-sm font-semibold text-gray-600 mt-0.5">
                  {locationData.city}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => fetchLiveLocation(true)}
                disabled={isLocating}
                title="Recalibrate GPS with high accuracy"
                className="flex items-center gap-1 text-xs font-bold text-[#0052FF] hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors border border-blue-100 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
                <span>{isLocating ? "Locating..." : "Recalibrate"}</span>
              </button>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-xl transition-colors border border-gray-200"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? "Cancel" : "Edit"}</span>
              </button>
            </div>
          </div>

          {/* Quick Edit Form */}
          <AnimatePresence>
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-100 space-y-3"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    placeholder="e.g. Salt Lake, Sector V"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Kolkata"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF] focus:bg-white"
                  />
                </div>
                <button
                  onClick={handleSaveLocation}
                  className="w-full bg-[#0052FF] text-white py-2.5 rounded-xl font-bold text-xs shadow hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  Update Pin Location
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Location Accuracy Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {locationData.source === "ip_approximate" ? "City Approximate" : "GPS Satellite Locked"}
            </span>
            <span>•</span>
            <span>Accuracy ~ ±{Math.round(locationData.accuracy || 10)}m</span>
            <span>•</span>
            <span className="text-gray-400">Emergency Geofence Active</span>
          </div>
        </motion.div>

        {/* Google Maps Live Coordinates Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-2 mb-6"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#0052FF]" />
              Exact Coordinates Map Pin
            </span>
            <a
              href={googleMapsExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-[#0052FF] hover:underline flex items-center gap-1"
            >
              Open in Google Maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          <div className="w-full h-56 rounded-2xl overflow-hidden relative border border-gray-100">
            <iframe
              title="Current Location Google Map"
              src={googleMapsEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
            />
          </div>
        </motion.div>

        {/* Helper Note */}
        <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed">
          <span className="font-bold text-[#0052FF]">AERVA Emergency Protocol:</span> We locate hospitals, real-time ER/ICU capacity, and on-duty specialists around your coordinates to eliminate waiting room delays.
        </div>
      </main>

      {/* Floating Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent z-40">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleProceed}
            className="w-full bg-[#0052FF] text-white py-4 rounded-2xl font-bold text-base hover:bg-blue-600 active:scale-[0.99] transition-all shadow-[0_10px_30px_-10px_rgba(0,82,255,0.5)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {t("location.btn.proceed", lang)}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
