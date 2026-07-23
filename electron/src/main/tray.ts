import { app, Tray, Menu, nativeImage, BrowserWindow } from "electron";
import path from "path";
import { getMainWindow } from "./window";

let tray: Tray | null = null;

function iconPath(): string {
  // Fallback: empty image if asset missing (dev-friendly)
  return path.join(__dirname, "..", "..", "assets", "tray.png");
}

/**
 * System tray — show/hide main window; quit app.
 */
export function createTray(): Tray | null {
  if (tray) return tray;

  let image = nativeImage.createEmpty();
  try {
    const loaded = nativeImage.createFromPath(iconPath());
    if (!loaded.isEmpty()) image = loaded.resize({ width: 16, height: 16 });
  } catch {
    // no asset yet
  }

  tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image);
  tray.setToolTip("Khata Business OS");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Khata",
      click: () => {
        const win = getMainWindow();
        if (win) {
          if (win.isMinimized()) win.restore();
          win.show();
          win.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    const win = getMainWindow();
    win?.show();
    win?.focus();
  });

  return tray;
}

export function setTrayBadge(count: number) {
  if (process.platform === "darwin" && app.dock) {
    app.dock.setBadge(count > 0 ? String(count) : "");
  }
  // Windows overlay icon can be added later with a generated badge bitmap
  void BrowserWindow;
}
