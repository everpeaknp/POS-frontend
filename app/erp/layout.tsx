import type { Metadata } from "next";
import { ErpShell } from "@/components/erp/ErpShell";

export const metadata: Metadata = {
  title: "Khata - CRM & Billing Platform",
};

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return <ErpShell>{children}</ErpShell>;
}
