"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Heart, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Pill, 
  Activity, 
  QrCode, 
  Save,
  X,
  Download,
  Printer,
  Eye,
  Siren,
  Clock,
  ChevronRight,
  ExternalLink,
  Share2,
  Check
} from "lucide-react";
import { AppNavbar } from "@/components/app/AppNavbar";
import { 
  PatientProfile, 
  AllergyItem, 
  MedicationItem, 
  PrescriptionDoc, 
  DEFAULT_PATIENT_PROFILE,
  getStoredPatientProfile, 
  savePatientProfile,
  calculateProfileCompleteness,
  generateEmergencyQrPayload
} from "@/lib/patient-profile";
import { getPatientHistory, EmergencyVisitHistory } from "@/lib/history-service";
import { useEmergencyState, useHospitalData } from "@/lib/demo-state";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";
import Link from "next/link";

const COMMON_ALLERGENS = [
  "Penicillin",
  "Sulfa Drugs",
  "NSAIDs / Aspirin",
  "Peanuts",
  "Latex",
  "Iodine Contrast Dye",
  "Shellfish"
];

const COMMON_CONDITIONS = [
  "Mild Bronchial Asthma",
  "Type 2 Diabetes",
  "Hypertension",
  "Coronary Artery Disease",
  "Hypothyroidism",
  "Epilepsy",
  "Chronic Kidney Disease"
];

export default function PatientPortalPage() {
  const router = useRouter();
  const { state, updateState } = useEmergencyState();
  const { hospitals } = useHospitalData();
  const { lang } = useLang();

  const [profile, setProfile] = useState<PatientProfile>(DEFAULT_PATIENT_PROFILE);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALLERGIES" | "PRESCRIPTIONS" | "MEDICATIONS" | "HISTORY" | "PERSONAL">("ALLERGIES");
  const [visitHistory, setVisitHistory] = useState<EmergencyVisitHistory[]>([]);
  const [docFilter, setDocFilter] = useState<string>("ALL");
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Active emergency info
  const targetHospital = state.hospitalId 
    ? hospitals.find(h => h.id === state.hospitalId) 
    : null;
  const hasActiveEmergency = state.status !== "IDLE" && state.status !== "CONFIRMED";

  // Modals state
  const [showQrModal, setShowQrModal] = useState(false);
  const [passportQrDataUrl, setPassportQrDataUrl] = useState<string>("");
  const [showAddAllergy, setShowAddAllergy] = useState(false);
  const [showAddMed, setShowAddMed] = useState(false);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<PrescriptionDoc | null>(null);

  // Generate real verifiable QR code for medical passport
  useEffect(() => {
    if (profile) {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://aerva-0cvq.onrender.com";
      const passportUrl = `${origin}/pass?caseId=${encodeURIComponent(profile.healthId || "HID-9842")}&patient=${encodeURIComponent(profile.fullName || "Patient")}&blood=${encodeURIComponent(profile.bloodGroup || "O+")}&allergies=${encodeURIComponent(profile.allergies.map(a => a.name).join(",") || "None")}`;

      QRCode.toDataURL(passportUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#050B18",
          light: "#FFFFFF",
        },
      })
        .then(setPassportQrDataUrl)
        .catch(err => console.error("Passport QR generation error:", err));
    }
  }, [profile]);

  // New allergy state
  const [newAllergyName, setNewAllergyName] = useState("");
  const [newAllergyCategory, setNewAllergyCategory] = useState<AllergyItem["category"]>("Drug");
  const [newAllergySeverity, setNewAllergySeverity] = useState<AllergyItem["severity"]>("Severe / Anaphylaxis");

  // New medication state
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");
  const [newMedReason, setNewMedReason] = useState("");

  // New document state
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocDoctor, setNewDocDoctor] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<PrescriptionDoc["category"]>("Prescription");
  const [newDocNotes, setNewDocNotes] = useState("");
  const [newDocFileName, setNewDocFileName] = useState("");
  const [newDocFileSize, setNewDocFileSize] = useState("");
  const [newDocDataUrl, setNewDocDataUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New chronic condition input
  const [newConditionText, setNewConditionText] = useState("");
  const [showAddCondition, setShowAddCondition] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProfile(getStoredPatientProfile());
    setVisitHistory(getPatientHistory());
  }, []);

  const completeness = calculateProfileCompleteness(profile);

  const handleSave = () => {
    savePatientProfile(profile);
    updateState({
      patientName: profile.fullName,
      patientPhone: profile.phone,
      patientAge: profile.age,
      patientGender: profile.gender,
      bloodGroup: profile.bloodGroup,
    });
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleAddAllergy = () => {
    if (!newAllergyName.trim()) return;
    const item: AllergyItem = {
      id: "a_" + Date.now(),
      name: newAllergyName.trim(),
      category: newAllergyCategory,
      severity: newAllergySeverity,
    };
    const updated = { ...profile, allergies: [...profile.allergies, item] };
    setProfile(updated);
    savePatientProfile(updated);
    setNewAllergyName("");
    setShowAddAllergy(false);
  };

  const handleRemoveAllergy = (id: string) => {
    const updated = { ...profile, allergies: profile.allergies.filter((a) => a.id !== id) };
    setProfile(updated);
    savePatientProfile(updated);
  };

  const handleAddCondition = (cond: string) => {
    if (!cond.trim() || profile.chronicConditions.includes(cond.trim())) return;
    const updated = { ...profile, chronicConditions: [...profile.chronicConditions, cond.trim()] };
    setProfile(updated);
    savePatientProfile(updated);
    setNewConditionText("");
    setShowAddCondition(false);
  };

  const handleRemoveCondition = (idx: number) => {
    const updated = { ...profile, chronicConditions: profile.chronicConditions.filter((_, i) => i !== idx) };
    setProfile(updated);
    savePatientProfile(updated);
  };

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    const item: MedicationItem = {
      id: "m_" + Date.now(),
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || "Standard dose",
      frequency: newMedFreq.trim() || "Once daily",
      prescribedFor: newMedReason.trim() || "Clinical treatment",
    };
    const updated = { ...profile, medications: [...profile.medications, item] };
    setProfile(updated);
    savePatientProfile(updated);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedFreq("");
    setNewMedReason("");
    setShowAddMed(false);
  };

  const handleRemoveMedication = (id: string) => {
    const updated = { ...profile, medications: profile.medications.filter((m) => m.id !== id) };
    setProfile(updated);
    savePatientProfile(updated);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewDocFileName(file.name);
    const sizeInKb = Math.round(file.size / 1024);
    setNewDocFileSize(sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`);

    if (!newDocTitle) {
      setNewDocTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewDocDataUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPrescription = () => {
    if (!newDocTitle.trim()) return;
    const item: PrescriptionDoc = {
      id: "p_" + Date.now(),
      title: newDocTitle.trim(),
      doctorName: newDocDoctor.trim() || "Treating Physician",
      date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      fileType: newDocFileName.endsWith(".pdf") ? "pdf" : "image",
      category: newDocCategory || "Prescription",
      fileName: newDocFileName || "medical_record.pdf",
      fileSize: newDocFileSize || "340 KB",
      fileDataUrl: newDocDataUrl || "",
      notes: newDocNotes.trim() || "Verified record uploaded to digital health passport.",
    };
    const updated = { ...profile, prescriptions: [item, ...profile.prescriptions] };
    setProfile(updated);
    savePatientProfile(updated);
    setNewDocTitle("");
    setNewDocDoctor("");
    setNewDocNotes("");
    setNewDocFileName("");
    setNewDocFileSize("");
    setNewDocDataUrl("");
    setShowUploadDoc(false);
  };

  const handleRemoveDoc = (id: string) => {
    const updated = { ...profile, prescriptions: profile.prescriptions.filter((d) => d.id !== id) };
    setProfile(updated);
    savePatientProfile(updated);
  };

  const handleStartEmergencyWithProfile = () => {
    handleSave();
    updateState({
      patientName: profile.fullName,
      patientPhone: profile.phone,
      patientAge: profile.age,
      patientGender: profile.gender,
      bloodGroup: profile.bloodGroup,
    });
    router.push("/emergency");
  };

  const filteredDocs = profile.prescriptions.filter((doc) => {
    if (docFilter === "ALL") return true;
    return doc.category?.toUpperCase() === docFilter;
  });

  if (!mounted) {
    return (
      <>
        <AppNavbar title={t("patient.portalTitle", lang)} backTo="/" />
        <main className="pt-24 pb-36 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
          <div className="h-64 bg-gradient-to-tr from-blue-100 to-blue-50 rounded-3xl animate-pulse" />
          <div className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-96 bg-gray-100 rounded-3xl animate-pulse" />
        </main>
      </>
    );
  }

  return (
    <>
      <AppNavbar title={t("patient.portalTitle", lang)} backTo="/" />

      <main className="pt-24 pb-36 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
        
        {/* Saved Toast Notification */}
        <AnimatePresence>
          {isSavedToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#050B18] text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold border border-white/20"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {t("patient.savedToast", lang)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ACTIVE EMERGENCY IN PROGRESS BANNER */}
        {hasActiveEmergency && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <Siren className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                      {t("patient.activeEmergency", lang)}
                    </span>
                    <span className="text-xs font-mono font-bold bg-white text-red-700 px-2 py-0.5 rounded-md">
                      {state.caseId || "CASE #ACTIVE"}
                    </span>
                  </div>
                  <h3 className="font-black text-lg mt-1">
                    {targetHospital?.name || "Routing to Verified ER"}
                  </h3>
                  {targetHospital?.doctorInCharge && (
                    <p className="text-xs text-white/90 font-medium">
                      Attending ER Lead: <span className="font-bold underline">{targetHospital.doctorInCharge.name}</span> ({targetHospital.doctorInCharge.shift})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link 
                  href="/emergency/status"
                  className="flex-1 sm:flex-none bg-white text-red-700 hover:bg-red-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Activity className="w-4 h-4" />
                  {t("patient.trackStatus", lang)}
                </Link>
                <Link 
                  href="/emergency/message"
                  className="flex-1 sm:flex-none bg-black/20 hover:bg-black/30 text-white px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1"
                >
                  Chat ER
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Digital Health ID Card (Interactive Passport) */}
        <div className="bg-gradient-to-tr from-[#0052FF] via-[#0047E0] to-[#0A2540] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/15">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-md">
                  {t("patient.healthId", lang)}
                </span>
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> {t("patient.preVerified", lang)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">{profile.fullName}</h1>
              <p className="text-xs text-blue-100 font-mono mt-0.5">{profile.healthId}</p>
            </div>

            {/* Clickable QR Code Passport Preview */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQrModal(true)}
                className="w-16 h-16 bg-white rounded-2xl p-1 flex flex-col items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer group relative border border-white/20"
                title="Click to expand Medical Passport QR Code"
              >
                {passportQrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={passportQrDataUrl} alt="Passport QR" className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <QrCode className="w-full h-full text-[#050B18]" />
                )}
                <span className="absolute -bottom-2 text-[9px] font-black uppercase bg-[#050B18] text-white px-1.5 py-0.2 rounded shadow">
                  SCAN
                </span>
              </button>
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-blue-200">Blood Group</span>
                <div className="text-2xl font-black text-red-300">{profile.bloodGroup}</div>
              </div>
            </div>
          </div>

          {/* Card Meta Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-blue-200 block text-[10px] uppercase font-bold">Contact</span>
              <span className="font-bold">{profile.phone}</span>
            </div>
            <div>
              <span className="text-blue-200 block text-[10px] uppercase font-bold">Age / Gender</span>
              <span className="font-bold">{profile.age} Yrs • {profile.gender}</span>
            </div>
            <div>
              <span className="text-blue-200 block text-[10px] uppercase font-bold">Emergency Kin</span>
              <span className="font-bold truncate block">{profile.emergencyContactName}</span>
            </div>
            <div>
              <span className="text-blue-200 block text-[10px] uppercase font-bold">Allergies Logged</span>
              <span className="font-bold text-amber-300">{profile.allergies.length} Flagged</span>
            </div>
          </div>

          {/* Fast Action Row */}
          <div className="mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-blue-100">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Auto-shares with receiving ER doctors upon SOS request.</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowQrModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4" /> {t("patient.qrCode", lang)}
              </button>
              <button
                onClick={handleStartEmergencyWithProfile}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-lg cursor-pointer"
              >
                <Activity className="w-4 h-4" /> {t("patient.emergencyMode", lang)}
              </button>
            </div>
          </div>
        </div>

        {/* Readiness & Completeness Bar */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center font-black text-sm shrink-0">
              {completeness.percentage}%
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-[#050B18]">
                  {t("patient.completeness", lang)}: {completeness.percentage}% Complete
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  VAULT SYNCED
                </span>
              </div>
              <div className="w-48 sm:w-64 bg-gray-100 h-2 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-[#0052FF] h-full rounded-full transition-all duration-500"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {completeness.missingFields.length > 0 ? (
              <span className="text-gray-400 font-medium">
                Tip: Add {completeness.missingFields[0]} for 100% readiness
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Complete for Emergency Triage
              </span>
            )}
            <button
              onClick={handleSave}
              className="bg-gray-50 hover:bg-gray-100 text-[#050B18] px-3.5 py-1.5 rounded-xl font-bold text-xs border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <Save className="w-3.5 h-3.5 text-[#0052FF]" />
              Save Vault
            </button>
          </div>
        </div>

        {/* Portal Navigation Tabs */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab("ALLERGIES")}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ALLERGIES"
                ? "bg-[#0052FF] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            {t("patient.allergies", lang)} ({profile.allergies.length})
          </button>
          <button
            onClick={() => setActiveTab("PRESCRIPTIONS")}
            className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PRESCRIPTIONS"
                ? "bg-[#0052FF] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            {t("patient.prescriptions", lang)} ({profile.prescriptions.length})
          </button>
          <button
            onClick={() => setActiveTab("MEDICATIONS")}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "MEDICATIONS"
                ? "bg-[#0052FF] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Pill className="w-4 h-4" />
            {t("patient.medications", lang)} ({profile.medications.length})
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "HISTORY"
                ? "bg-[#0052FF] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Clock className="w-4 h-4" />
            {lang === "hi" ? "आपातकालीन इतिहास" : "Care History"} ({visitHistory.length})
          </button>
          <button
            onClick={() => setActiveTab("PERSONAL")}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PERSONAL"
                ? "bg-[#0052FF] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <User className="w-4 h-4" />
            {t("patient.personal", lang)}
          </button>
        </div>

        {/* TAB 1: ALLERGIES & CHRONIC CONDITIONS */}
        {activeTab === "ALLERGIES" && (
          <div className="space-y-5">
            {/* Critical Alert Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-black text-amber-900">Life-Critical Allergy Triage</h3>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  These records are flagged with high priority to incoming ER doctors, anesthesiologists, and paramedics before administering antibiotics, contrast dye, or sedation.
                </p>
              </div>
            </div>

            {/* List of Allergies */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-sm font-black text-[#050B18]">Known Drug, Food & Environmental Allergies</span>
                  <p className="text-xs text-gray-400 font-medium">Auto-cross referenced during emergency prescription</p>
                </div>
                <button
                  onClick={() => setShowAddAllergy(!showAddAllergy)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-[#0052FF] hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {t("patient.addAllergy", lang)}
                </button>
              </div>

              {/* Add Allergy Form */}
              {showAddAllergy && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3"
                >
                  <div className="font-bold text-xs text-[#050B18]">Add Allergy Record</div>
                  
                  {/* Quick Allergen Selector Chips */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Quick Select Common Allergen:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_ALLERGENS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setNewAllergyName(item)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            newAllergyName === item 
                              ? "bg-[#0052FF] text-white" 
                              : "bg-white border border-gray-200 text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newAllergyName}
                      onChange={(e) => setNewAllergyName(e.target.value)}
                      placeholder="Allergen name (e.g. Penicillin)"
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF]"
                    />
                    <select
                      value={newAllergyCategory}
                      onChange={(e) => setNewAllergyCategory(e.target.value as any)}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF]"
                    >
                      <option value="Drug">Drug / Antibiotic</option>
                      <option value="Food">Food / Ingested</option>
                      <option value="Environmental">Environmental</option>
                      <option value="Other">Other Material (e.g. Latex)</option>
                    </select>
                    <select
                      value={newAllergySeverity}
                      onChange={(e) => setNewAllergySeverity(e.target.value as any)}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF]"
                    >
                      <option value="Severe / Anaphylaxis">Severe / Anaphylaxis (Critical)</option>
                      <option value="Moderate">Moderate (Rash / Swelling)</option>
                      <option value="Mild">Mild</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowAddAllergy(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddAllergy}
                      className="bg-[#0052FF] text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow hover:bg-blue-600 cursor-pointer"
                    >
                      Save Allergy
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Allergy Cards List */}
              <div className="space-y-3">
                {profile.allergies.map((allergy) => (
                  <div
                    key={allergy.id}
                    className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${
                        allergy.severity.includes("Severe") ? "bg-red-500 animate-pulse" : "bg-amber-500"
                      }`} />
                      <div>
                        <div className="text-sm font-black text-[#050B18]">{allergy.name}</div>
                        <div className="text-xs text-gray-500 font-medium">Category: {allergy.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                        allergy.severity.includes("Severe")
                          ? "bg-red-100 text-red-700"
                          : allergy.severity === "Moderate"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {allergy.severity}
                      </span>
                      <button
                        onClick={() => handleRemoveAllergy(allergy.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                        title="Delete allergy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-existing & Chronic Conditions Manager */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-black text-[#050B18]">{t("patient.conditions", lang)}</h3>
                  <p className="text-xs text-gray-400 font-medium">Cardiac, pulmonary, and metabolic history</p>
                </div>
                <button
                  onClick={() => setShowAddCondition(!showAddCondition)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-[#0052FF] hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Condition
                </button>
              </div>

              {/* Add Condition Form */}
              {showAddCondition && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Pick Common Condition or Type Custom:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_CONDITIONS.map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => handleAddCondition(cond)}
                        className="text-[11px] font-bold bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg hover:border-[#0052FF] hover:text-[#0052FF] transition-all cursor-pointer"
                      >
                        + {cond}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newConditionText}
                      onChange={(e) => setNewConditionText(e.target.value)}
                      placeholder="e.g. Type 1 Diabetes, Pacemaker Implant"
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF]"
                    />
                    <button
                      onClick={() => handleAddCondition(newConditionText)}
                      className="bg-[#0052FF] text-white px-4 py-2 rounded-xl text-xs font-bold shadow hover:bg-blue-600 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Conditions Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.chronicConditions.map((cond, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 bg-blue-50 text-[#0052FF] font-bold text-xs px-3.5 py-2 rounded-xl border border-blue-100 group"
                  >
                    <Heart className="w-3.5 h-3.5 text-[#0052FF]" />
                    {cond}
                    <button
                      onClick={() => handleRemoveCondition(idx)}
                      className="text-blue-300 hover:text-red-500 transition-colors ml-1 cursor-pointer"
                      title="Remove condition"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRESCRIPTIONS & DIAGNOSTIC RECORDS */}
        {activeTab === "PRESCRIPTIONS" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-black text-[#050B18]">{t("patient.prescriptions", lang)}</h3>
                  <p className="text-xs text-gray-500 font-medium">Digital documents, lab tests, ECGs & doctor orders</p>
                </div>
                <button
                  onClick={() => setShowUploadDoc(!showUploadDoc)}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold bg-[#0052FF] text-white hover:bg-blue-600 px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> {t("patient.uploadDoc", lang)}
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                {["ALL", "PRESCRIPTION", "LAB REPORT", "DISCHARGE SUMMARY"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setDocFilter(f)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                      docFilter === f
                        ? "bg-[#050B18] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f === "ALL" ? "All Documents" : f}
                  </button>
                ))}
              </div>

              {/* Document Upload Form */}
              {showUploadDoc && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 space-y-3"
                >
                  <div className="font-bold text-xs text-[#0052FF]">Attach Medical Record to Health Passport</div>
                  
                  <div className="space-y-3">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Drag and drop / click box */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 bg-white border-2 border-dashed border-blue-200 rounded-2xl text-center cursor-pointer hover:border-[#0052FF] transition-colors"
                    >
                      <Upload className="w-6 h-6 text-[#0052FF] mx-auto mb-1" />
                      <p className="text-xs font-bold text-[#050B18]">
                        {newDocFileName ? `Selected: ${newDocFileName} (${newDocFileSize})` : "Click to choose PDF or Photo prescription"}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Supports PDF, PNG, JPG (Diagnostic tests, Hospital Discharge summary, Rx)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        placeholder="Document Title (e.g. Cardiology Regimen / Blood Test)"
                        className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF]"
                      />
                      <select
                        value={newDocCategory}
                        onChange={(e) => setNewDocCategory(e.target.value as any)}
                        className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF]"
                      >
                        <option value="Prescription">Prescription</option>
                        <option value="Lab Report">Lab / Diagnostic Report</option>
                        <option value="Discharge Summary">Discharge Summary</option>
                        <option value="Vaccine Record">Vaccine Record</option>
                        <option value="Other">Other Record</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      value={newDocDoctor}
                      onChange={(e) => setNewDocDoctor(e.target.value)}
                      placeholder="Doctor Name & Specialty (e.g. Dr. Arvind Ray - Pulmonology)"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF]"
                    />

                    <textarea
                      value={newDocNotes}
                      onChange={(e) => setNewDocNotes(e.target.value)}
                      placeholder="Clinical notes / dosage instructions / test findings..."
                      rows={2}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#050B18] focus:outline-none focus:border-[#0052FF]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowUploadDoc(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadPrescription}
                      className="bg-[#0052FF] text-white px-5 py-2 rounded-xl text-xs font-bold shadow hover:bg-blue-600 cursor-pointer"
                    >
                      Save Document
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Prescriptions List */}
              <div className="space-y-3">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0052FF] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-[#050B18]">{doc.title}</h4>
                            <span className="text-[9px] font-black uppercase tracking-wider bg-blue-100 text-[#0052FF] px-2 py-0.5 rounded">
                              {doc.category || "Prescription"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 font-semibold">{doc.doctorName}</p>
                          <span className="text-[11px] font-mono text-gray-400">
                            {doc.fileName || "document.pdf"} • {doc.fileSize || "400 KB"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-200">
                          {doc.date}
                        </span>
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="p-1.5 bg-white text-[#0052FF] border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                          title="View document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {doc.notes && (
                      <p className="text-xs font-medium text-gray-600 bg-white p-2.5 rounded-xl border border-gray-100 mt-2">
                        {doc.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DAILY MEDICATIONS */}
        {activeTab === "MEDICATIONS" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-black text-[#050B18]">{t("patient.medications", lang)}</h3>
                  <p className="text-xs text-gray-500 font-medium">Ongoing daily drug therapies and inhalers</p>
                </div>
                <button
                  onClick={() => setShowAddMed(!showAddMed)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-[#0052FF] hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {t("patient.addMed", lang)}
                </button>
              </div>

              {/* Add Med Form */}
              {showAddMed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3"
                >
                  <div className="font-bold text-xs text-[#050B18]">Add Ongoing Medication</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      placeholder="Medicine Name (e.g. Metformin / Inhaler)"
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF]"
                    />
                    <input
                      type="text"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      placeholder="Dosage (e.g. 10mg / 1 puff)"
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF]"
                    />
                    <input
                      type="text"
                      value={newMedFreq}
                      onChange={(e) => setNewMedFreq(e.target.value)}
                      placeholder="Frequency (e.g. Once daily at night)"
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF]"
                    />
                    <input
                      type="text"
                      value={newMedReason}
                      onChange={(e) => setNewMedReason(e.target.value)}
                      placeholder="Condition (e.g. Asthma Prevention)"
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#050B18] focus:outline-none focus:border-[#0052FF]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowAddMed(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMedication}
                      className="bg-[#0052FF] text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow hover:bg-blue-600 cursor-pointer"
                    >
                      Save Medication
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Medication Cards */}
              <div className="space-y-3">
                {profile.medications.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-[#050B18]">{med.name} • {med.dosage}</div>
                        <div className="text-xs text-gray-500 font-medium">{med.frequency} ({med.prescribedFor})</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMedication(med.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                      title="Delete medication"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EMERGENCY CARE & HOSPITAL VISIT HISTORY */}
        {activeTab === "HISTORY" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0052FF] bg-blue-50 px-2.5 py-1 rounded-md">
                      LOGGED ADMISSIONS & TRIAGE RECORDS
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#050B18] mt-1">
                    {lang === "hi" ? "आपातकालीन देखभाल एवं अस्पताल इतिहास" : "Emergency Care & Hospital Visit History"}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">
                    Permanent audit of completed emergency routing, triage bed handovers, and attending doctors.
                  </p>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 self-start sm:self-auto">
                  {visitHistory.length} Total Visits Recorded
                </span>
              </div>

              {visitHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <div className="font-bold text-gray-600 text-sm">No Emergency Visits Recorded</div>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                    Whenever you use AERVA to reach an ER, your completed case, assigned bed, and attending doctor will be recorded here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visitHistory.map((visit) => (
                    <div
                      key={visit.id}
                      className="bg-[#F8FAFC] rounded-2xl border border-gray-200 overflow-hidden hover:border-[#0052FF]/40 transition-all shadow-sm"
                    >
                      {/* Card Header */}
                      <div className="p-4 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-50 text-[#0052FF] text-xs font-mono font-black px-2.5 py-1 rounded-lg">
                            {visit.caseId}
                          </span>
                          <span className="text-xs text-gray-400 font-bold">{visit.timestamp}</span>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {visit.status}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-base font-black text-[#050B18] leading-tight">
                              {visit.hospitalName}
                            </h4>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              {visit.hospitalAddress}
                            </p>
                          </div>
                          <Link
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(visit.hospitalName + ", " + visit.hospitalAddress)}&travelmode=driving`}
                            target="_blank"
                            className="bg-white border border-gray-200 hover:border-[#0052FF] text-[#0052FF] p-2.5 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1 shadow-sm"
                            title="Open in Google Maps"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden sm:inline">Directions</span>
                          </Link>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-red-50 border border-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-lg">
                            {visit.emergencyType}
                          </span>
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 rounded-lg">
                            {visit.triageBay}
                          </span>
                          {visit.greenCorridorUsed && (
                            <span className="bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1">
                              <Siren className="w-3.5 h-3.5 text-teal-600" /> Green Corridor Used
                            </span>
                          )}
                        </div>

                        {/* Attending Doctor */}
                        <div className="bg-white p-3.5 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                              DR
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#050B18]">{visit.doctorInChargeName}</div>
                              <div className="text-[10px] text-gray-400 font-medium">{visit.doctorInChargeRole}</div>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded">
                            Triage Attending
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: PERSONAL & EMERGENCY KIN */}
        {activeTab === "PERSONAL" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-base font-black text-[#050B18]">Primary Patient Information</h3>
              <p className="text-xs text-gray-500 font-medium">Used for emergency identification, hospital intake and billing records</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Age</label>
                <input
                  type="text"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Gender</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Blood Group</label>
                <select
                  value={profile.bloodGroup}
                  onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none"
                >
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "Unknown"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Residential Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#050B18] focus:bg-white focus:border-[#0052FF] outline-none"
                />
              </div>
            </div>

            {/* Emergency Kin Contact */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  {t("patient.kinContact", lang)}
                </h4>
                {profile.emergencyContactPhone && (
                  <a
                    href={`tel:${profile.emergencyContactPhone}`}
                    className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" /> {t("patient.callKin", lang)}
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={profile.emergencyContactName}
                  onChange={(e) => setProfile({ ...profile, emergencyContactName: e.target.value })}
                  placeholder="Kin Name (e.g. Subhash Halder)"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-[#050B18]"
                />
                <input
                  type="text"
                  value={profile.emergencyContactRelation}
                  onChange={(e) => setProfile({ ...profile, emergencyContactRelation: e.target.value })}
                  placeholder="Relation (e.g. Brother / Spouse)"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-[#050B18]"
                />
                <input
                  type="text"
                  value={profile.emergencyContactPhone}
                  onChange={(e) => setProfile({ ...profile, emergencyContactPhone: e.target.value })}
                  placeholder="Kin Phone (e.g. +91 98301 23456)"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-[#050B18]"
                />
              </div>
            </div>

            {/* Organ Donor & Consent Toggles */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Emergency Care Consents
              </h4>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <div className="text-xs font-bold text-[#050B18]">{t("patient.organDonor", lang)}</div>
                  <p className="text-[11px] text-gray-500">Pledged for critical organ sharing in trauma cases</p>
                </div>
                <input
                  type="checkbox"
                  checked={profile.organDonor}
                  onChange={(e) => setProfile({ ...profile, organDonor: e.target.checked })}
                  className="w-5 h-5 accent-[#0052FF] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <div className="text-xs font-bold text-[#050B18]">{t("patient.autoShare", lang)}</div>
                  <p className="text-[11px] text-gray-500">Allows receiving ER doctors to read allergies & medications before arrival</p>
                </div>
                <input
                  type="checkbox"
                  checked={profile.autoShareInEmergency}
                  onChange={(e) => setProfile({ ...profile, autoShareInEmergency: e.target.checked })}
                  className="w-5 h-5 accent-[#0052FF] cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-[#0052FF] text-white py-3.5 rounded-2xl font-bold text-sm shadow hover:bg-blue-600 transition-colors cursor-pointer"
            >
              Update & Save Personal Records
            </button>
          </div>
        )}

      </main>

      {/* Floating Save Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xl">
          <div className="flex items-center gap-2 pl-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-gray-700 hidden sm:inline">
              AERVA Medical Passport is ready for regular use & emergency auto-fill
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none bg-[#0052FF] text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-blue-600 transition-colors shadow cursor-pointer"
            >
              {t("patient.saveChanges", lang)}
            </button>
            <button
              onClick={handleStartEmergencyWithProfile}
              className="flex-1 sm:flex-none bg-[#050B18] text-white px-5 py-3 rounded-xl font-bold text-xs hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t("patient.emergencyMode", lang)}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: INTERACTIVE QR CODE MEDICAL PASSPORT MODAL */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQrModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-[#0A2540] text-white p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                    EMERGENCY TRIAGE SCANNER
                  </span>
                  <h3 className="text-lg font-black mt-1">Medical Passport QR Code</h3>
                </div>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 text-center space-y-4">
                {/* Visual QR Code Display */}
                <div className="bg-white p-4 rounded-3xl border-2 border-gray-200 shadow-inner inline-block mx-auto">
                  <div className="w-56 h-56 bg-white rounded-2xl p-2 flex flex-col items-center justify-center relative overflow-hidden">
                    {passportQrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={passportQrDataUrl} 
                        alt="Medical Passport QR Code" 
                        className="w-52 h-52 object-contain rounded-xl"
                      />
                    ) : (
                      <QrCode className="w-48 h-48 text-[#050B18] animate-pulse" />
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-lg font-black text-[#050B18]">{profile.fullName}</div>
                  <div className="text-xs font-mono font-bold text-[#0052FF]">{profile.healthId} • Blood: {profile.bloodGroup}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Emergency triage paramedics scan this with any phone camera or barcode reader to verify medical records in &lt; 2 seconds.
                  </p>
                </div>

                {/* Quick Info summary */}
                <div className="bg-gray-50 rounded-2xl p-3 text-left space-y-1.5 text-xs border border-gray-100 font-medium">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Critical Allergies:</span>
                    <span className="font-bold text-red-600">{profile.allergies.length} Flagged</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kin Emergency Number:</span>
                    <span className="font-bold text-[#050B18]">{profile.emergencyContactPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Organ Donor:</span>
                    <span className="font-bold text-emerald-600">{profile.organDonor ? "Yes (Pledged)" : "No"}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (!passportQrDataUrl) return;
                      const a = document.createElement("a");
                      a.href = passportQrDataUrl;
                      a.download = `AERVA-Passport-QR-${profile.healthId}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="bg-[#0052FF] text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5 shadow cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download QR
                  </button>
                  <Link
                    href={`/pass?caseId=${encodeURIComponent(profile.healthId || "HID-9842")}&patient=${encodeURIComponent(profile.fullName || "Patient")}&blood=${encodeURIComponent(profile.bloodGroup || "O+")}`}
                    className="bg-gray-100 text-[#050B18] hover:bg-gray-200 py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 text-center"
                  >
                    <ExternalLink className="w-4 h-4" /> View Live Pass
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DOCUMENT VIEWER MODAL */}
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingDoc(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
            >
              <div className="bg-[#050B18] text-white p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white px-2 py-0.5 rounded">
                    {viewingDoc.category || "MEDICAL RECORD"}
                  </span>
                  <h3 className="text-lg font-black mt-1">{viewingDoc.title}</h3>
                </div>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Simulated Document Preview Card */}
                <div className="h-56 bg-slate-100 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-mono font-bold text-gray-400 uppercase">OFFICIAL CLINICAL RECORD</div>
                      <div className="text-sm font-black text-[#050B18] mt-1">{viewingDoc.title}</div>
                      <div className="text-xs font-semibold text-gray-600 mt-0.5">{viewingDoc.doctorName}</div>
                    </div>
                    <span className="text-[10px] font-bold bg-white px-2 py-1 rounded border border-gray-200">
                      {viewingDoc.date}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs text-gray-700">
                    <span className="font-bold text-gray-400 uppercase text-[10px] block mb-0.5">Clinical Instructions</span>
                    {viewingDoc.notes || "Standard prescription regimen recorded on file."}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
                    <span>File: {viewingDoc.fileName || "record.pdf"}</span>
                    <span>Size: {viewingDoc.fileSize || "420 KB"}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      alert(`Downloading ${viewingDoc.fileName || viewingDoc.title}...`);
                      setViewingDoc(null);
                    }}
                    className="flex-1 bg-[#0052FF] text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Download className="w-4 h-4" /> Download Document
                  </button>
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="px-5 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

