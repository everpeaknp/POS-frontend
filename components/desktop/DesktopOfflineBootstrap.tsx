"use client";

import { useEffect } from "react";
import apiClient from "@/lib/api/client";
import { isElectron, getDesktopApi } from "@/lib/desktop";
import { installDesktopOfflineInterceptor } from "@/lib/desktop/offline-interceptor";

/**
 * Installs offline outbox + pushes access token to main-process sync engine.
 * Safe no-op on web.
 */
export function DesktopOfflineBootstrap() {
  useEffect(() => {
    if (!isElectron()) return;
    installDesktopOfflineInterceptor(apiClient);

    const pushToken = () => {
      const api = getDesktopApi();
      const token = localStorage.getItem("access_token");
      void api?.offline?.setToken(token);
    };

    pushToken();
    const id = window.setInterval(pushToken, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
