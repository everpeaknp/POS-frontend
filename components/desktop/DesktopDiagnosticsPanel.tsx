"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, X } from "lucide-react";
import {
  getDesktopApi,
  type AuditLogEntry,
  type DiagnosticsSnapshot,
} from "@/lib/desktop";
import { useDesktopWorkspace } from "@/lib/context/DesktopWorkspaceContext";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Desktop diagnostics drawer — memory, offline DB, capabilities, recent audit.
 */
export function DesktopDiagnosticsPanel() {
  const { enabled, diagnosticsOpen, setDiagnosticsOpen } = useDesktopWorkspace();
  const [snap, setSnap] = useState<DiagnosticsSnapshot | null>(null);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const sec = getDesktopApi()?.security;
    if (!sec) {
      setError("Security API unavailable");
      return;
    }
    try {
      setError(null);
      const [d, logs] = await Promise.all([sec.diagnostics(), sec.auditList(40)]);
      setSnap(d);
      setAudit(logs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load diagnostics");
    }
  }, []);

  useEffect(() => {
    if (!enabled || !diagnosticsOpen) return;
    void refresh();
    const id = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(id);
  }, [enabled, diagnosticsOpen, refresh]);

  if (!enabled || !diagnosticsOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40" role="dialog">
      <button
        type="button"
        className="flex-1 cursor-default"
        aria-label="Close diagnostics"
        onClick={() => setDiagnosticsOpen(false)}
      />
      <aside className="w-full max-w-md h-full bg-[#0f1a24] text-white shadow-2xl flex flex-col border-l border-white/10">
        <header className="flex items-center gap-2 px-4 h-12 border-b border-white/10 shrink-0">
          <Activity className="h-4 w-4 text-[#22C55E]" />
          <h2 className="text-sm font-semibold flex-1">Diagnostics</h2>
          <button
            type="button"
            className="p-1 rounded hover:bg-white/10"
            onClick={() => setDiagnosticsOpen(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {error && <p className="text-red-400">{error}</p>}

          {snap && (
            <>
              <section>
                <h3 className="text-white/50 uppercase tracking-wide mb-2">Runtime</h3>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono">
                  <dt className="text-white/40">App</dt>
                  <dd>v{snap.appVersion}</dd>
                  <dt className="text-white/40">Electron</dt>
                  <dd>{snap.electronVersion}</dd>
                  <dt className="text-white/40">Platform</dt>
                  <dd>
                    {snap.platform}/{snap.arch}
                  </dd>
                  <dt className="text-white/40">Uptime</dt>
                  <dd>{snap.uptimeSec}s</dd>
                  <dt className="text-white/40">Packaged</dt>
                  <dd>{snap.packaged ? "yes" : "no"}</dd>
                </dl>
              </section>

              <section>
                <h3 className="text-white/50 uppercase tracking-wide mb-2">Memory</h3>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono">
                  <dt className="text-white/40">RSS</dt>
                  <dd>{fmtBytes(snap.memory.rss)}</dd>
                  <dt className="text-white/40">Heap</dt>
                  <dd>
                    {fmtBytes(snap.memory.heapUsed)} / {fmtBytes(snap.memory.heapTotal)}
                  </dd>
                  <dt className="text-white/40">System free</dt>
                  <dd>
                    {fmtBytes(snap.system.freeMem)} / {fmtBytes(snap.system.totalMem)}
                  </dd>
                  <dt className="text-white/40">CPUs</dt>
                  <dd>{snap.system.cpus}</dd>
                </dl>
              </section>

              <section>
                <h3 className="text-white/50 uppercase tracking-wide mb-2">Security</h3>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono">
                  <dt className="text-white/40">Vault</dt>
                  <dd>{snap.security.vaultEncrypted ? "encrypted" : "plaintext fallback"}</dd>
                  <dt className="text-white/40">Role</dt>
                  <dd className="capitalize">{snap.security.role}</dd>
                </dl>
                <p className="mt-2 text-white/50">Capabilities</p>
                <p className="font-mono text-white/80 break-words">
                  {snap.security.capabilities.join(", ") || "none"}
                </p>
              </section>

              <section>
                <h3 className="text-white/50 uppercase tracking-wide mb-2">Offline</h3>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono">
                  <dt className="text-white/40">DB</dt>
                  <dd>
                    {snap.offline.dbExists
                      ? fmtBytes(snap.offline.dbSizeBytes)
                      : "missing"}
                  </dd>
                  <dt className="text-white/40">Queue</dt>
                  <dd>{JSON.stringify(snap.offline.queue)}</dd>
                </dl>
              </section>
            </>
          )}

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white/50 uppercase tracking-wide">Audit (recent)</h3>
              <button
                type="button"
                className="text-[#22C55E] hover:underline"
                onClick={() => void refresh()}
              >
                Refresh
              </button>
            </div>
            <ul className="space-y-1.5 max-h-56 overflow-y-auto">
              {audit.length === 0 && (
                <li className="text-white/40">No audit entries yet</li>
              )}
              {audit.map((row, i) => (
                <li
                  key={`${row.ts}-${i}`}
                  className="font-mono text-[10px] leading-snug border-b border-white/5 pb-1"
                >
                  <span className="text-white/40">{row.ts?.slice(11, 19)}</span>{" "}
                  <span className={row.ok === false ? "text-red-400" : "text-[#22C55E]"}>
                    {row.category}/{row.action}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}
