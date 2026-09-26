"use client";

import { Droplet } from "lucide-react";
import { useState } from "react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function BloodBankPage() {
  const [statuses, setStatuses] = useState<Record<string, string>>(
    BLOOD_GROUPS.reduce((acc, bg) => ({ ...acc, [bg]: "Available" }), {})
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#050B18]">Blood Bank Inventory</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BLOOD_GROUPS.map((bg) => (
          <div key={bg} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center font-black text-lg border border-red-100">
                {bg}
              </div>
            </div>
            
            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
              {["Available", "Limited", "Unavailable"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatuses({ ...statuses, [bg]: status })}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    statuses[bg] === status 
                      ? status === "Available" ? "bg-green-500 text-white shadow-sm" 
                        : status === "Limited" ? "bg-amber-500 text-white shadow-sm"
                        : "bg-red-500 text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
