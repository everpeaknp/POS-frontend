import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khata - CRM & Billing Platform",
};

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  // Web: min-h-screen. Desktop (.khata-desktop): fill chrome + allow child scroll.
  return (
    <div className="erp-layout flex flex-col bg-[#F3F4F6] dark:bg-background">
      {children}
    </div>
  );
}
