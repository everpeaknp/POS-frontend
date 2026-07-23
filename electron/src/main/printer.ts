import { BrowserWindow, Notification, app } from "electron";
import fs from "fs/promises";
import path from "path";
import { setTrayBadge } from "./tray";
import { saveFileDialog } from "./dialogs";

export function showDesktopNotification(payload: {
  title: string;
  body?: string;
  silent?: boolean;
}) {
  if (!Notification.isSupported()) return false;
  const n = new Notification({
    title: payload.title,
    body: payload.body ?? "",
    silent: payload.silent ?? false,
  });
  n.show();
  return true;
}

export function setBadgeCount(count: number) {
  setTrayBadge(count);
  if (process.platform === "linux" || process.platform === "win32") {
    app.setBadgeCount?.(Math.max(0, count));
  }
}

/**
 * Silent / native print via Electron webContents.
 * Prefer this over window.print() when running in desktop.
 */
export async function printSilent(
  win: BrowserWindow,
  options?: Electron.WebContentsPrintOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    win.webContents.print(
      {
        silent: true,
        printBackground: true,
        ...options,
      },
      (success, failureReason) => {
        if (!success) {
          console.error("[print]", failureReason);
        }
        resolve(success);
      }
    );
  });
}

export async function getPrinters(win: BrowserWindow) {
  const anyWc = win.webContents as Electron.WebContents & {
    getPrintersAsync?: () => Promise<Electron.PrinterInfo[]>;
    getPrinters?: () => Electron.PrinterInfo[];
  };
  if (typeof anyWc.getPrintersAsync === "function") {
    return anyWc.getPrintersAsync();
  }
  if (typeof anyWc.getPrinters === "function") {
    return anyWc.getPrinters();
  }
  return [];
}

/**
 * Render current page to PDF and prompt for save location.
 */
export async function printToPdfSave(
  win: BrowserWindow,
  options?: { filename?: string }
): Promise<{ canceled: boolean; filePath?: string }> {
  const base =
    (options?.filename || win.getTitle() || "document")
      .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "document";
  const defaultName = base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;

  const save = await saveFileDialog(win, {
    title: "Save PDF",
    defaultPath: defaultName,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });

  if (save.canceled || !save.filePath) {
    return { canceled: true };
  }

  const pdf = await win.webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
  });

  const filePath = save.filePath.endsWith(".pdf")
    ? save.filePath
    : `${save.filePath}.pdf`;

  await fs.writeFile(filePath, pdf);
  return { canceled: false, filePath: path.resolve(filePath) };
}
