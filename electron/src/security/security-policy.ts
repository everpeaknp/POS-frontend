import { session, app, shell } from "electron";
import { can } from "./permissions";
import { auditLog } from "./audit";
import { isGoogleOAuthUrl, isEsewaPaymentUrl, isSafeExternalUrl } from "../main/oauth";

/**
 * Harden Chromium session for the ERP origin.
 */
export function applySecurityPolicy(appOrigin: string) {
  const ses = session.defaultSession;

  // GIS / FedCM treat "Electron/…" UA as a non-browser and often hide the button.
  const ua = ses.getUserAgent().replace(/\sElectron\/\S+/g, "");
  ses.setUserAgent(ua);

  // Permission requests gated by desktop capability policy
  ses.setPermissionRequestHandler((_wc, permission, callback) => {
    if (permission === "notifications") {
      callback(true);
      return;
    }
    if (permission === "clipboard-read" || permission === "clipboard-sanitized-write") {
      callback(can("clipboard"));
      return;
    }
    if (permission === "media" || permission === "mediaKeySystem") {
      callback(can("camera") || can("microphone"));
      return;
    }
    if (permission === "display-capture") {
      callback(can("screen_capture"));
      return;
    }
    // Deny geolocation, serial, hid, etc. by default
    callback(false);
  });

  ses.setPermissionCheckHandler((_wc, permission) => {
    if (permission === "notifications") return true;
    if (permission === "clipboard-read") return can("clipboard");
    if (permission === "media") return can("camera") || can("microphone");
    return false;
  });

  // Certificate errors: never ignore in production
  app.on("certificate-error", (event, _webContents, url, error, _cert, callback) => {
    if (!app.isPackaged) {
      // Dev against localhost may use self-signed — still log
      console.warn("[security] certificate-error (dev allow):", url, error);
      event.preventDefault();
      callback(true);
      return;
    }
    auditLog("security", "certificate_error", { url, error }, false);
    callback(false);
  });

  ses.webRequest.onHeadersReceived((details, callback) => {
    // Only harden first-party app responses. Mutating Google GIS / third-party
    // iframe headers (e.g. forcing X-Frame-Options: DENY) breaks login embeds.
    let isAppOrigin = false;
    try {
      isAppOrigin = new URL(details.url).origin === new URL(appOrigin).origin;
    } catch {
      isAppOrigin = false;
    }
    if (!isAppOrigin) {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }

    const headers = { ...details.responseHeaders };

    // Baseline security headers (additive)
    headers["X-Content-Type-Options"] = ["nosniff"];
    // Do not set X-Frame-Options: DENY — it interferes with GIS / FedCM in Electron.
    // Packaged CSP below uses frame-ancestors 'none' instead.
    headers["Referrer-Policy"] = ["strict-origin-when-cross-origin"];
    headers["Permissions-Policy"] = [
      "geolocation=(), payment=(), usb=(), serial=(), hid=(), identity-credentials-get=(self \"https://accounts.google.com\")",
    ];

    if (app.isPackaged) {
      // CSP for packaged desktop — allow self + API host + Google GIS + inline for Next
      try {
        const api = process.env.KHATA_API_URL || process.env.NEXT_PUBLIC_API_URL || "";
        const apiOrigin = api ? new URL(api).origin : "";
        const csp = [
          "default-src 'self'",
          `connect-src 'self' ${appOrigin} ${apiOrigin} https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com`.trim(),
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "style-src 'self' 'unsafe-inline'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
          "frame-src https://accounts.google.com https://*.google.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self' https://esewa.com.np https://*.esewa.com.np https://accounts.google.com",
          "frame-ancestors 'none'",
        ].join("; ");
        headers["Content-Security-Policy"] = [csp];
      } catch {
        // ignore CSP build errors
      }
    }

    callback({ responseHeaders: headers });
  });

  // Block navigations away from app origin at session filter level
  ses.webRequest.onBeforeRequest(
    { urls: ["*://*/*"] },
    (details, callback) => {
      try {
        if (details.resourceType !== "mainFrame") {
          callback({});
          return;
        }
        // Allow local/dev helpers + print/PDF blob previews
        if (
          details.url.startsWith("data:") ||
          details.url.startsWith("blob:") ||
          details.url.startsWith("file:") ||
          details.url.startsWith("devtools:")
        ) {
          callback({});
          return;
        }
        const target = new URL(details.url);
        const allowed = new URL(appOrigin);
        if (target.origin === allowed.origin) {
          callback({});
          return;
        }
        // Allow Google Identity Services OAuth popups (mainFrame loads)
        if (isGoogleOAuthUrl(details.url)) {
          callback({});
          return;
        }
        // Allow eSewa payment form POST / redirects inside Electron.
        // openExternal would drop the POST body and return HTTP 405.
        if (isEsewaPaymentUrl(details.url)) {
          callback({});
          return;
        }
        auditLog("security", "blocked_navigation", { url: details.url }, false);
        if (isSafeExternalUrl(details.url)) {
          void shell.openExternal(details.url);
        }
        callback({ cancel: true });
      } catch {
        callback({ cancel: true });
      }
    }
  );

  auditLog("security", "policy_applied", { appOrigin, packaged: app.isPackaged });
}
