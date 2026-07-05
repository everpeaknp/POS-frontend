"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AccountSettingsSidebar } from "@/components/settings/AccountSettingsSidebar";
import { useAuth } from "@/lib/context/AuthContext";
import { userApi } from "@/lib/api/user";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    if (!localStorage.getItem("session_id")) {
      userApi.ensureSession().then(({ session_id }) => {
        localStorage.setItem("session_id", session_id);
      }).catch(() => {});
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex h-screen bg-[#F3F4F6] dark:bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F3F4F6] dark:bg-background overflow-hidden">
      <AccountSettingsSidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div key={pathname} className="flex-1 min-h-0 overflow-y-auto scrollbar-green">
          {children}
        </div>
      </div>
    </div>
  );
}
