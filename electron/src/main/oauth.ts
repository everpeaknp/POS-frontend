/**
 * Hosts used by Google Identity Services (GIS) popup OAuth.
 * Must load inside Electron (not shell.openExternal) so window.opener works.
 */
const GOOGLE_OAUTH_HOSTS = new Set([
  "accounts.google.com",
  "accounts.youtube.com",
  "oauthaccountmanager.googleapis.com",
  "www.google.com",
  "google.com",
]);

export function isGoogleOAuthUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return false;
    if (GOOGLE_OAUTH_HOSTS.has(hostname)) return true;
    // Account chooser / consent sometimes hops through googleusercontent
    if (hostname.endsWith(".googleusercontent.com")) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * eSewa ePay checkout / status hosts.
 * Must stay in-app: cancel + openExternal turns POST into GET → HTTP 405.
 */
export function isEsewaPaymentUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return false;
    const host = hostname.toLowerCase();
    return host === "esewa.com.np" || host.endsWith(".esewa.com.np");
  } catch {
    return false;
  }
}

/** In-app content that must never be handed to the OS (print/PDF preview). */
export function isInternalContentUrl(url: string): boolean {
  return (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url === "about:blank" ||
    url.startsWith("about:blank?")
  );
}

/** Safe for shell.openExternal — never blob/data/file/javascript. */
export function isSafeExternalUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" || protocol === "mailto:";
  } catch {
    return false;
  }
}
