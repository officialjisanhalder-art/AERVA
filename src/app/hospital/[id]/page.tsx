"use client";

import { useParams } from "next/navigation";
import { AppNavbar } from "@/components/app/AppNavbar";
import { useHospitalData } from "@/lib/demo-state";
import { Navigation2, Clock, MapPin, ShieldCheck, ShieldAlert, Activity, Users, Droplet, Stethoscope, UserCheck } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HospitalDetailsPage() {
  const params = useParams();
  const hospitalId = typeof params?.id === "string" ? params.id : "h1";
  const { currentHospital: hospital } = useHospitalData(hospitalId);

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <AppNavbar title="Hospital Details" backTo="/emergency" />
      
      <main className="pt-24 pb-32 px-4 sm:px-6 max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6"
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {hospital.verified ? (
              <span className="flex items-center gap-1 text-[#059669] text-xs font-bold bg-[#059669]/10 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4" />
                LIVE VERIFIED
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-500 text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-full">
                <ShieldAlert className="w-4 h-4" />
                UNVERIFIED
              </span>
            )}
            <span className="flex items-center gap-1 text-gray-500 text-xs font-bold bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full ml-auto">
              Updated {hospital.lastUpdated}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#050B18] mb-4">{hospital.name}</h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 font-medium pb-6 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#D97706]" /> {hospital.eta} min ETA
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {hospital.distance} km away
            </span>
          </div>

          {/* Doctor in Charge / Duty Lead */}
          {hospital.doctorInCharge && (
            <div className="mt-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-700" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    Emergency Doctor in Charge on Duty
                  </span>
                </div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  hospital.doctorInCharge.onDuty ? "bg-emerald-200 text-emerald-900" : "bg-gray-200 text-gray-700"
                }`}>
                  {hospital.doctorInCharge.onDuty ? "ON ACTIVE DUTY" : "SHIFT OFF"}
                </span>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                  DR
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#050B18]">{hospital.doctorInCharge.name}</h3>
                  <p className="text-xs font-bold text-emerald-800 mt-0.5">
                    {hospital.doctorInCharge.designation} • {hospital.doctorInCharge.specialty}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {hospital.doctorInCharge.qualification}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-gray-500 mt-2 bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span>Reg: {hospital.doctorInCharge.registrationNumber}</span>
                    <span>•</span>
                    <span>Shift: {hospital.doctorInCharge.shift}</span>
                    <span>•</span>
                    <span className="text-[#0052FF] font-bold">Ext: {hospital.doctorInCharge.phoneExtension}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Emergency Status */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-wider mb-3">
                <Activity className="w-4 h-4" /> Emergency Status
              </div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-gray-700">ER Beds</span>
                <span className="font-bold text-[#050B18]">{hospital.capacity.erBeds.available} / {hospital.capacity.erBeds.total}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-gray-700">Wait Time</span>
                <span className="font-bold text-[#D97706]">{hospital.erWaitTime} mins</span>
              </div>
            </div>

            {/* ICU & Ventilators */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-wider mb-3">
                <Users className="w-4 h-4" /> ICU Capacity
              </div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-gray-700">ICU Beds</span>
                <span className="font-bold text-[#050B18]">{hospital.capacity.icuBeds.available} / {hospital.capacity.icuBeds.total}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-gray-700">Ventilators</span>
                <span className="font-bold text-[#050B18]">{hospital.capacity.ventilators.available} / {hospital.capacity.ventilators.total}</span>
              </div>
            </div>

            {/* Specialists */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 sm:col-span-2">
              <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-wider mb-3">
                <Stethoscope className="w-4 h-4" /> Specialists on Duty
              </div>
              <div className="flex flex-wrap gap-2">
                {hospital.specialists.map(spec => (
                  <span key={spec} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm font-semibold text-[#050B18]">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Blood Bank */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 sm:col-span-2">
              <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-wider mb-3">
                <Droplet className="w-4 h-4" /> Blood Availability
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(hospital.bloodBank).map(([group, status]) => (
                  <div key={group} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                    <span className="font-black text-red-500">{group}</span>
                    <span className={`text-xs font-bold ${status === 'Available' ? 'text-green-600' : status === 'Limited' ? 'text-amber-600' : 'text-gray-400'}`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      </main>

      {/* Floating Action Button */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent z-40"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-3xl mx-auto">
          <Link 
            href={`/navigation/${hospital.id}`}
            className="w-full bg-[#0052FF] text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-600 transition-colors shadow-[0_10px_30px_-10px_rgba(0,82,255,0.5)] flex items-center justify-center gap-2"
          >
            <Navigation2 className="w-5 h-5 fill-white" />
            Start Navigation
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
