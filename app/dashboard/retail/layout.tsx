"use client";

import { LanguageProvider } from "@/lib/context/LanguageContext";

export default function RetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}
