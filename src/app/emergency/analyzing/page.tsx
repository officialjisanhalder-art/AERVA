"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Info } from "lucide-react";
import dynamic from "next/dynamic";

const OrbSceneLazy = dynamic(() => import("@/components/3d/OrbScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#0052FF]/20 border-t-[#0052FF] rounded-full animate-spin" />
    </div>
  ),
});

const steps = [
  "Checking emergency type...",
  "Checking hospital capabilities...",
  "Checking live capacity...",
  "Checking travel time...",
  "Checking blood availability...",
  "Verifying data freshness...",
  "Best Match Found!"
];

function AnalyzingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "cardiac";
  
  const [currentStep, setCurrentStep] = useState(0);
  const [firstAidData, setFirstAidData] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFirstAid() {
      try {
        const res = await fetch(`/api/serp/emergency?q=${type}`);
        const data = await res.json();
        if (data.answer_box?.snippet) {
          setFirstAidData(data.answer_box.snippet);
        } else if (data.knowledge_graph?.description) {
          setFirstAidData(data.knowledge_graph.description);
        } else if (data.organic_results?.length > 0) {
          setFirstAidData(data.organic_results[0].snippet);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchFirstAid();
  }, [type]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            router.push(`/emergency/recommendation?type=${type}`);
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [router, type]);

  return (
    <main className="min-h-screen bg-[#050B18] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-12 text-center z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-black mb-2"
        >
          Finding the right care for you
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-sm"
        >
          NearER is analysing nearby emergency-care options.
        </motion.p>
      </div>

      <div className="w-full max-w-[800px] h-[500px] relative z-0">
        <OrbSceneLazy />
      </div>

      <div className="absolute bottom-12 w-full max-w-md px-6 z-10 space-y-4">
        {firstAidData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-900/40 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4 flex gap-3 shadow-lg"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-300 mb-1">
                Live Google First-Aid Tips (SerpApi)
              </div>
              <p className="text-sm text-slate-200 leading-snug font-medium">
                {firstAidData}
              </p>
            </div>
          </motion.div>
        )}

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <div className="space-y-4">
            {steps.map((step, idx) => {
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              
              // Only show a window of steps to not clutter
              if (idx > currentStep + 1 || idx < currentStep - 3) return null;

              return (
                <motion.div 
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ 
                    opacity: isActive ? 1 : isPast ? 0.4 : 0,
                    x: 0,
                    scale: isActive ? 1 : 0.95
                  }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    isPast 
                      ? "bg-[#059669] border-[#059669]" 
                      : isActive 
                        ? "border-[#0052FF]" 
                        : "border-white/20"
                  }`}>
                    {isPast && <Check className="w-3 h-3 text-white" />}
                    {isActive && (
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-2 h-2 bg-[#0052FF] rounded-full"
                      />
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${
                    isActive ? "text-white" : isPast ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {step}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AnalyzingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalyzingContent />
    </Suspense>
  );
}
