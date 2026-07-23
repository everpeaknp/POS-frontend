/**
 * Preload — contextIsolation bridge.
 * Exposes a minimal, typed API as window.khataDesktop.
 * NEVER enable nodeIntegration in the renderer.
 */
import { contextBridge, ipcRenderer } from "electron";
import { IPC, ALLOWED_CHANNELS } from "./ipc/channels";

function invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  if (!ALLOWED_CHANNELS.includes(channel)) {
    return Promise.reject(new Error(`Blocked IPC channel: ${channel}`));
  }
  return ipcRenderer.invoke(channel, ...args) as Promise<T>;
}

const api = {
  isElectron: true as const,
  platform: process.platform,

  window: {
    minimize: () => invoke(IPC.WINDOW_MINIMIZE),
    maximizeToggle: () => invoke(IPC.WINDOW_MAXIMIZE),
    close: () => invoke(IPC.WINDOW_CLOSE),
    isMaximized: () => invoke<boolean>(IPC.WINDOW_IS_MAXIMIZED),
    getState: () => invoke(IPC.WINDOW_GET_STATE),
  },

  dialog: {
    open: (options?: unknown) => invoke(IPC.DIALOG_OPEN, options),
    save: (options?: unknown) => invoke(IPC.DIALOG_SAVE, options),
    message: (options: unknown) => invoke(IPC.DIALOG_MESSAGE, options),
  },

  store: {
    get: (key: string) => invoke(IPC.STORE_GET, key),
    set: (key: string, value: unknown) => invoke(IPC.STORE_SET, key, value),
    delete: (key: string) => invoke(IPC.STORE_DELETE, key),
  },

  print: {
    silent: (options?: unknown) => invoke<boolean>(IPC.PRINT_SILENT, options),
    getPrinters: () => invoke(IPC.PRINT_GET_PRINTERS),
    downloadPdf: (options?: { filename?: string }) =>
      invoke<{ canceled: boolean; filePath?: string }>(IPC.PRINT_TO_PDF, options),
  },

  notify: {
    show: (payload: { title: string; body?: string; silent?: boolean }) =>
      invoke(IPC.NOTIFY_SHOW, payload),
    setBadge: (count: number) => invoke(IPC.NOTIFY_SET_BADGE, count),
  },

  app: {
    getVersion: () => invoke<string>(IPC.APP_GET_VERSION),
    getPlatform: () => invoke<string>(IPC.APP_GET_PLATFORM),
    checkApi: () => invoke<{ ok: boolean; status: number }>(IPC.APP_CHECK_API),
  },

  shell: {
    openExternal: (url: string) => invoke(IPC.SHELL_OPEN_EXTERNAL, url),
    showItemInFolder: (filePath: string) => invoke(IPC.SHELL_SHOW_ITEM, filePath),
  },

  offline: {
    getStatus: () => invoke(IPC.OFFLINE_STATUS),
    enqueue: (payload: unknown) => invoke(IPC.OFFLINE_ENQUEUE, payload),
    syncNow: () => invoke(IPC.OFFLINE_SYNC_NOW),
    queueStats: () => invoke(IPC.OFFLINE_QUEUE_STATS),
    cacheGet: (entity: string, id: string) => invoke(IPC.OFFLINE_CACHE_GET, entity, id),
    cachePut: (entity: string, id: string, payload: unknown, version?: string) =>
      invoke(IPC.OFFLINE_CACHE_PUT, entity, id, payload, version),
    cacheList: (entity: string, limit?: number) =>
      invoke(IPC.OFFLINE_CACHE_LIST, entity, limit),
    logs: (limit?: number) => invoke(IPC.OFFLINE_LOGS, limit),
    setToken: (token: string | null) => invoke(IPC.OFFLINE_SET_TOKEN, token),
  },

  security: {
    vaultStatus: () => invoke<{ encrypted: boolean }>(IPC.SEC_VAULT_STATUS),
    vaultGet: (key: string) => invoke<string | null>(IPC.SEC_VAULT_GET, key),
    vaultSet: (key: string, value: string) => invoke(IPC.SEC_VAULT_SET, key, value),
    vaultDelete: (key: string) => invoke(IPC.SEC_VAULT_DELETE, key),
    setContext: (payload: { role?: string; userId?: string; org?: string }) =>
      invoke(IPC.SEC_SET_CONTEXT, payload),
    capabilities: () => invoke<string[]>(IPC.SEC_CAPABILITIES),
    can: (capability: string) => invoke<boolean>(IPC.SEC_CAN, capability),
    audit: (payload: {
      category: string;
      action: string;
      detail?: unknown;
      ok?: boolean;
    }) => invoke(IPC.SEC_AUDIT, payload),
    auditList: (limit?: number) => invoke(IPC.SEC_AUDIT_LIST, limit),
    diagnostics: () => invoke(IPC.SEC_DIAGNOSTICS),
  },
};

contextBridge.exposeInMainWorld("khataDesktop", api);

export type KhataDesktopApi = typeof api;
