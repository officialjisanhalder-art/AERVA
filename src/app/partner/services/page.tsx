"use client";

import { useState } from "react";
import { Stethoscope, HeartPulse, Brain, Flame, Baby, Bone } from "lucide-react";

const INITIAL_SERVICES = [
  { id: 1, name: "Cardiology", icon: HeartPulse, active: true },
  { id: 2, name: "Neurology", icon: Brain, active: true },
  { id: 3, name: "Trauma & Orthopedics", icon: Bone, active: true },
  { id: 4, name: "Burn Unit", icon: Flame, active: false },
  { id: 5, name: "Pediatrics ER", icon: Baby, active: true },
  { id: 6, name: "General Surgery", icon: Stethoscope, active: true },
];

export default function ServicesPage() {
  const [services, setServices] = useState(INITIAL_SERVICES);

  const toggleService = (id: number) => {
    setServices(services.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#050B18]">ER & Services Status</h1>
        <p className="text-sm font-medium text-gray-500">Toggle active specialist teams</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc) => (
          <div key={svc.id} className={`p-5 rounded-3xl border-2 transition-all cursor-pointer ${svc.active ? 'bg-white border-[#0052FF] shadow-[0_8px_30px_rgba(0,82,255,0.1)]' : 'bg-gray-50 border-gray-200'}`} onClick={() => toggleService(svc.id)}>
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${svc.active ? 'bg-blue-50 text-[#0052FF]' : 'bg-gray-200 text-gray-500'}`}>
                <svc.icon className="w-6 h-6" />
              </div>
              <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${svc.active ? 'bg-[#0052FF]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${svc.active ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>
            <h3 className={`font-bold text-lg ${svc.active ? 'text-[#050B18]' : 'text-gray-500'}`}>{svc.name}</h3>
            <span className={`text-xs font-bold uppercase tracking-wider ${svc.active ? 'text-[#0052FF]' : 'text-gray-400'}`}>
              {svc.active ? 'Specialist On Duty' : 'Unavailable'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
