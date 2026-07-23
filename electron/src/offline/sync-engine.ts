import {
  appendLog,
  enqueueMutation,
  listPendingQueue,
  markQueue,
  queueStats,
  type QueueItemInput,
} from "./db";
import type { NetworkMonitor } from "./network-monitor";

export type SyncStatus = {
  running: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  queue: Record<string, number>;
  network: ReturnType<NetworkMonitor["getSnapshot"]>;
};

/**
 * Smart sync engine (OF-0):
 * - Pushes outbox mutations with the same HTTP method/URL/body (API contracts unchanged)
 * - Pull adapters for entity mirrors land in OF-2
 */
export class SyncEngine {
  private apiBase: string;
  private network: NetworkMonitor;
  private running = false;
  private lastSyncAt: string | null = null;
  private lastError: string | null = null;
  private timer: NodeJS.Timeout | null = null;
  private getAccessToken: () => string | null;

  constructor(opts: {
    apiBase: string;
    network: NetworkMonitor;
    /** Token supplied from renderer via IPC before sync, or env for diagnostics */
    getAccessToken?: () => string | null;
  }) {
    this.apiBase = opts.apiBase.replace(/\/$/, "");
    this.network = opts.network;
    this.getAccessToken = opts.getAccessToken ?? (() => null);
  }

  setTokenProvider(fn: () => string | null) {
    this.getAccessToken = fn;
  }

  start(intervalMs = 20000) {
    this.timer = setInterval(() => {
      void this.syncNow("scheduled");
    }, intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  getStatus(): SyncStatus {
    return {
      running: this.running,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
      queue: queueStats(),
      network: this.network.getSnapshot(),
    };
  }

  enqueue(input: QueueItemInput) {
    const row = enqueueMutation(input);
    appendLog("info", "enqueue", {
      id: row.id,
      method: row.method,
      url: row.url,
    });
    return row;
  }

  async syncNow(reason: string = "manual"): Promise<SyncStatus> {
    if (this.running) return this.getStatus();

    const net = await this.network.check();
    if (!net.apiOk || net.state === "auth_expired") {
      this.lastError = net.detail || net.state;
      appendLog("warn", "sync_skipped", { reason, network: net.state });
      return this.getStatus();
    }

    this.running = true;
    appendLog("info", "sync_start", { reason });

    try {
      await this.pushOutbox();
      // Pull hooks (OF-2): entity adapters registered here
      this.lastSyncAt = new Date().toISOString();
      this.lastError = null;
      appendLog("info", "sync_complete", { reason, queue: queueStats() });
    } catch (e) {
      this.lastError = e instanceof Error ? e.message : String(e);
      appendLog("error", "sync_failed", { reason, error: this.lastError });
    } finally {
      this.running = false;
    }

    return this.getStatus();
  }

  private async pushOutbox() {
    const pending = listPendingQueue(25);
    const token = this.getAccessToken();

    for (const row of pending) {
      markQueue(row.id, { status: "processing" });
      try {
        const url = row.url.startsWith("http")
          ? row.url
          : `${this.apiBase}${row.url.startsWith("/") ? "" : "/"}${row.url}`;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Client-Mutation-Id": row.client_mutation_id,
          ...(row.headers ? (JSON.parse(row.headers) as Record<string, string>) : {}),
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(url, {
          method: row.method,
          headers,
          body:
            row.body && row.method !== "GET" && row.method !== "HEAD"
              ? row.body
              : undefined,
        });

        if (res.status === 401) {
          markQueue(row.id, {
            status: "pending",
            last_error: "auth_expired",
            next_attempt_at: new Date(Date.now() + 60_000).toISOString(),
          });
          appendLog("warn", "push_auth_expired", { id: row.id });
          break;
        }

        if (res.status === 409) {
          markQueue(row.id, {
            status: "conflict",
            last_error: await safeText(res),
          });
          appendLog("warn", "push_conflict", { id: row.id });
          continue;
        }

        if (!res.ok) {
          const retries = row.retries + 1;
          const failed = retries >= row.max_retries;
          const backoffMs = Math.min(15 * 60_000, 2 ** retries * 1000);
          markQueue(row.id, {
            status: failed ? "failed" : "pending",
            retries,
            last_error: `HTTP ${res.status}: ${await safeText(res)}`,
            next_attempt_at: new Date(Date.now() + backoffMs).toISOString(),
          });
          continue;
        }

        markQueue(row.id, { status: "done", last_error: null, next_attempt_at: null });
        appendLog("info", "push_ok", { id: row.id, status: res.status });
      } catch (e) {
        const retries = row.retries + 1;
        const failed = retries >= row.max_retries;
        const backoffMs = Math.min(15 * 60_000, 2 ** retries * 1000);
        markQueue(row.id, {
          status: failed ? "failed" : "pending",
          retries,
          last_error: e instanceof Error ? e.message : String(e),
          next_attempt_at: new Date(Date.now() + backoffMs).toISOString(),
        });
      }
    }
  }
}

async function safeText(res: Response) {
  try {
    return (await res.text()).slice(0, 400);
  } catch {
    return "";
  }
}
