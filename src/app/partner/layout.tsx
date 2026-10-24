"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Activity, Users, Droplet, 
  Truck, Bell, BarChart3, UserCircle, Settings, HelpCircle, ShieldCheck, ChevronDown
} from "lucide-react";
import { MOCK_HOSPITALS } from "@/lib/demo-data";
import { usePartnerHospital, useEmergencyState } from "@/lib/demo-state";

const SIDEBAR_ITEMS = [
  { name: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard },
  { name: "Capacity & Beds", href: "/partner/capacity", icon: Users },
  { name: "ER & Services", href: "/partner/services", icon: Activity },
  { name: "Blood Bank", href: "/partner/blood-bank", icon: Droplet },
  { name: "Ambulance", href: "/partner/ambulance", icon: Truck },
  { name: "Alerts", href: "/partner/alerts", icon: Bell },
  { name: "Analytics", href: "/partner/analytics", icon: BarChart3 },
];

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hospitalId, switchHospital } = usePartnerHospital();
  const { state } = useEmergencyState();

  const activeHospital = MOCK_HOSPITALS.find((h) => h.id === hospitalId) || MOCK_HOSPITALS[0];

  // Don't show sidebar on login page
  if (pathname === "/partner") return <>{children}</>;

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#050B18] text-white flex flex-col shrink-0">
        <div className="p-6 pb-4">
          <Link href="/partner/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/aerva-mark.png"
              alt="AERVA"
              width={34}
              height={22}
              className="h-7 w-auto object-contain"
            />
            <span className="font-bold text-white tracking-tight">Near<span className="text-[#00B2FF]">ER</span></span>
            <span className="text-[#00B2FF] text-[10px] uppercase font-bold tracking-wider ml-1 bg-white/10 px-1.5 py-0.5 rounded">Portal</span>
          </Link>
        </div>

        {/* Hospital Switcher Box */}
        <div className="px-4 pb-5">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
              <span>ACTIVE HOSPITAL</span>
              <span className="text-emerald-400">DEMO SWITCHER</span>
            </div>
            <select 
              value={hospitalId}
              onChange={(e) => switchHospital(e.target.value)}
              className="w-full bg-[#0A2540] text-white border border-white/20 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-[#0052FF] cursor-pointer"
            >
              {MOCK_HOSPITALS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {state.status !== "IDLE" && state.hospitalId === h.id ? "🚨 (Incoming)" : ""}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> VERIFIED
              </span>
              <span className="text-[10px] text-gray-400 font-mono">ID: {activeHospital.id}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 px-2">Operations</div>
          {SIDEBAR_ITEMS.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "bg-[#0052FF] text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}>
                  <Icon className="w-4 h-4" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <Link 
            href="/partner"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white w-full transition-colors"
          >
            <UserCircle className="w-4 h-4" /> Switch Portal Login
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-black text-[#050B18] text-base">{activeHospital.name}</h1>
            <span className="text-xs text-gray-400 font-semibold">• Operations Center</span>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            {/* Quick hospital switcher dropdown */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-gray-500">Hospital:</span>
              <select
                value={hospitalId}
                onChange={(e) => switchHospital(e.target.value)}
                className="bg-white text-[#050B18] font-bold text-xs px-2 py-1 rounded-lg border-0 shadow-sm cursor-pointer"
              >
                {MOCK_HOSPITALS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} {state.status !== "IDLE" && state.hospitalId === h.id ? "🚨 (Incoming Request)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <span className="flex items-center gap-1.5 text-[#059669] bg-green-50 px-2.5 py-1 rounded-md text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" /> Live Updating
            </span>
          </div>
        </header>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
