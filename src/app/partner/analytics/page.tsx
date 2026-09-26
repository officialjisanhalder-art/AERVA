"use client";

import { TrendingUp, Clock, Users, Activity } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-black text-[#050B18]">Basic Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-green-500 font-bold text-sm flex items-center"><TrendingUp className="w-4 h-4 mr-1"/> +12%</span>
          </div>
          <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-1">Total Referrals</h3>
          <p className="text-3xl font-black text-[#050B18]">142</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-green-500 font-bold text-sm flex items-center"><TrendingUp className="w-4 h-4 mr-1"/> -2m</span>
          </div>
          <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-1">Avg Response Time</h3>
          <p className="text-3xl font-black text-[#050B18]">8 <span className="text-lg text-gray-400">mins</span></p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-1">Most Common</h3>
          <p className="text-3xl font-black text-[#050B18]">Cardiac</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-64 flex flex-col justify-center items-center text-center">
        <Activity className="w-10 h-10 text-gray-300 mb-4" />
        <h3 className="font-bold text-[#050B18] text-lg mb-1">Weekly Trends</h3>
        <p className="text-gray-500 font-medium text-sm">Visual charts will appear here as more data is collected through the MVP phase.</p>
      </div>
    </div>
  );
}
