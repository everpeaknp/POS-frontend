"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { getDesktopApi, isElectron } from "@/lib/desktop";

const VAULT_ACCESS = "auth.access_token";
const VAULT_REFRESH = "auth.refresh_token";
const DEFAULT_IDLE_MIN = 30;

/**
 * Desktop-only: sync permission context, mirror tokens to OS vault,
 * idle session timeout, navigation audit. No-op on web.
 */
export function DesktopSecurityBootstrap() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const lastUserId = useRef<string | number | null>(null);
  const idleTimer = useRef<number | null>(null);

  // Permission context + login/logout audit
  useEffect(() => {
    if (!isElectron() || loading) return;
    const sec = getDesktopApi()?.security;
    if (!sec) return;

    if (user) {
      void sec.setContext({
        role: user.is_super_admin ? "super_admin" : user.role,
        userId: String(user.id),
        org: user.tenant?.slug || user.tenant?.name || undefined,
      });
      if (lastUserId.current !== user.id) {
        void sec.audit({
          category: "auth",
          action: "session_active",
          detail: { role: user.role, org: user.tenant?.slug },
        });
        lastUserId.current = user.id;
      }
    } else if (lastUserId.current != null) {
      void sec.setContext({ role: "viewer" });
      void sec.audit({ category: "auth", action: "logout" });
      lastUserId.current = null;
      void sec.vaultDelete(VAULT_ACCESS);
      void sec.vaultDelete(VAULT_REFRESH);
    }
  }, [user, loading]);

  // Mirror JWT to OS-backed vault (additive; AuthContext still uses localStorage)
  useEffect(() => {
    if (!isElectron()) return;
    const syncVault = () => {
      const sec = getDesktopApi()?.security;
      if (!sec) return;
      const access = localStorage.getItem("access_token");
      const refresh = localStorage.getItem("refresh_token");
      if (access) void sec.vaultSet(VAULT_ACCESS, access);
      else void sec.vaultDelete(VAULT_ACCESS);
      if (refresh) void sec.vaultSet(VAULT_REFRESH, refresh);
      else void sec.vaultDelete(VAULT_REFRESH);
    };
    syncVault();
    const id = window.setInterval(syncVault, 30_000);
    window.addEventListener("storage", syncVault);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("storage", syncVault);
    };
  }, []);

  // Navigation audit (desktop only)
  useEffect(() => {
    if (!isElectron() || !pathname) return;
    void getDesktopApi()?.security?.audit({
      category: "nav",
      action: "route",
      detail: { path: pathname },
    });
  }, [pathname]);

  // Idle session timeout
  useEffect(() => {
    if (!isElectron() || !user) return;

    let timeoutMin = DEFAULT_IDLE_MIN;
    let cancelled = false;

    const reset = () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        void getDesktopApi()?.security?.audit({
          category: "auth",
          action: "idle_timeout",
          detail: { minutes: timeoutMin },
        });
        logout();
      }, timeoutMin * 60_000);
    };

    void (async () => {
      const raw = await getDesktopApi()?.store.get("security.idleTimeoutMin");
      if (cancelled) return;
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) timeoutMin = n;
      reset();
    })();

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    for (const ev of events) window.addEventListener(ev, reset, { passive: true });

    return () => {
      cancelled = true;
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      for (const ev of events) window.removeEventListener(ev, reset);
    };
  }, [user, logout]);

  return null;
}
