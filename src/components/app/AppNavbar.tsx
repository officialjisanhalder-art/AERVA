"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/language-context";

export function AppNavbar({ title, backTo }: { title?: string; backTo?: string }) {
  const router = useRouter();
  const { lang, setLang } = useLang();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4">
        {backTo ? (
          <button 
            onClick={() => router.push(backTo)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        ) : (
          <div className="w-9" /> // Spacer to balance title
        )}
        
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/aerva-mark.png"
            alt="AERVA"
            width={34}
            height={22}
            className="h-7 w-auto object-contain"
            priority
          />
          <span className="font-black text-[#050B18] tracking-tight hidden sm:block text-lg">
            AER<span className="text-[#0052FF]">VA</span>
          </span>
        </Link>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 font-bold text-sm sm:text-base text-[#050B18] truncate max-w-[200px] sm:max-w-xs text-center">
        {title}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/evidence"
          title="AERVA AI Evidence & Audit Console"
          className="text-xs font-bold text-[#0052FF] bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs hidden sm:flex items-center gap-1"
        >
          <span>Evidence</span>
        </Link>

        {/* Language Switcher Button */}
        <button
          onClick={() => setLang(lang === "en" ? "hi" : "en")}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-[#0052FF] px-2.5 py-1.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/80 transition-all cursor-pointer shadow-2xs"
          title={lang === "en" ? "Switch to Hindi (हिन्दी)" : "Switch to English"}
        >
          <Globe className="w-3.5 h-3.5 text-[#0052FF]" />
          <span>{lang === "en" ? "हिन्दी" : "EN"}</span>
        </button>

        <Link 
          href="/login" 
          title="Account / Portal Sign In"
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-700 hover:text-[#0052FF] hover:border-[#0052FF]/30 hover:bg-blue-50 transition-all shadow-2xs"
        >
          <User className="w-4 h-4" />
        </Link>
      </div>
    </nav>
  );
}
