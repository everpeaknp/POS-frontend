import type { AppearancePreferences } from "@/lib/types/user";

export const APPEARANCE_STORAGE_KEY = "khata-appearance";
export const AUTH_LOGIN_EVENT = "khata:auth-login";

export const defaultAppearancePreferences: AppearancePreferences = {
  theme: "light",
  language: "en-US",
  timezone: "UTC",
  date_calendar_system: "AD",
  compact_mode: true,
  smooth_animations: true,
  navbar_position: "left",
  accent_color: undefined, // Default: use CSS variable (green)
};

/**
 * Lighten/darken a hex color by shifting its HSL lightness. Used to derive
 * the darker gradient/hover shades and light tint backgrounds that several
 * components (e.g. the onboarding wizard) pair with the base accent color,
 * so picking a non-green accent doesn't leave those spots stuck on green.
 */
function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function shadeColor(hex: string, lightnessDelta: number): string {
  try {
    const [h, s, l] = hexToHsl(hex);
    const newL = Math.max(0, Math.min(100, l + lightnessDelta));
    return hslToHex(h, s, newL);
  } catch {
    return hex;
  }
}

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
  root.dataset.compact = prefs.compact_mode !== false ? "true" : "false";
  root.dataset.reduceMotion = prefs.smooth_animations ? "false" : "true";
  root.dataset.navbarPosition = prefs.navbar_position || "left";
  root.style.colorScheme = isDark ? "dark" : "light";

  // Apply dynamic accent color if provided
  if (prefs.accent_color) {
    root.dataset.accentColor = prefs.accent_color;
    applyAccentColor(prefs.accent_color);
  } else {
    delete root.dataset.accentColor;
    removeAccentColor();
  }
}

/**
 * Apply a dynamic accent color by overriding CSS variables.
 *
 * `--color-accent-custom` is what most components fall back through via
 * `var(--color-accent-custom,#22C55E)`, so they update live. The semantic
 * shadcn tokens (`--primary`, `--ring`, `--sidebar-*`) are overridden too
 * so anything built with the theme system (bg-primary, ring-primary, etc.)
 * picks it up as well.
 *
 * `-dark`/`-darker`/`-light` shades are derived from the chosen color so
 * places that pair the base accent with a darker gradient/hover shade or a
 * light tint background (e.g. the onboarding wizard) stay a coherent single
 * hue instead of clashing with a leftover hardcoded green.
 */
/**
 * Lightness deltas (relative to the 500 shade) matching Tailwind's default
 * green ramp, e.g. green-600 sits ~9 points darker than green-500. Re-basing
 * these onto the chosen accent's own hue/saturation gives a full 50-950
 * shade scale for it, so components written against `green-50`..`green-950`
 * (light tints, dark-mode variants, hover/active shades) can be swapped to
 * the matching `--color-accent-custom-<shade>` and stay a coherent ramp for
 * any accent color instead of just the one exact base hue.
 */
const ACCENT_SHADE_DELTAS: Record<string, number> = {
  "50": 51,
  "100": 47,
  "200": 40,
  "300": 28,
  "400": 13,
  "500": 0,
  "600": -9,
  "700": -16,
  "800": -21,
  "900": -25,
  "950": -35,
};

export function applyAccentColor(color: string) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  root.style.setProperty("--color-accent-custom", color);
  root.style.setProperty("--color-accent-custom-dark", shadeColor(color, -12));
  root.style.setProperty("--color-accent-custom-darker", shadeColor(color, -24));
  root.style.setProperty("--color-accent-custom-light", shadeColor(color, 42));
  for (const [shade, delta] of Object.entries(ACCENT_SHADE_DELTAS)) {
    root.style.setProperty(`--color-accent-custom-${shade}`, shadeColor(color, delta));
  }
  root.style.setProperty("--primary", color);
  root.style.setProperty("--primary-foreground", "#ffffff");
  root.style.setProperty("--ring", color);
  root.style.setProperty("--sidebar-primary", color);
  root.style.setProperty("--sidebar-primary-foreground", "#ffffff");
  root.style.setProperty("--sidebar-ring", color);
}

/**
 * Remove dynamic accent color overrides, reverting to the theme's defaults.
 */
export function removeAccentColor() {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.removeProperty("--color-accent-custom");
  root.style.removeProperty("--color-accent-custom-dark");
  root.style.removeProperty("--color-accent-custom-darker");
  root.style.removeProperty("--color-accent-custom-light");
  for (const shade of Object.keys(ACCENT_SHADE_DELTAS)) {
    root.style.removeProperty(`--color-accent-custom-${shade}`);
  }
  root.style.removeProperty("--primary");
  root.style.removeProperty("--primary-foreground");
  root.style.removeProperty("--ring");
  root.style.removeProperty("--sidebar-primary");
  root.style.removeProperty("--sidebar-primary-foreground");
  root.style.removeProperty("--sidebar-ring");
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

/** Inline script source — must stay in sync with resolveIsDark / applyAppearancePreferences / shadeColor */
export const themeBootstrapScript = `(function(){try{var k="khata-appearance";var r=localStorage.getItem(k);var p=r?JSON.parse(r):{theme:"light",compact_mode:true,smooth_animations:true,navbar_position:"left"};var t=p.theme||"light";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var el=document.documentElement;el.classList.toggle("dark",d);el.dataset.theme=t;el.dataset.compact=p.compact_mode!==false?"true":"false";el.dataset.reduceMotion=p.smooth_animations===false?"true":"false";el.dataset.navbarPosition=p.navbar_position||"left";el.style.colorScheme=d?"dark":"light";if(p.accent_color){el.dataset.accentColor=p.accent_color;var c=p.accent_color;function h2h(hex,dl){try{var cl=hex.replace("#","");var r=parseInt(cl.substring(0,2),16)/255,g=parseInt(cl.substring(2,4),16)/255,b=parseInt(cl.substring(4,6),16)/255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,s=0,hh=0;if(mx!==mn){var df=mx-mn;s=l>0.5?df/(2-mx-mn):df/(mx+mn);if(mx===r)hh=((g-b)/df+(g<b?6:0))/6;else if(mx===g)hh=((b-r)/df+2)/6;else hh=((r-g)/df+4)/6;}hh*=360;s*=100;l=Math.max(0,Math.min(100,l*100+dl));var sN=s/100,lN=l/100,cc=(1-Math.abs(2*lN-1))*sN,x=cc*(1-Math.abs((hh/60)%2-1)),m=lN-cc/2,rr=0,gg=0,bb=0;if(hh<60){rr=cc;gg=x;}else if(hh<120){rr=x;gg=cc;}else if(hh<180){gg=cc;bb=x;}else if(hh<240){gg=x;bb=cc;}else if(hh<300){rr=x;bb=cc;}else{rr=cc;bb=x;}function tx(v){return Math.round((v+m)*255).toString(16).padStart(2,"0");}return "#"+tx(rr)+tx(gg)+tx(bb);}catch(e){return hex;}}el.style.setProperty("--color-accent-custom",c);el.style.setProperty("--color-accent-custom-dark",h2h(c,-12));el.style.setProperty("--color-accent-custom-darker",h2h(c,-24));el.style.setProperty("--color-accent-custom-light",h2h(c,42));var sh={50:51,100:47,200:40,300:28,400:13,500:0,600:-9,700:-16,800:-21,900:-25,950:-35};for(var sk in sh){el.style.setProperty("--color-accent-custom-"+sk,h2h(c,sh[sk]));}el.style.setProperty("--primary",c);el.style.setProperty("--primary-foreground","#ffffff");el.style.setProperty("--ring",c);el.style.setProperty("--sidebar-primary",c);el.style.setProperty("--sidebar-primary-foreground","#ffffff");el.style.setProperty("--sidebar-ring",c);}}catch(e){}})();`;
