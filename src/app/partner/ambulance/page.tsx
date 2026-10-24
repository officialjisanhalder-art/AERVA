"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  CheckCircle2,
  Clock,
  Navigation2,
  Phone,
  Shield,
  Activity,
  AlertTriangle,
  Siren,
  Sparkles,
  RefreshCw,
  Plus,
  Send,
  X,
  Radio,
  Zap,
} from "lucide-react";
import { Ambulance, AmbulanceStatus } from "@/lib/services/ambulance-service";
import { useEmergencyState } from "@/lib/demo-state";

export default function PartnerAmbulancePage() {
  const [fleet, setFleet] = useState<Ambulance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "STANDBY" | "ACTIVE">("ALL");
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>("");
  const [targetCaseId, setTargetCaseId] = useState<string>("NR-10482");
  const [patientName, setPatientName] = useState<string>("Jisan Halder");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [corridorAlertSuccess, setCorridorAlertSuccess] = useState<string | null>(null);

  const { state } = useEmergencyState();

  const loadFleet = async () => {
    try {
      const res = await fetch("/api/v1/ambulance/fleet");
      if (res.ok) {
        const data = await res.json();
        setFleet(data.fleet || []);
      }
    } catch (e) {
      console.error("Failed to load fleet:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFleet();
    const interval = setInterval(loadFleet, 6000);
    return () => clearInterval(interval);
  }, []);

  const total = fleet.length;
  const standbyCount = fleet.filter((a) => a.status === "AVAILABLE_STANDBY").length;
  const activeMissions = fleet.filter(
    (a) => a.status === "DISPATCHED" || a.status === "EN_ROUTE_PATIENT" || a.status === "PATIENT_ONBOARD"
  );
  const greenCorridorCount = fleet.filter((a) => a.greenCorridorActive).length;

  const filteredFleet = fleet.filter((a) => {
    if (activeFilter === "STANDBY") return a.status === "AVAILABLE_STANDBY";
    if (activeFilter === "ACTIVE")
      return a.status === "DISPATCHED" || a.status === "EN_ROUTE_PATIENT" || a.status === "PATIENT_ONBOARD";
    return true;
  });

  const handleUpdateStatus = async (ambulanceId: string, nextStatus: AmbulanceStatus) => {
    try {
      await fetch("/api/v1/ambulance/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ambulance_id: ambulanceId, status: nextStatus }),
      });
      loadFleet();
    } catch (e) {
      console.error("Status update error:", e);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmbulanceId && standbyCount === 0) return;
    setIsSubmitting(true);

    try {
      await fetch("/api/v1/ambulance/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: targetCaseId || state.caseId || "NR-10482",
          ambulance_id: selectedAmbulanceId || undefined,
          patient_name: patientName || state.patientName || "Emergency Patient",
          patient_location: {
            latitude: state.location?.lat || 22.5726,
            longitude: state.location?.lng || 88.3639,
            area: state.location?.area || "Salt Lake Sector V",
            city: "Kolkata",
          },
          emergency_type: state.emergencyId || "Cardiac Emergency",
        }),
      });

      setShowDispatchModal(false);
      loadFleet();
    } catch (err) {
      console.error("Dispatch failure:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestCorridor = (amb: Ambulance) => {
    setCorridorAlertSuccess(amb.unitCode);
    setTimeout(() => setCorridorAlertSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Metrics Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
              AERVA Fleet Operations Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#050B18] tracking-tight">
            Ambulance Fleet & Dispatch Console
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Real-time telemetry, ALS/BLS mobile ICU monitoring, and instant case dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadFleet}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
            title="Refresh fleet"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const standbyOne = fleet.find((a) => a.status === "AVAILABLE_STANDBY");
              if (standbyOne) setSelectedAmbulanceId(standbyOne.id);
              setShowDispatchModal(true);
            }}
            className="bg-[#0052FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Dispatch to Case</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Total Fleet</span>
            <span className="text-xl font-black text-[#050B18]">{total} Units</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Standby Available</span>
            <span className="text-xl font-black text-emerald-600">{standbyCount} Ready</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Active Missions</span>
            <span className="text-xl font-black text-amber-600">{activeMissions.length} En Route</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Siren className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Green Corridors</span>
            <span className="text-xl font-black text-rose-600">{greenCorridorCount} Active</span>
          </div>
        </div>
      </div>

      {/* Success notice for green corridor */}
      {corridorAlertSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <Siren className="w-4 h-4 text-emerald-600" />
            <span>Traffic Police Control Room Alerted: Priority Green Wave activated for {corridorAlertSuccess}!</span>
          </div>
          <button onClick={() => setCorridorAlertSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ACTIVE MISSIONS HIGH-PRIORITY PANEL */}
      {activeMissions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
            <h2 className="text-sm font-black uppercase tracking-wider text-[#050B18]">
              Active Emergency Missions in Transit ({activeMissions.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMissions.map((amb) => (
              <div
                key={amb.id}
                className="bg-white border-2 border-amber-300 rounded-3xl p-5 shadow-md flex flex-col justify-between gap-4 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-rose-500" />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md mr-2">
                        {amb.type.replaceAll("_", " ")}
                      </span>
                      <h3 className="text-lg font-black text-[#050B18] inline-block">{amb.unitCode}</h3>
                    </div>
                    <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                      {amb.vehicleNumber}
                    </span>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 mb-3 text-xs">
                    <div className="flex items-center justify-between font-bold text-amber-950 mb-1">
                      <span>Case: {amb.assignedCaseId || "NR-10482"}</span>
                      <span className="text-emerald-700 font-black">ETA: ~{amb.etaMinutes} mins</span>
                    </div>
                    <div className="text-gray-700">Patient: <strong>{amb.patientName || "Jisan Halder"}</strong></div>
                    <div className="text-gray-500 text-[11px] mt-0.5">
                      Destination: {amb.hospitalName}
                    </div>
                  </div>

                  {/* Paramedic & Driver contact strip */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-gray-400">Driver</div>
                      <div className="font-bold text-gray-800 truncate">{amb.driver.name}</div>
                      <a href={`tel:${amb.driver.phone}`} className="text-[#0052FF] text-[11px] font-semibold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-gray-400">EMT Lead</div>
                      <div className="font-bold text-gray-800 truncate">{amb.paramedic.name}</div>
                      <a href={`tel:${amb.paramedic.phone}`} className="text-emerald-600 text-[11px] font-semibold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    </div>
                  </div>

                  {/* Telemetry live gauges */}
                  <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl text-[11px] font-mono text-gray-600">
                    <span>Speed: <strong>{amb.telemetry.speedKmH} km/h</strong></span>
                    <span>O₂ Level: <strong>{amb.telemetry.oxygenLevelPercent}%</strong></span>
                    <span>Fuel: <strong>{amb.telemetry.fuelPercent}%</strong></span>
                  </div>
                </div>

                {/* Status Stepper Action Buttons */}
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <div className="text-[10px] uppercase font-black text-gray-400">Advance Mission Status:</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleUpdateStatus(amb.id, "EN_ROUTE_PATIENT")}
                      className={`text-[11px] font-bold py-2 rounded-xl text-center border cursor-pointer ${
                        amb.status === "EN_ROUTE_PATIENT"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                      }`}
                    >
                      En Route
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(amb.id, "PATIENT_ONBOARD")}
                      className={`text-[11px] font-bold py-2 rounded-xl text-center border cursor-pointer ${
                        amb.status === "PATIENT_ONBOARD"
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                      }`}
                    >
                      Onboard
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(amb.id, "AVAILABLE_STANDBY")}
                      className="text-[11px] font-bold py-2 rounded-xl text-center border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                    >
                      Complete ER
                    </button>
                  </div>

                  <button
                    onClick={() => handleRequestCorridor(amb)}
                    className="w-full text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 py-2 rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Siren className="w-3.5 h-3.5" />
                    Request Police Green Corridor Wave
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FLEET INVENTORY SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-black text-[#050B18]">Hospital Fleet Units</h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold w-fit">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === "ALL" ? "bg-white text-[#050B18] shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              All ({total})
            </button>
            <button
              onClick={() => setActiveFilter("STANDBY")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === "STANDBY" ? "bg-white text-[#050B18] shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Standby ({standbyCount})
            </button>
            <button
              onClick={() => setActiveFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === "ACTIVE" ? "bg-white text-[#050B18] shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Active ({activeMissions.length})
            </button>
          </div>
        </div>

        {/* Fleet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFleet.map((amb) => (
            <div
              key={amb.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between gap-4 hover:border-gray-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center font-black text-sm shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-[#050B18] leading-tight">{amb.unitCode}</h3>
                      <span className="text-[11px] font-medium text-gray-500">{amb.name}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      amb.status === "AVAILABLE_STANDBY"
                        ? "bg-emerald-100 text-emerald-800"
                        : amb.status === "DISPATCHED"
                        ? "bg-amber-100 text-amber-800"
                        : amb.status === "EN_ROUTE_PATIENT"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {amb.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="text-xs font-mono text-gray-500 mb-3">
                  Plate: <strong>{amb.vehicleNumber}</strong> • Base: {amb.hospitalName.split(" ")[0]}
                </div>

                {/* Paramedic & Driver */}
                <div className="bg-gray-50/80 rounded-2xl p-3 space-y-1.5 text-xs mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Driver:</span>
                    <span className="font-bold text-gray-800">{amb.driver.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">EMT Lead:</span>
                    <span className="font-bold text-gray-800">{amb.paramedic.name}</span>
                  </div>
                </div>

                {/* Verified Equipment Tags */}
                <div className="mb-3">
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                    Onboard Equipment:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {amb.equipment.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                        ✓ {item.split(" (")[0]}
                      </span>
                    ))}
                    {amb.equipment.length > 3 && (
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                        +{amb.equipment.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {amb.status === "AVAILABLE_STANDBY" ? (
                <button
                  onClick={() => {
                    setSelectedAmbulanceId(amb.id);
                    setShowDispatchModal(true);
                  }}
                  className="w-full bg-[#050B18] hover:bg-gray-800 text-white font-bold text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  Dispatch This Unit
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus(amb.id, "AVAILABLE_STANDBY")}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Unit to Standby
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* DISPATCH AMBULANCE MODAL */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-black text-lg text-[#050B18]">Dispatch Ambulance Unit</h3>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatch} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Ambulance Unit:</label>
                <select
                  value={selectedAmbulanceId}
                  onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800"
                >
                  {fleet
                    .filter((a) => a.status === "AVAILABLE_STANDBY")
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.unitCode} - {a.name} ({a.type.replaceAll("_", " ")})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Target Emergency Case ID:</label>
                <input
                  type="text"
                  value={targetCaseId}
                  onChange={(e) => setTargetCaseId(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold text-gray-800"
                  placeholder="NR-10482"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Patient Name:</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800"
                  placeholder="Jisan Halder"
                  required
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-[11px] text-emerald-800 font-medium">
                ✓ Onboard critical care paramedic & automated driver telemetry will activate immediately upon dispatch.
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#0052FF] hover:bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Dispatching..." : "Confirm Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
