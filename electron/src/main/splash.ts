import { BrowserWindow, app } from "electron";
import path from "path";

let splash: BrowserWindow | null = null;

/**
 * Lightweight splash — no business UI duplication.
 */
export function showSplash(): BrowserWindow {
  splash = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    movable: true,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#14532d",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body{margin:0;font-family:Segoe UI,system-ui,sans-serif;background:linear-gradient(160deg,#14532d,#166534 55%,#22C55E);
  color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh}
  h1{font-size:28px;margin:0 0 8px;font-weight:800;letter-spacing:-.02em}
  p{opacity:.85;margin:0 0 24px;font-size:13px}
  .bar{width:220px;height:6px;background:rgba(255,255,255,.2);border-radius:99px;overflow:hidden}
  .fill{height:100%;width:30%;background:#fff;border-radius:inherit;animation:a 1.2s ease-in-out infinite}
  @keyframes a{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}
  .ver{position:absolute;bottom:16px;opacity:.6;font-size:11px}
</style></head><body>
  <h1>Khata</h1>
  <p>Starting your workspace…</p>
  <div class="bar"><div class="fill"></div></div>
  <div class="ver">v${app.getVersion()}</div>
</body></html>`;

  void splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  return splash;
}

export function closeSplash() {
  if (splash && !splash.isDestroyed()) {
    splash.close();
  }
  splash = null;
}

export function splashAssetDir() {
  return path.join(__dirname, "..", "..", "assets");
}
