"use client";

import { useState, useEffect } from "react";
import { AppNavbar } from "@/components/app/AppNavbar";
import { MOCK_HOSPITALS } from "@/lib/demo-data";
import { Clock, MapPin, Activity, ShieldCheck, ArrowRight, Loader2, Star, Phone } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const CATEGORIES = ["Hospitals", "Pharmacies", "Diagnostics", "Blood Banks", "Ambulances"];

export default function NearbyPage() {
  const [activeCategory, setActiveCategory] = useState("Hospitals");
  const [serpResults, setSerpResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 28.6139, lng: 77.2090 }); // Default: New Delhi, India

  useEffect(() => {
    async function fetchNearby() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/serp/nearby?q=${activeCategory}&lat=${userLocation.lat}&lng=${userLocation.lng}`);
        const data = await res.json();
        if (data.local_results) {
          setSerpResults(data.local_results);
        } else {
          setSerpResults([]);
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
      <AppNavbar title="Nearby Services" backTo="/" />

      {/* Filter Chips */}
      <div className="pt-20 pb-4 px-4 bg-white border-b border-gray-100 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
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

      {/* Map Mock & List */}
      <div className="flex-1 relative flex flex-col">
        {/* Mock Map Area */}
        <div className="flex-1 bg-blue-50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
          
          {/* User Location */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-4 h-4 bg-[#0052FF] rounded-full border-2 border-white shadow-md" />
            </div>
          </div>

          {/* SerpApi Locations Markers */}
          {serpResults.map((h, i) => (
            <div 
              key={i} 
              className={`absolute w-8 h-8 bg-white rounded-full shadow-lg border-2 flex items-center justify-center font-bold text-xs border-[#0052FF] text-[#0052FF]`}
              style={{
                top: `${30 + (i * 7) % 50}%`,
                left: `${20 + (i * 13) % 60}%`
              }}
            >
              <MapPin className="w-4 h-4" />
            </div>
          ))}
        </div>

        {/* Bottom Sheet List */}
        <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] h-[45%] flex flex-col relative z-10 shrink-0">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3" />
          
          <div className="px-4 pb-4 font-black text-[#050B18] text-lg">
            {activeCategory} near you
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#0052FF]" />
                <p>Finding best {activeCategory.toLowerCase()} via SerpApi...</p>
              </div>
            ) : serpResults.length > 0 ? (
              serpResults.map((place, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-300 transition-colors shadow-sm flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-[#050B18] mb-1">{place.title}</h3>
                    <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {place.type || activeCategory}</span>
                      {place.rating && (
                        <span className="flex items-center gap-1 text-amber-500"><Star className="w-3.5 h-3.5 fill-current" /> {place.rating} ({place.reviews} reviews)</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-[#EEF3FF] text-[#0052FF] text-[10px] font-bold px-2 py-1 rounded">Live Data</div>
                </div>
                
                <div className="mt-3 text-sm text-gray-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                  <span>{place.address}</span>
                </div>

                {place.phone && (
                  <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0 text-gray-400" />
                    <a href={`tel:${place.phone}`} className="font-bold text-[#0052FF]">{place.phone}</a>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className={`text-xs font-bold ${place.open_state?.includes('Open') ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {place.open_state || 'Hours not specified'}
                  </span>
                  
                  <Link 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.title + ' ' + place.address)}`}
                    target="_blank"
                    className="text-xs font-bold bg-[#0052FF] text-white px-4 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition"
                  >
                    Get Directions <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            ))) : (
              <div className="text-center text-gray-500 py-8 text-sm">
                No {activeCategory.toLowerCase()} found nearby via SerpApi.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
