import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khata - CRM & Billing Platform",
};

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {children}
    </div>
  );
}
