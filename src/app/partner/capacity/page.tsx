"use client";

import { Users, Bed, Activity, CheckCircle2, Building2, UserCheck, Stethoscope, Clock, Phone, ShieldCheck, AlertCircle, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePartnerHospital, useHospitalData } from "@/lib/demo-state";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

export default function CapacityPage() {
  const { hospitalId, switchHospital } = usePartnerHospital();
  const { hospitals, currentHospital, updateCapacity, updateDoctor } = useHospitalData(hospitalId);
  const { lang } = useLang();

  // Local form state initialized from currentHospital
  const [erAvailable, setErAvailable] = useState<number>(currentHospital.capacity.erBeds.available);
  const [erTotal, setErTotal] = useState<number>(currentHospital.capacity.erBeds.total);

  const [icuAvailable, setIcuAvailable] = useState<number>(currentHospital.capacity.icuBeds.available);
  const [icuTotal, setIcuTotal] = useState<number>(currentHospital.capacity.icuBeds.total);

  const [ventsAvailable, setVentsAvailable] = useState<number>(currentHospital.capacity.ventilators.available);
  const [ventsTotal, setVentsTotal] = useState<number>(currentHospital.capacity.ventilators.total);

  const [otAvailable, setOtAvailable] = useState<number>(currentHospital.capacity.otRooms.available);
  const [otTotal, setOtTotal] = useState<number>(currentHospital.capacity.otRooms.total);

  // Doctor in Charge local state
  const [docName, setDocName] = useState<string>(currentHospital.doctorInCharge.name);
  const [docSpecialty, setDocSpecialty] = useState<string>(currentHospital.doctorInCharge.specialty);
  const [docDesignation, setDocDesignation] = useState<string>(currentHospital.doctorInCharge.designation);
  const [docQualification, setDocQualification] = useState<string>(currentHospital.doctorInCharge.qualification);
  const [docRegNo, setDocRegNo] = useState<string>(currentHospital.doctorInCharge.registrationNumber);
  const [docShift, setDocShift] = useState<string>(currentHospital.doctorInCharge.shift);
  const [docExt, setDocExt] = useState<string>(currentHospital.doctorInCharge.phoneExtension);
  const [docOnDuty, setDocOnDuty] = useState<boolean>(currentHospital.doctorInCharge.onDuty);

  const [isSaved, setIsSaved] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Synchronize when active hospital changes
  useEffect(() => {
    setErAvailable(currentHospital.capacity.erBeds.available);
    setErTotal(currentHospital.capacity.erBeds.total);
    setIcuAvailable(currentHospital.capacity.icuBeds.available);
    setIcuTotal(currentHospital.capacity.icuBeds.total);
    setVentsAvailable(currentHospital.capacity.ventilators.available);
    setVentsTotal(currentHospital.capacity.ventilators.total);
    setOtAvailable(currentHospital.capacity.otRooms.available);
    setOtTotal(currentHospital.capacity.otRooms.total);

    setDocName(currentHospital.doctorInCharge.name);
    setDocSpecialty(currentHospital.doctorInCharge.specialty);
    setDocDesignation(currentHospital.doctorInCharge.designation);
    setDocQualification(currentHospital.doctorInCharge.qualification);
    setDocRegNo(currentHospital.doctorInCharge.registrationNumber);
    setDocShift(currentHospital.doctorInCharge.shift);
    setDocExt(currentHospital.doctorInCharge.phoneExtension);
    setDocOnDuty(currentHospital.doctorInCharge.onDuty);
  }, [currentHospital.id]);

  const handleSave = () => {
    updateCapacity(currentHospital.id, {
      erBeds: { available: erAvailable, total: erTotal },
      icuBeds: { available: icuAvailable, total: icuTotal },
      ventilators: { available: ventsAvailable, total: ventsTotal },
      otRooms: { available: otAvailable, total: otTotal },
    });

    updateDoctor(currentHospital.id, {
      name: docName,
      specialty: docSpecialty,
      designation: docDesignation,
      qualification: docQualification,
      registrationNumber: docRegNo,
      shift: docShift,
      phoneExtension: docExt,
      onDuty: docOnDuty,
    });

    setIsSaved(true);
    setLastSavedTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    setTimeout(() => {
      setIsSaved(false);
    }, 4000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header & Hospital Station Switcher */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#0052FF] px-2.5 py-0.5 rounded-md">
              LIVE RESOURCE ENGINE
            </span>
            {lastSavedTime && (
              <span className="text-xs text-gray-400 font-medium">
                Last broadcast: {lastSavedTime}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#050B18]">
            {t("capacity.title", lang)}
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            Changes immediately alter the NearER routing algorithm weights & patient admissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Station Selector */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-200">
            <Building2 className="w-4 h-4 text-[#0052FF]" />
            <select
              value={hospitalId}
              onChange={(e) => switchHospital(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#050B18] outline-none cursor-pointer"
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="bg-[#0052FF] hover:bg-blue-600 active:scale-95 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {t("capacity.save", lang)}
          </button>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {isSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-sm">{t("capacity.saved", lang)}</div>
                <div className="text-xs text-white/80">{t("capacity.broadcasted", lang)} ({currentHospital.name})</div>
              </div>
            </div>
            <span className="text-xs bg-white/20 font-mono font-bold px-2 py-1 rounded-md">
              LIVE SYNCED
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capacity Cards Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#050B18] flex items-center gap-2">
            <Bed className="w-5 h-5 text-[#0052FF]" />
            Live Bed & Equipment Inventory
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Increases or decreases recalculate NearER triage scores immediately
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CapacityCard
            title={t("capacity.erBeds", lang)}
            icon={Activity}
            available={erAvailable}
            total={erTotal}
            onAvailableChange={setErAvailable}
            onTotalChange={setErTotal}
            accentColor="#059669"
          />

          <CapacityCard
            title={t("capacity.icuBeds", lang)}
            icon={Bed}
            available={icuAvailable}
            total={icuTotal}
            onAvailableChange={setIcuAvailable}
            onTotalChange={setIcuTotal}
            accentColor="#0052FF"
          />

          <CapacityCard
            title={t("capacity.ventilators", lang)}
            icon={Activity}
            available={ventsAvailable}
            total={ventsTotal}
            onAvailableChange={setVentsAvailable}
            onTotalChange={setVentsTotal}
            accentColor="#8B5CF6"
          />

          <CapacityCard
            title={t("capacity.otRooms", lang)}
            icon={Users}
            available={otAvailable}
            total={otTotal}
            onAvailableChange={setOtAvailable}
            onTotalChange={setOtTotal}
            accentColor="#D97706"
          />
        </div>
      </section>

      {/* Doctor in Charge / Duty Lead Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-[#050B18]">
                  {t("doctor.inCharge", lang)} / {t("doctor.dutyLead", lang)}
                </h2>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  docOnDuty ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                }`}>
                  {docOnDuty ? t("doctor.onDuty", lang) : t("doctor.offDuty", lang)}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Displayed to incoming emergency cases and verified by NearER Decision Engine.
              </p>
            </div>
          </div>

          {/* On Duty Toggle */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 self-start sm:self-auto">
            <button
              onClick={() => setDocOnDuty(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                docOnDuty ? "bg-emerald-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t("doctor.onDuty", lang)}
            </button>
            <button
              onClick={() => setDocOnDuty(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !docOnDuty ? "bg-gray-700 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t("doctor.offDuty", lang)}
            </button>
          </div>
        </div>

        {/* Doctor In Charge Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
              Doctor Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none transition-all"
                placeholder="e.g. Dr. Sandip Sengupta"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
              Medical Specialty
            </label>
            <input
              type="text"
              value={docSpecialty}
              onChange={(e) => setDocSpecialty(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none transition-all"
              placeholder="e.g. Emergency & Trauma Medicine"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
              Designation / Role
            </label>
            <input
              type="text"
              value={docDesignation}
              onChange={(e) => setDocDesignation(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none transition-all"
              placeholder="e.g. Chief Medical Officer & ER Lead"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
              Qualifications & Degrees
            </label>
            <input
              type="text"
              value={docQualification}
              onChange={(e) => setDocQualification(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none transition-all"
              placeholder="e.g. MD (Emergency Med), FACEE"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
              Medical Council Reg. No.
            </label>
            <input
              type="text"
              value={docRegNo}
              onChange={(e) => setDocRegNo(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none transition-all font-mono"
              placeholder="e.g. WBMC-48291"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
              Shift Timing
            </label>
            <input
              type="text"
              value={docShift}
              onChange={(e) => setDocShift(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none transition-all"
              placeholder="e.g. Day Shift (08:00 - 20:00)"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
              Direct Extension / Hot line
            </label>
            <input
              type="text"
              value={docExt}
              onChange={(e) => setDocExt(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none transition-all"
              placeholder="e.g. Ext. 204"
            />
          </div>
        </div>

        {/* Live Patient Card Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            PATIENT PORTAL PREVIEW: How this doctor appears on emergency screens
          </div>
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
                DR
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-[#050B18]">{docName || "Doctor Name"}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-md">
                    {docOnDuty ? "ON DUTY NOW" : "SHIFT OFF"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  {docDesignation} • {docSpecialty} ({docQualification})
                </p>
              </div>
            </div>
            <div className="text-xs font-mono text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
              Reg: {docRegNo} | {docExt}
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-[#0052FF] hover:bg-blue-600 active:scale-95 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save & Publish Live to NearER
          </button>
        </div>
      </section>
    </div>
  );
}

function CapacityCard({
  title,
  icon: Icon,
  available,
  total,
  onAvailableChange,
  onTotalChange,
  accentColor,
}: {
  title: string;
  icon: any;
  available: number;
  total: number;
  onAvailableChange: (val: number) => void;
  onTotalChange: (val: number) => void;
  accentColor: string;
}) {
  const percentage = total > 0 ? Math.min(100, Math.round((available / total) * 100)) : 0;
  const isAvailable = available > 0;

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#050B18]">{title}</h3>
            <span className="text-[11px] text-gray-400 font-medium">
              {percentage}% operational capacity
            </span>
          </div>
        </div>

        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            available > 2
              ? "bg-emerald-100 text-emerald-800"
              : available > 0
              ? "bg-amber-100 text-amber-800"
              : "bg-red-100 text-red-700 animate-pulse"
          }`}
        >
          {available > 2 ? "Ready" : available > 0 ? "Low" : "Full"}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: isAvailable ? accentColor : "#EF4444",
          }}
        />
      </div>

      {/* Count & Stepper */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
            AVAILABLE / TOTAL
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-[#050B18]">{available}</span>
            <span className="text-lg font-bold text-gray-400">/</span>
            <input
              type="number"
              min={available}
              max={200}
              value={total}
              onChange={(e) => onTotalChange(Math.max(available, parseInt(e.target.value) || 0))}
              className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-base font-bold text-gray-600 outline-none"
              title="Click to edit total capacity"
            />
          </div>
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={() => onAvailableChange(Math.max(0, available - 1))}
            className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm font-bold text-lg text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
            title="Decrease available"
          >
            -
          </button>
          <button
            onClick={() => onAvailableChange(Math.min(total, available + 1))}
            className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm font-bold text-lg text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
            title="Increase available"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
