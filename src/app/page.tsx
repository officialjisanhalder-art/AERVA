import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { TrustedDataStrip, HowItWorks } from "@/components/sections/TrustedDataStrip";
import { HospitalPartnerSection } from "@/components/sections/HospitalPartnerSection";
import { FinalCTASection } from "@/components/sections/FinalCTASection";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="relative bg-white selection:bg-[#0052FF]/20 selection:text-[#0A192F]">
      <Navbar />
      <HeroSection />
      <TrustedDataStrip />
      <HowItWorks />
      <HospitalPartnerSection />
      <FinalCTASection />
      <Footer />
    </main>
  );
}
