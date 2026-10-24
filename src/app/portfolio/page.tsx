'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Award, 
  Smartphone, 
  Globe, 
  Zap, 
  Database, 
  Layers, 
  Printer, 
  Briefcase,
  Code2, 
  Sparkles, 
  Truck,
  ShoppingBag,
  Activity,
  UtensilsCrossed,
  Sliders,
  Server
} from 'lucide-react';

export default function PortfolioPage() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans print:bg-white print:text-slate-900">
      
      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs print:hidden">
        <div className="flex items-center space-x-3">
          <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-700">Light Theme • Executive Client Portfolio</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 print:p-0 print:max-w-none">
        
        {/* Cover / Header Section */}
        <header className="border-b border-slate-200 print:border-slate-300 pb-8 mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Full-Stack Web & Mobile Solutions Architect</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                Solutions Architect & Developer Portfolio
              </h1>
              <p className="mt-2 text-lg text-slate-600 font-medium">
                Crafting High-Performance Web Apps, Cross-Platform Mobile Solutions & Real-Time Intelligent Systems
              </p>
            </div>
          </div>

          {/* Award Banner */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200 shadow-xs">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded uppercase tracking-wider">
                    🥈 2nd Prize Winner
                  </span>
                  <span className="text-xs text-slate-500 font-medium">National / Institutional Hackathon</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Creator of AERVA — Intelligent Emergency Healthcare & Hospital Routing Platform
                </h3>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                  Engineered 4 interconnected portals (Patient App, Driver Dispatch, Hospital Dashboard, Control Booth) & a multi-criteria Decision Engine that optimizes emergency hospital routing based on live resource availability.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Section 1: Executive Profile */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2 mb-4">
            <Briefcase className="w-6 h-6 text-blue-600" />
            <span>Executive Profile & Core Expertise</span>
          </h2>
          <p className="text-slate-700 leading-relaxed">
            Senior full-stack software engineer specializing in transforming complex business requirements into production-ready web and mobile applications. Experienced in architecting end-to-end platforms for client projects, startups, and high-concurrency environments with a focus on speed, aesthetics, security, and scalability.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-3 mb-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Cross-Platform Mobile Apps</h3>
              </div>
              <p className="text-sm text-slate-600">
                Native-performance iOS & Android applications built with Flutter & React Native, complete with offline sync, GPS tracking, and real-time state management.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-3 mb-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Modern Web Applications</h3>
              </div>
              <p className="text-sm text-slate-600">
                Next.js 14 & React platforms with server-side rendering, responsive micro-animations, glassmorphism UI/UX design systems, and rapid page load speeds.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-3 mb-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900">Real-Time Systems & WebSockets</h3>
              </div>
              <p className="text-sm text-slate-600">
                High-concurrency live updates, telemetry streaming, geospatial PostGIS geofencing, push notifications, and instant messaging architecture.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-3 mb-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Backend & Cloud Databases</h3>
              </div>
              <p className="text-sm text-slate-600">
                Supabase, PostgreSQL, Node.js, Express microservices, Docker containers, and automated cloud deployments with zero downtime.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: YOUR EXACT PROJECTS SHOWCASE WITH VISUAL DIAGRAMS */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2 mb-6">
            <Layers className="w-6 h-6 text-blue-600" />
            <span>Featured Client Projects & Architecture Diagrams</span>
          </h2>

          <div className="space-y-10">

            {/* Project 1: AERVA */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded uppercase">🥈 2nd Prize Winner</span>
                    <span className="text-xs font-semibold text-blue-600">Healthcare Emergency Platform</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">1. AERVA — Intelligent Emergency Care Platform</h3>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                Connects patients, ambulances, hospitals, and control booths to eliminate emergency transit delays by routing cases to the <em>"Nearest Suitable and Available Hospital"</em> based on live ER bed, ICU, ventilator, specialist, and blood availability.
              </p>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                <Image 
                  src="/portfolio_assets/visual_aerva.png" 
                  alt="AERVA Visual" 
                  width={1200} 
                  height={675}
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>
            </div>

            {/* Project 2: Zerviqo */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded uppercase">Enterprise Automation</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">2. Zerviqo — High-Performance Service & Automation Platform</h3>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                End-to-end enterprise service dispatch ecosystem featuring automated booking intake, real-time WebSocket job telemetry tracking, vendor partner onboarding, and executive KPI dashboard analytics.
              </p>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                <Image 
                  src="/portfolio_assets/visual_zerviqo.png" 
                  alt="Zerviqo Visual" 
                  width={1200} 
                  height={675}
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>
            </div>

            {/* Project 3: Delivery App */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded uppercase">On-Demand Logistics</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">3. Delivery App — On-Demand GPS Tracking & Rider Dispatch</h3>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                High-concurrency delivery logistics platform featuring live customer ordering, driver turn-by-turn navigation apps, dynamic traffic ETA calculations, and automated rider earnings settlement.
              </p>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                <Image 
                  src="/portfolio_assets/visual_delivery_app.png" 
                  alt="Delivery App Visual" 
                  width={1200} 
                  height={675}
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>
            </div>

            {/* Project 4: Ecomesh */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded uppercase">E-Commerce Marketplace</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">4. Ecomesh — Multi-Merchant E-Commerce Mesh Network</h3>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                Multi-vendor e-commerce mesh network connecting distributed merchant storefronts, cross-warehouse inventory syncing, secure multi-party split payments, and automated order fulfillment.
              </p>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                <Image 
                  src="/portfolio_assets/visual_ecomesh.png" 
                  alt="Ecomesh Visual" 
                  width={1200} 
                  height={675}
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>
            </div>

            {/* Project 5: DMBH */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded uppercase">Digital Healthcare</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">5. DMBH — Digital Medical & Business Healthcare Suite</h3>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                Comprehensive hospital & medical management portal unifying patient electronic health records (EHR), clinical triage schedules, automated insurance claims billing, and executive health analytics.
              </p>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                <Image 
                  src="/portfolio_assets/visual_dmbh.png" 
                  alt="DMBH Visual" 
                  width={1200} 
                  height={675}
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>
            </div>

            {/* Project 6: Highway Mirchi */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded uppercase">Food & Hospitality</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">6. Highway Mirchi — Highway Dining & Hospitality System</h3>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                Specialized food & hospitality platform enabling en-route highway meal pre-ordering, kitchen display system (KDS) queueing, express table POS ordering, and traveler loyalty rewards.
              </p>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                <Image 
                  src="/portfolio_assets/visual_highway_mirchi.png" 
                  alt="Highway Mirchi Visual" 
                  width={1200} 
                  height={675}
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>
            </div>

          </div>
        </section>

        {/* Section 3: Services & Skills */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2 mb-6">
            <Code2 className="w-6 h-6 text-blue-600" />
            <span>Services & Technical Matrix</span>
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Service Category</th>
                  <th className="p-4">Deliverables & Scope</th>
                  <th className="p-4">Best For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm bg-white">
                <tr>
                  <td className="p-4 font-bold text-slate-900">Mobile Apps (iOS & Android)</td>
                  <td className="p-4 text-slate-700">Flutter / React Native cross-platform apps, offline sync, app store deployment.</td>
                  <td className="p-4 text-slate-600 font-medium">Startups & mobile product teams</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900">Full-Stack Web Portals</td>
                  <td className="p-4 text-slate-700">Next.js / React web applications, SaaS platforms, high-speed UI/UX interfaces.</td>
                  <td className="p-4 text-slate-600 font-medium">Companies seeking web growth</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900">Real-Time Systems & APIs</td>
                  <td className="p-4 text-slate-700">WebSockets, live tracking, telemetry streaming, REST & GraphQL backend services.</td>
                  <td className="p-4 text-slate-600 font-medium">Logistics, healthcare & delivery apps</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900">Cloud & Database Setup</td>
                  <td className="p-4 text-slate-700">Supabase, PostgreSQL, PostGIS geofencing, Docker, security & performance audits.</td>
                  <td className="p-4 text-slate-600 font-medium">Scalable cloud backends</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Call to Action & Contact */}
        <footer className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Let's Build Your Next Project Together</h2>
              <p className="text-slate-700 text-sm mt-1">
                Available for freelance client projects, contract development, and technical consulting.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handlePrint}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer print:hidden"
              >
                <Printer className="w-4 h-4" />
                <span>Save Portfolio as PDF</span>
              </button>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
