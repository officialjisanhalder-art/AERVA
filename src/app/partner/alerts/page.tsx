"use client";

import { AlertTriangle, Clock, MapPin } from "lucide-react";

import { useState } from "react";

export default function AlertsPage() {
  const [hasActiveAlert, setHasActiveAlert] = useState(true);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-black text-[#050B18]">Emergency Alerts</h1>
      
      <div className="space-y-4">
        {/* Active Alert */}
        {hasActiveAlert && (
          <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-2xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-widest animate-pulse">ACTIVE</span>
                <h3 className="font-bold text-red-900 text-lg">Cardiac Emergency</h3>
              </div>
              <span className="text-sm font-bold text-red-700 flex items-center gap-1"><Clock className="w-4 h-4" /> ETA: 8 mins</span>
            </div>
            <p className="text-red-800/80 text-sm font-medium mb-4">Patient requires Cardiology team on arrival.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setHasActiveAlert(false)}
                className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
              >
                Acknowledge
              </button>
              <button className="bg-red-100 text-red-700 px-5 py-2 rounded-xl font-bold text-sm hover:bg-red-200 transition-colors">View Details</button>
            </div>
          </div>
        )}

        {/* Past Alert */}
        <div className="bg-white border border-gray-200 p-5 rounded-2xl opacity-70">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="bg-gray-200 text-gray-600 text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-widest">RESOLVED</span>
              <h3 className="font-bold text-[#050B18] text-lg">Severe Trauma</h3>
            </div>
            <span className="text-sm font-bold text-gray-400 flex items-center gap-1">2 hours ago</span>
          </div>
          <p className="text-gray-500 text-sm font-medium">Patient arrived and admitted to ER Bed 3.</p>
        </div>
      </div>
    </div>
  );
}
