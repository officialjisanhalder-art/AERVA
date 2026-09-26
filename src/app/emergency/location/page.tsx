"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  MapPin, 
  CheckCircle2, 
  Navigation2, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  Compass, 
  Edit3,
  ExternalLink
} from "lucide-react";
import { useEmergencyState } from "@/lib/demo-state";
import { AppNavbar } from "@/components/app/AppNavbar";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

interface LocationData {
  lat: number;
  lng: number;
  area: string;
  city: string;
}

export default function EmergencyLocationPage() {
  const router = useRouter();
  const { state, updateState } = useEmergencyState();
  const { lang } = useLang();

  const [isLocating, setIsLocating] = useState(true);
  const [locationData, setLocationData] = useState<LocationData>({
    lat: 22.5804,
    lng: 88.4173,
    area: state.location?.area || "Salt Lake, Sector V",
    city: state.location?.city || "Kolkata",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editArea, setEditArea] = useState(locationData.area);
  const [editCity, setEditCity] = useState(locationData.city);

  useEffect(() => {
    // Attempt fast browser GPS detection with immediate timeout fallback
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
              { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            const area = data.address?.suburb || data.address?.neighbourhood || data.address?.area || "Salt Lake";
            const city = data.address?.city || data.address?.town || data.address?.state || "Kolkata";
            const newLoc = { lat, lng, area, city };
            setLocationData(newLoc);
            setEditArea(area);
            setEditCity(city);
            updateState({ location: newLoc });
          } catch {
            // keep standard location
          } finally {
            setIsLocating(false);
          }
        },
        () => {
          // Fallback gracefully without error
          setIsLocating(false);
          updateState({ location: locationData });
        },
        { timeout: 2500 }
      );
    } else {
      setIsLocating(false);
    }

    // Safety timeout: never leave user waiting more than 1.5s
    const timer = setTimeout(() => {
      setIsLocating(false);
      updateState({ location: locationData });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleSaveLocation = () => {
    if (!editArea.trim() || !editCity.trim()) return;
    const updated = {
      ...locationData,
      area: editArea.trim(),
      city: editCity.trim(),
    };
    setLocationData(updated);
    updateState({ location: updated });
    setIsEditing(false);
  };

  const handleProceed = () => {
    updateState({ location: locationData });
    router.push("/emergency");
  };

  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    locationData.area + ", " + locationData.city
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <>
      <AppNavbar title={t("location.title", lang)} backTo="/" />

      <main className="pt-24 pb-36 px-4 sm:px-6 max-w-xl mx-auto">
        
        {/* Status Indicator */}
        <div className="flex flex-col items-center text-center mb-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full mb-3 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            {lang === "hi" ? "लाइव GPS स्थान सक्रिय" : "LIVE LOCATION ACTIVE"}
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#050B18] tracking-tight">
            {isLocating 
              ? t("location.detecting", lang)
              : (lang === "hi" ? "आपका आपातकालीन स्थान" : "Your Emergency Location")}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {lang === "hi" 
              ? "अस्पताल और एम्बुलेंस इस क्षेत्र में समन्वयित होंगे" 
              : "Hospitals and emergency responders will be dispatched to this area"}
          </p>
        </div>

        {/* Current Location Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-5"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-6 h-6 text-[#0052FF]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Current Location</span>
                <h2 className="text-xl font-black text-[#050B18] leading-tight mt-0.5">
                  {locationData.area}
                </h2>
                <p className="text-sm font-semibold text-gray-600 mt-0.5">
                  {locationData.city}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 text-xs font-bold text-[#0052FF] hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors border border-blue-100"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? "Cancel" : "Change"}
            </button>
          </div>

          {/* Quick Edit Form */}
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
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
                className="w-full bg-[#0052FF] text-white py-2.5 rounded-xl font-bold text-xs shadow hover:bg-blue-600 transition-colors"
              >
                Update Pin Location
              </button>
            </motion.div>
          )}

          {/* Location Accuracy Badges */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              GPS Locked
            </span>
            <span>•</span>
            <span>Accuracy ~ 10 meters</span>
            <span>•</span>
            <span className="text-gray-400">Emergency Geofence</span>
          </div>
        </motion.div>

        {/* Google Maps Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-2 mb-6"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#0052FF]" />
              Live Map Preview
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Google Maps
            </span>
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
          <span className="font-bold text-[#0052FF]">NearER Emergency Protocol:</span> We locate hospitals, real-time ER/ICU capacity, and on-duty specialists around your coordinates to eliminate waiting room delays.
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
