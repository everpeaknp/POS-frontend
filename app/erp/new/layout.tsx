import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Organization - Khata",
};

export default function NewOrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {children}
    </div>
  );
}
