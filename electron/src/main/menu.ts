import {
  app,
  Menu,
  BrowserWindow,
  shell,
  type MenuItemConstructorOptions,
} from "electron";
import { openModuleWindow, getMainWindow } from "./window";
import { getStore } from "./desktop-store";

function moduleItems(startUrl: string): MenuItemConstructorOptions[] {
  const open = (route: string) => () => {
    openModuleWindow(startUrl, route);
  };
  return [
    { label: "Dashboard", click: open("/dashboard") },
    { label: "POS", click: open("/dashboard/pos") },
    { label: "Sales", click: open("/dashboard/sales") },
    { label: "Purchase", click: open("/dashboard/purchase") },
    { label: "Inventory", click: open("/dashboard/inventory") },
    { label: "Accounting", click: open("/dashboard/accounting") },
    { label: "HR", click: open("/dashboard/hr") },
    { label: "Reports", click: open("/dashboard/reports") },
    { label: "Settings", click: open("/dashboard/settings/org") },
  ];
}

/**
 * Native application menu — navigates existing Next routes (no duplicate UI).
 */
export function buildAppMenu(startUrl: string): void {
  const isMac = process.platform === "darwin";

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Window",
          accelerator: "CmdOrCtrl+Shift+N",
          click: () => openModuleWindow(startUrl, "/dashboard"),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(!app.isPackaged
          ? ([{ type: "separator" }, { role: "toggleDevTools" }] as MenuItemConstructorOptions[])
          : []),
      ],
    },
    {
      label: "Navigate",
      submenu: moduleItems(startUrl),
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [{ type: "separator" as const }, { role: "front" as const }]
          : [{ role: "close" as const }]),
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Help Desk",
          click: () => {
            const win = getMainWindow();
            if (win) void win.loadURL(new URL("/dashboard/settings/help", startUrl).toString());
          },
        },
        {
          label: "Khata Website",
          click: () => void shell.openExternal("https://khata.app"),
        },
        {
          label: `Version ${app.getVersion()}`,
          enabled: false,
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  // Persist last route hint when main navigates (best-effort)
  const win = getMainWindow();
  win?.webContents.on("did-navigate-in-page", (_e, url) => {
    try {
      const u = new URL(url);
      getStore().set("workspace.lastRoute", u.pathname + u.search);
    } catch {
      // ignore
    }
  });
}
