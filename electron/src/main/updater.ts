import { autoUpdater } from "electron-updater";
import { BrowserWindow, dialog } from "electron";
import { getMainWindow } from "./window";
import { getStore } from "./desktop-store";
import { auditLog } from "../security/audit";

export type UpdateChannel = "latest" | "beta" | "alpha";

/**
 * GitHub Releases updater with channel selection.
 * Safe no-op in unpackaged / unsigned local builds.
 */
export function initAutoUpdater() {
  const store = getStore();
  const channel = store.get("updates.channel") || "latest";

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = channel !== "latest";
  autoUpdater.channel = channel === "latest" ? "latest" : channel;

  autoUpdater.on("checking-for-update", () => {
    auditLog("update", "checking", { channel });
  });

  autoUpdater.on("update-available", (info) => {
    auditLog("update", "available", { version: info.version, channel });
  });

  autoUpdater.on("update-downloaded", async (info) => {
    auditLog("update", "downloaded", { version: info.version });
    const win = getMainWindow();
    const result = await dialog.showMessageBox(
      win ?? (undefined as unknown as BrowserWindow),
      {
        type: "info",
        buttons: ["Restart", "Later"],
        defaultId: 0,
        title: "Update ready",
        message: `Khata ${info.version} has been downloaded. Restart to install?`,
        detail: "You can roll back by reinstalling a previous release if needed.",
      }
    );
    if (result.response === 0) {
      auditLog("update", "install_restart", { version: info.version });
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on("error", (err) => {
    auditLog("update", "error", { message: err.message }, false);
    console.warn("[updater]", err.message);
  });

  try {
    if (process.env.KHATA_SKIP_UPDATER === "1") return;
    void autoUpdater.checkForUpdatesAndNotify();
  } catch (e) {
    console.warn("[updater] skipped", e);
  }
}

export function setUpdateChannel(channel: UpdateChannel) {
  getStore().set("updates.channel", channel);
}
