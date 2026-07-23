import { ipcMain, app, BrowserWindow, shell } from "electron";
import { IPC, ALLOWED_CHANNELS } from "../ipc/channels";
import { getMainWindow } from "./window";
import { storeGet, storeSet, storeDelete } from "./desktop-store";
import { openFileDialog, saveFileDialog, messageBox, openExternal } from "./dialogs";
import { printSilent, getPrinters, printToPdfSave, showDesktopNotification, setBadgeCount } from "./printer";
import {
  getOfflineServices,
  offlineCacheGet,
  offlineCachePut,
  offlineCacheList,
  offlineLogs,
  setOfflineAccessToken,
} from "../offline";
import { assertCan, can, listCapabilities, setPermissionContext } from "../security/permissions";
import { vaultGet, vaultSet, vaultDelete, vaultIsEncrypted } from "../security/vault";
import { auditLog, readAuditLogs, setAuditActor } from "../security/audit";
import { getDiagnostics } from "../security/diagnostics";

function assertChannel(channel: string) {
  if (!ALLOWED_CHANNELS.includes(channel)) {
    throw new Error(`Blocked IPC channel: ${channel}`);
  }
}

function senderWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

/**
 * Register all IPC handlers. Channels are allowlisted.
 */
export function registerIpcHandlers(apiBaseUrl: string) {
  // Validate every invoke against allowlist (defense in depth)
  const wrap =
    (channel: string, handler: (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => unknown) =>
    {
      assertChannel(channel);
      ipcMain.handle(channel, async (event, ...args) => handler(event, ...args));
    };

  wrap(IPC.WINDOW_MINIMIZE, (e) => {
    senderWindow(e)?.minimize();
  });

  wrap(IPC.WINDOW_MAXIMIZE, (e) => {
    const win = senderWindow(e);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });

  wrap(IPC.WINDOW_CLOSE, (e) => {
    senderWindow(e)?.close();
  });

  wrap(IPC.WINDOW_IS_MAXIMIZED, (e) => senderWindow(e)?.isMaximized() ?? false);

  wrap(IPC.WINDOW_GET_STATE, (e) => {
    const win = senderWindow(e);
    if (!win) return null;
    return {
      isMaximized: win.isMaximized(),
      isFullScreen: win.isFullScreen(),
      bounds: win.getBounds(),
    };
  });

  wrap(IPC.DIALOG_OPEN, async (e, opts) =>
    openFileDialog(senderWindow(e), opts as Electron.OpenDialogOptions)
  );

  wrap(IPC.DIALOG_SAVE, async (e, opts) =>
    saveFileDialog(senderWindow(e), opts as Electron.SaveDialogOptions)
  );

  wrap(IPC.DIALOG_MESSAGE, async (e, opts) =>
    messageBox(senderWindow(e), opts as Electron.MessageBoxOptions)
  );

  wrap(IPC.STORE_GET, (_e, key) => storeGet(key as never));
  wrap(IPC.STORE_SET, (_e, key, value) => {
    storeSet(key as never, value);
  });
  wrap(IPC.STORE_DELETE, (_e, key) => storeDelete(key as never));

  wrap(IPC.PRINT_SILENT, async (e, options) => {
    assertCan("printing");
    const win = senderWindow(e) ?? getMainWindow();
    if (!win) return false;
    auditLog("print", "silent_print", {});
    return printSilent(win, options as Electron.WebContentsPrintOptions);
  });

  wrap(IPC.PRINT_GET_PRINTERS, async (e) => {
    assertCan("printing");
    const win = senderWindow(e) ?? getMainWindow();
    if (!win) return [];
    return getPrinters(win);
  });

  wrap(IPC.PRINT_TO_PDF, async (e, options) => {
    assertCan("printing");
    const win = senderWindow(e) ?? getMainWindow();
    if (!win) return { canceled: true };
    const opts = (options || {}) as { filename?: string };
    auditLog("print", "to_pdf", { filename: opts.filename || null });
    return printToPdfSave(win, opts);
  });

  wrap(IPC.NOTIFY_SHOW, (_e, payload) =>
    showDesktopNotification(payload as { title: string; body?: string; silent?: boolean })
  );

  wrap(IPC.NOTIFY_SET_BADGE, (_e, count) => {
    setBadgeCount(Number(count) || 0);
  });

  wrap(IPC.APP_GET_VERSION, () => app.getVersion());
  wrap(IPC.APP_GET_PLATFORM, () => process.platform);

  wrap(IPC.APP_CHECK_API, async () => {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(apiBaseUrl.replace(/\/$/, "") + "/", {
        method: "GET",
        signal: controller.signal,
      }).catch(async () => {
        // Try health-ish root of API host
        return fetch(apiBaseUrl, { method: "GET", signal: controller.signal });
      });
      clearTimeout(t);
      return { ok: !!res && (res.ok || res.status < 500), status: res?.status ?? 0 };
    } catch {
      return { ok: false, status: 0 };
    }
  });

  wrap(IPC.SHELL_OPEN_EXTERNAL, async (_e, url) => {
    await openExternal(String(url));
  });

  wrap(IPC.SHELL_SHOW_ITEM, async (_e, filePath) => {
    shell.showItemInFolder(String(filePath));
  });

  // —— Offline / sync ——
  wrap(IPC.OFFLINE_STATUS, () => {
    try {
      return getOfflineServices().sync.getStatus();
    } catch {
      return null;
    }
  });

  wrap(IPC.OFFLINE_ENQUEUE, (_e, payload) => {
    const p = payload as {
      clientMutationId: string;
      method: string;
      url: string;
      body?: string | null;
      headers?: Record<string, string>;
      priority?: number;
    };
    return getOfflineServices().sync.enqueue(p);
  });

  wrap(IPC.OFFLINE_SYNC_NOW, async () => {
    return getOfflineServices().sync.syncNow("manual");
  });

  wrap(IPC.OFFLINE_QUEUE_STATS, () => {
    return getOfflineServices().sync.getStatus().queue;
  });

  wrap(IPC.OFFLINE_CACHE_GET, (_e, entity, id) => {
    return offlineCacheGet(String(entity), String(id));
  });

  wrap(IPC.OFFLINE_CACHE_PUT, (_e, entity, id, payload, version) => {
    offlineCachePut(String(entity), String(id), payload, version as string | undefined);
  });

  wrap(IPC.OFFLINE_CACHE_LIST, (_e, entity, limit) => {
    return offlineCacheList(String(entity), Number(limit) || 200);
  });

  wrap(IPC.OFFLINE_LOGS, (_e, limit) => {
    return offlineLogs(Number(limit) || 50);
  });

  wrap(IPC.OFFLINE_SET_TOKEN, (_e, token) => {
    setOfflineAccessToken(token ? String(token) : null);
  });

  // —— Security / enterprise ——
  wrap(IPC.SEC_VAULT_STATUS, () => ({
    encrypted: vaultIsEncrypted(),
  }));

  wrap(IPC.SEC_VAULT_GET, (_e, key) => vaultGet(String(key)));
  wrap(IPC.SEC_VAULT_SET, (_e, key, value) => {
    vaultSet(String(key), String(value));
    auditLog("security", "vault_set", { key: String(key) });
  });
  wrap(IPC.SEC_VAULT_DELETE, (_e, key) => {
    vaultDelete(String(key));
    auditLog("security", "vault_delete", { key: String(key) });
  });

  wrap(IPC.SEC_SET_CONTEXT, (_e, payload) => {
    const p = payload as {
      role?: string;
      userId?: string;
      org?: string;
    };
    setPermissionContext({ role: p.role, isPackaged: app.isPackaged });
    setAuditActor({ userId: p.userId, role: p.role, org: p.org });
    auditLog("auth", "context_set", { role: p.role, org: p.org });
  });

  wrap(IPC.SEC_CAPABILITIES, () => listCapabilities());
  wrap(IPC.SEC_CAN, (_e, capability) => can(String(capability) as never));

  wrap(IPC.SEC_AUDIT, (_e, payload) => {
    const p = payload as {
      category: string;
      action: string;
      detail?: unknown;
      ok?: boolean;
    };
    return auditLog(p.category, p.action, p.detail, p.ok !== false);
  });

  wrap(IPC.SEC_AUDIT_LIST, (_e, limit) => readAuditLogs(Number(limit) || 100));

  wrap(IPC.SEC_DIAGNOSTICS, () => getDiagnostics());
}
