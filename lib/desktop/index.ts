/**
 * Web-safe desktop bridge.
 * Uses window.khataDesktop when running inside Electron; no-ops / fallbacks on web.
 */

export type OfflineStatus = {
  running: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  queue: Record<string, number>;
  network: {
    state: string;
    online: boolean;
    apiOk: boolean;
    latencyMs: number | null;
    checkedAt: string;
    detail?: string;
  };
};

export type DiagnosticsSnapshot = {
  appVersion: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  packaged: boolean;
  uptimeSec: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers?: number;
  };
  system: {
    totalMem: number;
    freeMem: number;
    cpus: number;
    loadavg: number[];
  };
  paths: {
    userData: string;
    logs: string;
    offlineDb: string;
    auditLog: string;
  };
  security: {
    vaultEncrypted: boolean;
    role: string;
    capabilities: string[];
  };
  offline: {
    queue: Record<string, number>;
    dbExists: boolean;
    dbSizeBytes: number;
  };
};

export type AuditLogEntry = {
  ts: string;
  category: string;
  action: string;
  detail?: unknown;
  ok?: boolean;
  userId?: string;
  role?: string;
  org?: string;
};

export type KhataDesktopApi = {
  isElectron: true;
  platform: NodeJS.Platform | string;
  window: {
    minimize: () => Promise<void>;
    maximizeToggle: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    getState: () => Promise<unknown>;
  };
  dialog: {
    open: (options?: unknown) => Promise<{ canceled: boolean; filePaths: string[] }>;
    save: (options?: unknown) => Promise<{ canceled: boolean; filePath?: string }>;
    message: (options: unknown) => Promise<unknown>;
  };
  store: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  print: {
    silent: (options?: unknown) => Promise<boolean>;
    getPrinters: () => Promise<unknown[]>;
    downloadPdf?: (options?: { filename?: string }) => Promise<{
      canceled: boolean;
      filePath?: string;
    }>;
  };
  notify: {
    show: (payload: { title: string; body?: string; silent?: boolean }) => Promise<boolean>;
    setBadge: (count: number) => Promise<void>;
  };
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    checkApi: () => Promise<{ ok: boolean; status: number }>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
    showItemInFolder: (filePath: string) => Promise<void>;
  };
  offline?: {
    getStatus: () => Promise<OfflineStatus | null>;
    enqueue: (payload: {
      clientMutationId: string;
      method: string;
      url: string;
      body?: string | null;
      headers?: Record<string, string>;
      priority?: number;
    }) => Promise<unknown>;
    syncNow: () => Promise<OfflineStatus>;
    queueStats: () => Promise<Record<string, number>>;
    cacheGet: (entity: string, id: string) => Promise<unknown>;
    cachePut: (
      entity: string,
      id: string,
      payload: unknown,
      version?: string
    ) => Promise<void>;
    cacheList: (entity: string, limit?: number) => Promise<unknown[]>;
    logs: (limit?: number) => Promise<unknown[]>;
    setToken: (token: string | null) => Promise<void>;
  };
  security?: {
    vaultStatus: () => Promise<{ encrypted: boolean }>;
    vaultGet: (key: string) => Promise<string | null>;
    vaultSet: (key: string, value: string) => Promise<void>;
    vaultDelete: (key: string) => Promise<void>;
    setContext: (payload: {
      role?: string;
      userId?: string;
      org?: string;
    }) => Promise<void>;
    capabilities: () => Promise<string[]>;
    can: (capability: string) => Promise<boolean>;
    audit: (payload: {
      category: string;
      action: string;
      detail?: unknown;
      ok?: boolean;
    }) => Promise<unknown>;
    auditList: (limit?: number) => Promise<AuditLogEntry[]>;
    diagnostics: () => Promise<DiagnosticsSnapshot>;
  };
};

declare global {
  interface Window {
    khataDesktop?: KhataDesktopApi;
  }
}

export function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  if (window.khataDesktop?.isElectron) return true;
  // UA may have Electron stripped by the desktop shell; keep a few fallbacks.
  if (typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent)) {
    return true;
  }
  // Desktop chrome sets data attribute on <html> from DesktopRootChrome
  if (typeof document !== "undefined" && document.documentElement.dataset.khataDesktop === "1") {
    return true;
  }
  return false;
}

/** Detect OS inside Electron without requiring preload */
export function getDesktopPlatform(): string {
  const api = getDesktopApi();
  if (api?.platform) return String(api.platform);
  if (typeof navigator === "undefined") return "win32";
  const ua = navigator.userAgent;
  if (/Macintosh|Mac OS X/i.test(ua)) return "darwin";
  if (/Windows/i.test(ua)) return "win32";
  return "linux";
}

/** Typed accessor — undefined on web */
export function getDesktopApi(): KhataDesktopApi | undefined {
  if (typeof window === "undefined") return undefined;
  return window.khataDesktop;
}

/**
 * Convenience façade used by UI code.
 * Never throws on web; methods become safe no-ops / browser fallbacks.
 */
export const desktop = {
  get isElectron() {
    return isElectron();
  },

  async printSilent(options?: unknown): Promise<boolean> {
    const api = getDesktopApi();
    if (api) return api.print.silent(options);
    if (typeof window !== "undefined") {
      window.print();
      return true;
    }
    return false;
  },

  async notify(title: string, body?: string) {
    const api = getDesktopApi();
    if (api) return api.notify.show({ title, body });
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body });
        return true;
      }
    }
    return false;
  },

  async openExternal(url: string) {
    const api = getDesktopApi();
    if (api) return api.shell.openExternal(url);
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
  },

  async checkApi() {
    const api = getDesktopApi();
    if (api) return api.app.checkApi();
    return { ok: true, status: 200 };
  },

  get offline() {
    return getDesktopApi()?.offline;
  },

  get security() {
    return getDesktopApi()?.security;
  },
};
