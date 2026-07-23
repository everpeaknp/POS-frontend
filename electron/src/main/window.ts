import { app, BrowserWindow, nativeTheme, screen, shell } from "electron";
import path from "path";
import { getStore } from "./desktop-store";
import { isGoogleOAuthUrl, isEsewaPaymentUrl, isInternalContentUrl, isSafeExternalUrl } from "./oauth";

export type WindowBoundsState = {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
  displayId?: number;
};

const MIN_WIDTH = 1100;
const MIN_HEIGHT = 700;
const DEFAULT_WIDTH = 1440;
const DEFAULT_HEIGHT = 900;

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

function restoreBounds(): Partial<Electron.BrowserWindowConstructorOptions> {
  const store = getStore();
  const saved = store.get("window.bounds") as WindowBoundsState | undefined;
  if (!saved) {
    return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, center: true };
  }

  // Keep window on a visible display (multi-monitor safe)
  const displays = screen.getAllDisplays();
  const onScreen = displays.some((d) => {
    const { x, y, width, height } = d.workArea;
    const cx = (saved.x ?? 0) + saved.width / 2;
    const cy = (saved.y ?? 0) + saved.height / 2;
    return cx >= x && cx <= x + width && cy >= y && cy <= y + height;
  });

  if (!onScreen) {
    return { width: saved.width, height: saved.height, center: true };
  }

  return {
    x: saved.x,
    y: saved.y,
    width: Math.max(saved.width, MIN_WIDTH),
    height: Math.max(saved.height, MIN_HEIGHT),
  };
}

function persistBounds(win: BrowserWindow) {
  const store = getStore();
  const isMaximized = win.isMaximized();
  const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
  const display = screen.getDisplayMatching(bounds);
  store.set("window.bounds", {
    ...bounds,
    isMaximized,
    displayId: display.id,
  } satisfies WindowBoundsState);
}

/**
 * Creates the primary application window.
 * Loads the existing Next.js ERP — never a duplicate UI.
 */
export async function createMainWindow(startUrl: string): Promise<BrowserWindow> {
  const store = getStore();
  const preferDark =
    store.get("appearance.theme") === "dark" ||
    (store.get("appearance.theme") !== "light" && nativeTheme.shouldUseDarkColors);

  const isWin = process.platform === "win32";
  const isMac = process.platform === "darwin";
  const preloadPath = path.resolve(__dirname, "..", "preload.js");

  const win = new BrowserWindow({
    ...restoreBounds(),
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    backgroundColor: preferDark ? "#0f172a" : "#F3F4F6",
    title: "Khata",
    // Windows: keep native min/max/close via titleBarOverlay (reliable).
    // macOS: hiddenInset traffic lights. Linux: custom frameless chrome.
    frame: isWin || isMac ? true : false,
    titleBarStyle: isMac ? "hiddenInset" : isWin ? "hidden" : undefined,
    trafficLightPosition: isMac ? { x: 14, y: 12 } : undefined,
    titleBarOverlay: isWin
      ? {
          color: "#1E2A3B",
          symbolColor: "#ffffff",
          height: 40,
        }
      : undefined,
    backgroundMaterial: isWin ? "mica" : undefined,
    vibrancy: isMac ? "under-window" : undefined,
    roundedCorners: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      navigateOnDragDrop: false,
      spellcheck: true,
      devTools: !app.isPackaged,
    },
  });

  win.webContents.on("preload-error", (_event, pathArg, error) => {
    console.error("[khata-desktop] preload-error:", pathArg, error);
  });

  // Defense in depth: strip DevTools in production even if somehow opened
  if (app.isPackaged) {
    win.webContents.on("devtools-opened", () => {
      win.webContents.closeDevTools();
    });
  }

  mainWindow = win;

  const saved = store.get("window.bounds") as WindowBoundsState | undefined;
  if (saved?.isMaximized) {
    win.maximize();
  }

  win.on("ready-to-show", () => {
    win.show();
    win.focus();
  });

  const save = () => persistBounds(win);
  win.on("resize", save);
  win.on("move", save);
  win.on("close", save);

  win.webContents.setWindowOpenHandler(({ url }) => {
    // Print / PDF preview (blob: HTML) must stay inside Electron — never openExternal
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: printPreviewWindowOptions(),
      };
    }

    try {
      if (url === "about:blank" || url.startsWith("about:blank?")) {
        // Used for OAuth bootstrap + invoice/report print popups.
        // did-create-window hardens Google navigations after bootstrap.
        return {
          action: "allow",
          overrideBrowserWindowOptions: printPreviewWindowOptions(),
        };
      }
      const target = new URL(url);
      const appOrigin = new URL(startUrl).origin;
      if (target.origin === appOrigin) {
        return { action: "allow" };
      }
      // GIS needs a real popup with window.opener — not the system browser
      if (isGoogleOAuthUrl(url)) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: oauthPopupOptions(),
        };
      }
      // eSewa checkout may open/redirect in a new browsing context
      if (isEsewaPaymentUrl(url)) {
        return { action: "allow" };
      }
    } catch {
      // fall through
    }

    if (isSafeExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  win.webContents.on("did-create-window", (child, details) => {
    const opened = details.url || "";
    if (opened.startsWith("blob:") || opened.startsWith("data:")) {
      // Print preview window — do not apply OAuth hardening
      return;
    }
    if (
      isGoogleOAuthUrl(opened) ||
      opened === "about:blank" ||
      opened.startsWith("about:blank?")
    ) {
      hardenOAuthPopup(child);
    }
  });

  // Prevent leaving the ERP origin accidentally
  win.webContents.on("will-navigate", (event, url) => {
    if (isInternalContentUrl(url)) return;
    try {
      const target = new URL(url);
      const appOrigin = new URL(startUrl).origin;
      if (
        target.origin !== appOrigin &&
        !isGoogleOAuthUrl(url) &&
        !isEsewaPaymentUrl(url)
      ) {
        event.preventDefault();
        if (isSafeExternalUrl(url)) {
          void shell.openExternal(url);
        }
      }
    } catch {
      event.preventDefault();
    }
  });

  await win.loadURL(startUrl);
  return win;
}

function printPreviewWindowOptions(): Electron.BrowserWindowConstructorOptions {
  return {
    width: 960,
    height: 760,
    minWidth: 640,
    minHeight: 480,
    title: "Print preview",
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      webSecurity: true,
      // Empty print bridge — PDF download only (not full desktop IPC)
      preload: path.join(__dirname, "print-preload.js"),
      devTools: !app.isPackaged,
    },
  };
}

function oauthPopupOptions(): Electron.BrowserWindowConstructorOptions {
  return {
    width: 520,
    height: 720,
    minWidth: 400,
    minHeight: 500,
    title: "Sign in with Google",
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      webSecurity: true,
      // Explicit empty preload so parent Khata bridge is not inherited
      preload: path.join(__dirname, "oauth-preload.js"),
      devTools: !app.isPackaged,
    },
  };
}

function hardenOAuthPopup(child: BrowserWindow) {
  child.setMenuBarVisibility(false);
  child.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternalContentUrl(url) || isGoogleOAuthUrl(url)) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: oauthPopupOptions(),
      };
    }
    if (isSafeExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });
  child.webContents.on("will-navigate", (event, url) => {
    if (isInternalContentUrl(url) || isGoogleOAuthUrl(url)) {
      return;
    }
    event.preventDefault();
    if (isSafeExternalUrl(url)) {
      void shell.openExternal(url);
    }
  });
}

export function openModuleWindow(startUrl: string, routePath: string): BrowserWindow {
  const url = new URL(routePath, startUrl).toString();
  const isWin = process.platform === "win32";
  const isMac = process.platform === "darwin";
  const preloadPath = path.resolve(__dirname, "..", "preload.js");
  const child = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: true,
    title: "Khata",
    frame: isWin || isMac ? true : false,
    titleBarStyle: isMac ? "hiddenInset" : isWin ? "hidden" : undefined,
    titleBarOverlay: isWin
      ? { color: "#1E2A3B", symbolColor: "#ffffff", height: 40 }
      : undefined,
    backgroundMaterial: isWin ? "mica" : undefined,
    vibrancy: isMac ? "under-window" : undefined,
    roundedCorners: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      navigateOnDragDrop: false,
      devTools: !app.isPackaged,
    },
  });
  void child.loadURL(url);
  return child;
}
