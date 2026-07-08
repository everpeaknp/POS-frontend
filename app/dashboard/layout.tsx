"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { PageLoading } from "@/components/shared/PageLoading";
import { useAuth } from "@/lib/context/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, refreshUser } = useAuth();
  const [accessChecked, setAccessChecked] = useState(false);

  // Re-fetch profile so a just-disabled membership cannot keep an open dashboard session
  useEffect(() => {
    let cancelled = false;

    const verifyOrgAccess = async () => {
      if (loading) return;
      if (!user) {
        if (!cancelled) setAccessChecked(true);
        return;
      }

      try {
        await refreshUser();
      } catch {
        // AuthContext handles refresh failures
      } finally {
        if (!cancelled) setAccessChecked(true);
      }
    };

    verifyOrgAccess();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (!loading && accessChecked && user && !user.tenant) {
      localStorage.removeItem("active_tenant_slug");
      router.replace("/erp");
    }
  }, [user, loading, accessChecked, router]);

  if (loading || !accessChecked || !user?.tenant) {
    return <PageLoading fullScreen message="Loading dashboard…" />;
  }

  return (
    <div className="flex h-screen bg-[#F3F4F6] dark:bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div key={pathname} className="flex flex-1 min-h-0 flex-col overflow-y-auto scrollbar-green">
          {children}
        </div>
      </div>
    </div>
  );
}
