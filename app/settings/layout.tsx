"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AccountSettingsSidebar } from "@/components/settings/AccountSettingsSidebar";
import { PageLoading } from "@/components/shared/PageLoading";
import { useAuth } from "@/lib/context/AuthContext";
import { userApi } from "@/lib/api/user";
import { useIsElectron } from "@/lib/desktop/use-is-electron";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const desktop = useIsElectron();

  useEffect(() => {
    if (!loading && !user) {
      const redirect = encodeURIComponent(pathname || "/settings/profile");
      router.push(`/auth/login?redirect=${redirect}`);
    }
  }, [user, loading, router, pathname]);

  useEffect(() => {
    if (!user) return;
    if (!localStorage.getItem("session_id")) {
      userApi
        .ensureSession()
        .then(({ session_id }) => {
          localStorage.setItem("session_id", session_id);
        })
        .catch(() => {});
    }
  }, [user]);

  if (loading || !user) {
    return <PageLoading fullScreen message="Loading settings…" />;
  }

  return (
    <div
      className={`flex bg-[#F3F4F6] dark:bg-background overflow-hidden ${
        desktop ? "h-full min-h-0" : "h-screen"
      }`}
    >
      <AccountSettingsSidebar />
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        <div
          key={pathname}
          className="flex flex-1 min-h-0 flex-col overflow-y-auto scrollbar-green"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
