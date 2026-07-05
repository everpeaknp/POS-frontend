"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/lib/context/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Redirect to ERP page if user doesn't have a tenant
  useEffect(() => {
    if (!loading && user && !user.tenant) {
      router.push('/erp');
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading || !user?.tenant) {
    return (
      <div className="flex h-screen bg-[#F3F4F6] dark:bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F3F4F6] dark:bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div key={pathname} className="flex-1 overflow-y-auto scrollbar-green">
          {children}
        </div>
      </div>
    </div>
  );
}
