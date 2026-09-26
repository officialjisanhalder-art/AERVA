import { Heart } from "lucide-react";
import Image from "next/image";

const links = [
  { name: "Home", href: "#home" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "For Hospitals", href: "#for-hospitals" },
  { name: "Impact", href: "#impact" },
  { name: "About", href: "#about" },
];

export function Footer() {
  return (
    <footer className="bg-brand-navy py-12 border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-2.5">
            <Image
              src="/nearer-mark.png"
              alt="NearER"
              width={34}
              height={22}
              className="h-7 w-auto object-contain"
            />
            <span className="text-white font-bold text-xl tracking-tight">Near<span className="text-[#00B2FF]">ER</span></span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {links.map((link) => (
              <a key={link.name} href={link.href} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                {link.name}
              </a>
            ))}
          </div>
          
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} NearER Technologies. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-brand-red fill-current" /> for emergency intelligence
          </p>
        </div>
      </div>
    </footer>
  );
}
