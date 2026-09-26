import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ui/ClientProviders";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NearER - Real-Time Emergency Intelligence",
  description: "Don't just find the nearest hospital. Find the right one.",
  icons: {
    icon: "/nearer-icon-square.png",
    shortcut: "/nearer-icon-square.png",
    apple: "/nearer-icon-square.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable} antialiased`}>
      <body className="min-h-screen bg-white font-sans selection:bg-[#0052FF]/20 selection:text-[#050B18]">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
