import { app, BrowserWindow } from "electron";
import path from "path";
import { createMainWindow } from "./window";
import { buildAppMenu } from "./menu";
import { createTray } from "./tray";
import { registerIpcHandlers } from "./ipc";
import { applySecurityPolicy } from "./security";
import { showSplash, closeSplash } from "./splash";
import { initAutoUpdater } from "./updater";
import { registerShortcuts } from "./shortcuts";
import { getStore } from "./desktop-store";
import { startOfflineSystem, stopOfflineSystem } from "../offline";
import { setPermissionContext } from "../security/permissions";
import { auditLog } from "../security/audit";

/**
 * Resolve the URL of the existing Next.js ERP.
 * Dev → localhost:3000 | Prod → env or packaged local server URL.
 */
function resolveStartUrl(): string {
  if (process.env.KHATA_RENDERER_URL) {
    return process.env.KHATA_RENDERER_URL;
  }
  if (!app.isPackaged) {
    return "http://localhost:3000";
  }
  return process.env.KHATA_PROD_URL || "http://127.0.0.1:3000";
}

function resolveApiBase(): string {
  return (
    process.env.KHATA_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api"
  );
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins[0]) {
      if (wins[0].isMinimized()) wins[0].restore();
      wins[0].focus();
    }
  });
}

app.whenReady().then(async () => {
  const startUrl = resolveStartUrl();
  const apiBase = resolveApiBase();

  setPermissionContext({ role: "viewer", isPackaged: app.isPackaged });
  applySecurityPolicy(new URL(startUrl).origin);
  auditLog("app", "start", { packaged: app.isPackaged });

  try {
    const { dbPath } = await startOfflineSystem(apiBase);
    console.log("[offline] SQLite ready:", dbPath);
  } catch (err) {
    console.error("[offline] Failed to start offline system:", err);
  }

  registerIpcHandlers(apiBase);

  showSplash();

  const last = getStore().get("workspace.lastRoute");
  const bootUrl =
    last && typeof last === "string" && last.startsWith("/")
      ? new URL(last, startUrl).toString()
      : startUrl;

  try {
    const win = await createMainWindow(bootUrl);
    closeSplash();
    buildAppMenu(startUrl);
    createTray();
    registerShortcuts(startUrl);

    if (app.isPackaged) {
      initAutoUpdater();
    }

    win.on("closed", () => {
      // keep tray alive
    });
  } catch (firstErr) {
    // Last-route restore can fail (stale path / Next still compiling) — retry home
    if (bootUrl !== startUrl) {
      console.warn("[khata-desktop] Boot route failed, retrying home:", firstErr);
      try {
        getStore().set("workspace.lastRoute", "/");
        const win = await createMainWindow(startUrl);
        closeSplash();
        buildAppMenu(startUrl);
        createTray();
        registerShortcuts(startUrl);
        win.on("closed", () => {});
        return;
      } catch (retryErr) {
        closeSplash();
        console.error("[khata-desktop] Failed to load renderer:", retryErr);
        app.quit();
        return;
      }
    }
    closeSplash();
    console.error("[khata-desktop] Failed to load renderer:", firstErr);
    app.quit();
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow(startUrl);
    }
  });
});

app.on("before-quit", () => {
  auditLog("app", "quit", {});
  stopOfflineSystem();
});

app.on("window-all-closed", () => {
  if (process.platform === "darwin") {
    // macOS: keep running
  }
});

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("khata", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("khata");
}
