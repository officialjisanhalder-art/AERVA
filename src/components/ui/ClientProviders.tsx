"use client";

import dynamic from "next/dynamic";
import { LanguageProvider } from "@/lib/language-context";

const CustomCursor = dynamic(
  () => import("./CustomCursor").then((m) => m.CustomCursor),
  { ssr: false }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CustomCursor />
      {children}
    </LanguageProvider>
  );
}
