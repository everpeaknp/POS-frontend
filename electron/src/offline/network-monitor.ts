export type NetworkState =
  | "online"
  | "offline"
  | "degraded"
  | "server_unreachable"
  | "auth_expired";

export type NetworkSnapshot = {
  state: NetworkState;
  online: boolean;
  apiOk: boolean;
  latencyMs: number | null;
  checkedAt: string;
  detail?: string;
};

type Listener = (snap: NetworkSnapshot) => void;

/**
 * Probes localhost / configured API. Does not touch ERP business logic.
 */
export class NetworkMonitor {
  private apiBase: string;
  private timer: NodeJS.Timeout | null = null;
  private listeners = new Set<Listener>();
  private snapshot: NetworkSnapshot = {
    state: "offline",
    online: false,
    apiOk: false,
    latencyMs: null,
    checkedAt: new Date().toISOString(),
  };

  constructor(apiBase: string) {
    this.apiBase = apiBase.replace(/\/$/, "");
  }

  getSnapshot() {
    return this.snapshot;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.snapshot);
    return () => this.listeners.delete(fn);
  }

  start(intervalMs = 10000) {
    void this.check();
    this.timer = setInterval(() => void this.check(), intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async check(): Promise<NetworkSnapshot> {
    const started = Date.now();
    let apiOk = false;
    let latencyMs: number | null = null;
    let detail: string | undefined;

    // OS-level online is approximate in main; always probe API
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.apiBase}/`, {
        method: "GET",
        signal: controller.signal,
      }).catch(async () =>
        fetch(this.apiBase, { method: "GET", signal: controller.signal })
      );
      clearTimeout(t);
      latencyMs = Date.now() - started;
      apiOk = !!res && res.status < 500;
      if (res?.status === 401) {
        this.snapshot = {
          state: "auth_expired",
          online: true,
          apiOk: false,
          latencyMs,
          checkedAt: new Date().toISOString(),
          detail: "Authentication expired",
        };
        this.emit();
        return this.snapshot;
      }
      if (!apiOk) detail = `HTTP ${res?.status ?? 0}`;
    } catch (e) {
      latencyMs = Date.now() - started;
      detail = e instanceof Error ? e.message : "unreachable";
    }

    let state: NetworkState;
    if (!apiOk) {
      state = latencyMs !== null && latencyMs < 5000 ? "server_unreachable" : "offline";
    } else if (latencyMs !== null && latencyMs > 2500) {
      state = "degraded";
    } else {
      state = "online";
    }

    this.snapshot = {
      state,
      online: state === "online" || state === "degraded",
      apiOk,
      latencyMs,
      checkedAt: new Date().toISOString(),
      detail,
    };
    this.emit();
    return this.snapshot;
  }

  private emit() {
    for (const fn of this.listeners) fn(this.snapshot);
  }
}
