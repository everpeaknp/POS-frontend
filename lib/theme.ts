import type { AppearancePreferences } from "@/lib/types/user";

export const APPEARANCE_STORAGE_KEY = "khata-appearance";
export const AUTH_LOGIN_EVENT = "khata:auth-login";

export const defaultAppearancePreferences: AppearancePreferences = {
  theme: "light",
  language: "en-US",
  timezone: "UTC",
  date_calendar_system: "AD",
  compact_mode: false,
  smooth_animations: true,
};

export function resolveIsDark(theme: AppearancePreferences["theme"]): boolean {
  if (typeof window === "undefined") return false;
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function cacheAppearancePreferences(prefs: AppearancePreferences) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota / private mode
  }
}

export function readCachedAppearancePreferences(): AppearancePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return null;
    return { ...defaultAppearancePreferences, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function applyAppearancePreferences(prefs: AppearancePreferences) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const isDark = resolveIsDark(prefs.theme);

  root.classList.toggle("dark", isDark);
  root.dataset.theme = prefs.theme;
  root.dataset.compact = prefs.compact_mode ? "true" : "false";
  root.dataset.reduceMotion = prefs.smooth_animations ? "false" : "true";
  root.style.colorScheme = isDark ? "dark" : "light";
}

export function applyCachedAppearancePreferences() {
  const cached = readCachedAppearancePreferences();
  if (cached) {
    applyAppearancePreferences(cached);
    return;
  }
  applyAppearancePreferences(defaultAppearancePreferences);
}

export function notifyAppearanceRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_LOGIN_EVENT));
}

/** Inline script source — must stay in sync with resolveIsDark / applyAppearancePreferences */
export const themeBootstrapScript = `(function(){try{var k="khata-appearance";var r=localStorage.getItem(k);var p=r?JSON.parse(r):{theme:"light",compact_mode:false,smooth_animations:true};var t=p.theme||"light";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var el=document.documentElement;el.classList.toggle("dark",d);el.dataset.theme=t;el.dataset.compact=p.compact_mode?"true":"false";el.dataset.reduceMotion=p.smooth_animations===false?"true":"false";el.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
