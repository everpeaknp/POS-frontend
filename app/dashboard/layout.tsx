"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { PageLoading } from "@/components/shared/PageLoading";
import { useAuth } from "@/lib/context/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && !user.tenant) {
      router.push("/erp");
    }
  }, [user, loading, router]);

  if (loading || !user?.tenant) {
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
