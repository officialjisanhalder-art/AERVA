"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

const navLinks = [
  { name: "Home", key: "nav.home", href: "/" },
  { name: "Patient Portal", key: "nav.patientPortal", href: "/patient" },
  { name: "NearER Reach", key: "nav.reach", href: "/reach" },
  { name: "Operator Desk", key: "nav.operatorDesk", href: "/reach/login" },
  { name: "For Hospitals", key: "nav.forHospitals", href: "/partner" },
  { name: "Traffic Towers", key: "nav.trafficTowers", href: "/traffic" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("Home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang } = useLang();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3.5 bg-white/90 backdrop-blur-xl border-b border-gray-100/80 shadow-[0_2px_15px_rgba(0,0,0,0.03)]"
        )}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/nearer-mark.png"
              alt="NearER"
              width={38}
              height={24}
              className="h-8 w-auto object-contain"
              priority
            />
            <span className="font-black text-xl tracking-tight text-[#050B18]">
              Near<span className="text-[#0052FF]">ER</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setActive(link.name)}
                className={cn(
                  "relative font-semibold text-sm transition-colors duration-200",
                  active === link.name
                    ? "text-[#0052FF]"
                    : "text-gray-600 hover:text-[#050B18]"
                )}
              >
                {t(link.key, lang)}
                {active === link.name && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute left-0 right-0 h-0.5 bottom-[-4px] rounded-full bg-[#0052FF]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-[#0052FF] px-3 py-2 rounded-xl hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-all cursor-pointer shadow-2xs"
              title={lang === "en" ? "Switch to Hindi (हिन्दी)" : "Switch to English"}
            >
              <Globe className="w-3.5 h-3.5 text-[#0052FF]" />
              <span>{lang === "en" ? "हिन्दी" : "English"}</span>
            </button>
            <Link
              href="/patient"
              className="text-xs font-bold text-gray-600 hover:text-[#0052FF] px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors"
            >
              {t("nav.patientPassport", lang)}
            </Link>
            <Link 
              href="/emergency"
              className="bg-[#0052FF] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20"
            >
              {t("nav.emergencyCare", lang)}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-[#050B18]"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[60px] left-4 right-4 z-40 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-1">
              {/* Mobile Language Switcher */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#0052FF]" /> Language / भाषा:
                </span>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setLang("en")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      lang === "en" ? "bg-white text-[#0052FF] shadow-xs" : "text-gray-600"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLang("hi")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      lang === "hi" ? "bg-white text-[#0052FF] shadow-xs" : "text-gray-600"
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>

              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => { setActive(link.name); setMobileOpen(false); }}
                  className={cn(
                    "px-4 py-3 rounded-xl font-semibold text-sm transition-colors",
                    active === link.name
                      ? "bg-[#EEF3FF] text-[#0052FF]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#0A192F]"
                  )}
                >
                  {t(link.key, lang)}
                </a>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link 
                  href="/emergency" 
                  onClick={() => setMobileOpen(false)}
                  className="w-full block text-center bg-[#0052FF] text-white py-3.5 rounded-2xl font-bold hover:bg-blue-600 transition-colors"
                >
                  {t("nav.getStarted", lang)}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
