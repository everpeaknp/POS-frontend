import { globalShortcut, app } from "electron";
import { getMainWindow, openModuleWindow } from "./window";

/**
 * Global shortcuts — desktop only. Unregister on quit.
 */
export function registerShortcuts(startUrl: string) {
  const focusMain = () => {
    const win = getMainWindow();
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  };

  globalShortcut.register("CommandOrControl+Shift+K", focusMain);
  globalShortcut.register("CommandOrControl+Shift+P", () => {
    openModuleWindow(startUrl, "/dashboard/pos");
  });

  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
  });
}
