"use client";

import { useEffect, useState } from "react";
import {
  Wifi,
  WifiOff,
  Server,
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
  Activity,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { desktop, getDesktopApi, type OfflineStatus } from "@/lib/desktop";
import { useDesktopWorkspaceOptional } from "@/lib/context/DesktopWorkspaceContext";

export function DesktopStatusBar() {
  const { user } = useAuth();
  const ws = useDesktopWorkspaceOptional();
  const [online, setOnline] = useState(true);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [version, setVersion] = useState("—");
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null);
  const [vaultOk, setVaultOk] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const res = await desktop.checkApi();
      if (!cancelled) setApiOk(res.ok);
      const api = getDesktopApi();
      if (api && !cancelled) {
        setVersion(await api.app.getVersion());
        const st = (await api.offline?.getStatus()) ?? null;
        setOfflineStatus(st);
        try {
          const vs = await api.security?.vaultStatus();
          if (!cancelled) setVaultOk(vs?.encrypted ?? null);
        } catch {
          if (!cancelled) setVaultOk(null);
        }
      }
    };
    void tick();
    const id = window.setInterval(tick, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const netState = offlineStatus?.network.state;
  const pending =
    (offlineStatus?.queue.pending || 0) + (offlineStatus?.queue.failed || 0);
  const syncing = offlineStatus?.running;

  const netLabel =
    netState === "degraded"
      ? "Slow"
      : netState === "server_unreachable"
        ? "API down"
        : netState === "auth_expired"
          ? "Auth"
          : online && apiOk !== false
            ? "Online"
            : "Offline";

  return (
    <footer className="desktop-statusbar h-7 shrink-0 flex items-center gap-3 px-3 text-[11px] bg-[#0f1a24] text-white/75 border-t border-white/10 select-none">
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-white transition-colors"
        onClick={() => ws?.toggleSidebarCollapsed()}
        title="Toggle sidebar"
      >
        {ws?.sidebarCollapsed ? (
          <PanelLeft className="h-3 w-3" />
        ) : (
          <PanelLeftClose className="h-3 w-3" />
        )}
      </button>

      <span className="truncate max-w-[140px]" title={user?.tenant?.name}>
        {user?.tenant?.name || "No org"}
      </span>
      <span className="text-white/30">·</span>
      <span className="truncate max-w-[120px] capitalize">
        {user?.role?.replace("_", " ") || "User"}
      </span>

      <div className="flex-1" />

      <span className="inline-flex items-center gap-1" title="Internet / API network">
        {online && apiOk !== false ? (
          <Wifi className="h-3 w-3 text-[#22C55E]" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-400" />
        )}
        {netLabel}
      </span>

      <span className="inline-flex items-center gap-1" title="API">
        <Server
          className={`h-3 w-3 ${apiOk === false ? "text-red-400" : "text-[#22C55E]"}`}
        />
        API {apiOk === null ? "…" : apiOk ? "OK" : "Down"}
      </span>

      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-white transition-colors"
        title={
          offlineStatus?.lastError
            ? `Sync error: ${offlineStatus.lastError}`
            : "Click to sync now"
        }
        onClick={() => void getDesktopApi()?.offline?.syncNow()}
      >
        <RefreshCw
          className={`h-3 w-3 ${syncing ? "animate-spin text-[#22C55E]" : pending ? "text-amber-400" : "text-[#22C55E]"}`}
        />
        {syncing ? "Syncing…" : pending > 0 ? `Queue ${pending}` : "Synced"}
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-white transition-colors"
        title="Open diagnostics"
        onClick={() => ws?.setDiagnosticsOpen(true)}
      >
        <Activity className="h-3 w-3 text-[#22C55E]" />
        {vaultOk === false ? "Vault off" : "Health"}
      </button>

      <span className="font-mono text-white/50">v{version}</span>
    </footer>
  );
}
