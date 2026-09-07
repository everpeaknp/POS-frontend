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
  sidebar_color: undefined, // Default: built-in navy
  navbar_color: undefined, // Default: theme-neutral card color
  border_radius: undefined, // Default: the built-in 0.625rem scale
  high_contrast: false,
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

/**
 * Re-lighten/darken a color to an ABSOLUTE target lightness (not a delta
 * from its own lightness). A fixed delta clips: an accent whose base
 * lightness is already ~60% (many blues/purples) pushed +42 overflows past
 * L=100% and clips to plain white, losing the hue entirely — which is
 * exactly what made "light" tint backgrounds render as flat white squares
 * for those colors. An absolute target has no such failure mode and also
 * matches how real design-system shade ramps are built (each rung is a
 * fixed lightness, only hue/saturation come from the input color).
 */
function shadeColor(hex: string, targetLightness: number): string {
  try {
    const [h, s] = hexToHsl(hex);
    return hslToHex(h, s, Math.max(0, Math.min(100, targetLightness)));
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
  root.dataset.highContrast = prefs.high_contrast ? "true" : "false";
  root.style.colorScheme = isDark ? "dark" : "light";

  // Apply dynamic accent color if provided
  if (prefs.accent_color) {
    root.dataset.accentColor = prefs.accent_color;
    applyAccentColor(prefs.accent_color);
  } else {
    delete root.dataset.accentColor;
    removeAccentColor();
  }

  // Apply dynamic sidebar color if provided
  if (prefs.sidebar_color) {
    applySidebarColor(prefs.sidebar_color);
  } else {
    removeSidebarColor();
  }

  // Navbar (icon rail) always resolves through CSS vars — either the custom
  // color's derived palette, or the theme-adaptive default it replaces.
  applyNavbarColor(prefs.navbar_color, isDark);

  // Apply a custom global corner radius if provided
  if (prefs.border_radius) {
    applyBorderRadius(prefs.border_radius);
  } else {
    removeBorderRadius();
  }
}

/**
 * Preset corner-radius values the picker offers. "Default" matches the
 * built-in `--radius: 0.625rem`. Every `rounded-*` utility in the app is
 * defined in terms of `--radius` (see globals.css), so overriding this one
 * variable rescales every card/button/input's corners app-wide.
 */
export const BORDER_RADIUS_PRESETS = {
  none: "0rem",
  small: "0.375rem",
  default: "0.625rem",
  large: "1rem",
  full: "1.5rem",
} as const;

/** Apply a custom global corner radius (raw CSS length, e.g. "0.625rem"). */
export function applyBorderRadius(value: string) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--radius", value);
}

/** Revert to the built-in corner radius. */
export function removeBorderRadius() {
  if (typeof document === "undefined") return;
  document.documentElement.style.removeProperty("--radius");
}

/**
 * Overlay palette for text/borders/hovers that sit on top of an arbitrary
 * background color. Picks black- or white-based overlays depending on the
 * background's own lightness, so an arbitrarily chosen sidebar/navbar color
 * (light or dark) always keeps readable, appropriately-contrasted chrome
 * instead of e.g. white-on-white text if someone picks a pale color.
 */
function overlayPalette(bgHex: string) {
  const [, , l] = hexToHsl(bgHex);
  const isLight = l > 55;
  const base = isLight ? "0,0,0" : "255,255,255";
  return {
    isLight,
    fg: isLight ? "#111827" : "#ffffff",
    fgMuted: `rgba(${base},0.6)`,
    fgSubtle: `rgba(${base},0.45)`,
    fgSubtlest: `rgba(${base},0.35)`,
    inputText: isLight ? "#111827" : "#e5e7eb",
    border: `rgba(${base},0.12)`,
    hover: `rgba(${base},0.1)`,
    surface: `rgba(${base},0.06)`,
    surfaceStrong: `rgba(${base},0.09)`,
  };
}

const SIDEBAR_VARS = [
  "--sidebar-bg",
  "--sidebar-fg",
  "--sidebar-fg-muted",
  "--sidebar-fg-subtle",
  "--sidebar-fg-subtlest",
  "--sidebar-input-text",
  "--sidebar-custom-border",
  "--sidebar-hover-bg",
  "--sidebar-surface",
  "--sidebar-surface-strong",
] as const;

/** Apply a custom sidebar background color, deriving readable text/border/hover overlays for it. */
export function applySidebarColor(bg: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const p = overlayPalette(bg);
  root.style.setProperty("--sidebar-bg", bg);
  root.style.setProperty("--sidebar-fg", p.fg);
  root.style.setProperty("--sidebar-fg-muted", p.fgMuted);
  root.style.setProperty("--sidebar-fg-subtle", p.fgSubtle);
  root.style.setProperty("--sidebar-fg-subtlest", p.fgSubtlest);
  root.style.setProperty("--sidebar-input-text", p.inputText);
  root.style.setProperty("--sidebar-custom-border", p.border);
  root.style.setProperty("--sidebar-hover-bg", p.hover);
  root.style.setProperty("--sidebar-surface", p.surface);
  root.style.setProperty("--sidebar-surface-strong", p.surfaceStrong);
}

/** Revert to the built-in navy sidebar. */
export function removeSidebarColor() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const key of SIDEBAR_VARS) root.style.removeProperty(key);
}

/**
 * Apply the navbar (icon rail) background. With no custom color it mirrors
 * the rail's original theme-adaptive default (white/light-card in light
 * mode, dark card in dark mode) recomputed from `isDark` — the rail always
 * reads through these vars, customized or not, so there's a single code
 * path instead of parallel default/custom class sets.
 */
export function applyNavbarColor(color: string | undefined, isDark: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (color) {
    const p = overlayPalette(color);
    root.style.setProperty("--navbar-bg", color);
    root.style.setProperty("--navbar-fg", p.fg);
    root.style.setProperty("--navbar-fg-muted", p.fgMuted);
    root.style.setProperty("--navbar-border", p.border);
    root.style.setProperty("--navbar-hover-bg", p.hover);
  } else {
    root.style.setProperty("--navbar-bg", "var(--card)");
    root.style.setProperty("--navbar-fg", isDark ? "#ffffff" : "#111827");
    root.style.setProperty("--navbar-fg-muted", isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)");
    root.style.setProperty("--navbar-border", "var(--border)");
    root.style.setProperty("--navbar-hover-bg", isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)");
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
 * Absolute target lightness per shade, matching Tailwind's default green
 * ramp (e.g. green-600 sits at L≈36% regardless of green-500's own L≈45%).
 * Re-basing the chosen accent's hue/saturation onto these fixed targets
 * gives a full 50-950 shade scale for it, so components written against
 * `green-50`..`green-950` (light tints, dark-mode variants, hover/active
 * shades) can be swapped to the matching `--color-accent-custom-<shade>`
 * and stay a coherent ramp for any accent color instead of just the one
 * exact base hue. "500" is special-cased to the accent's own lightness so
 * it reproduces the exact picked color instead of a fixed approximation.
 */
const ACCENT_SHADE_LIGHTNESS: Record<string, number> = {
  "50": 97,
  "100": 93,
  "200": 85,
  "300": 73,
  "400": 58,
  "600": 36,
  "700": 29,
  "800": 24,
  "900": 20,
  "950": 10,
};

export function applyAccentColor(color: string) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  root.style.setProperty("--color-accent-custom", color);
  root.style.setProperty("--color-accent-custom-dark", shadeColor(color, 36));
  root.style.setProperty("--color-accent-custom-darker", shadeColor(color, 24));
  root.style.setProperty("--color-accent-custom-light", shadeColor(color, 93));
  root.style.setProperty("--color-accent-custom-500", color);
  for (const [shade, lightness] of Object.entries(ACCENT_SHADE_LIGHTNESS)) {
    root.style.setProperty(`--color-accent-custom-${shade}`, shadeColor(color, lightness));
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
  root.style.removeProperty("--color-accent-custom-500");
  for (const shade of Object.keys(ACCENT_SHADE_LIGHTNESS)) {
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
export const themeBootstrapScript = `(function(){try{var k="khata-appearance";var r=localStorage.getItem(k);var p=r?JSON.parse(r):{theme:"light",compact_mode:true,smooth_animations:true,navbar_position:"left"};var t=p.theme||"light";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var el=document.documentElement;el.classList.toggle("dark",d);el.dataset.theme=t;el.dataset.compact=p.compact_mode!==false?"true":"false";el.dataset.reduceMotion=p.smooth_animations===false?"true":"false";el.dataset.navbarPosition=p.navbar_position||"left";el.dataset.highContrast=p.high_contrast?"true":"false";el.style.colorScheme=d?"dark":"light";if(p.accent_color){el.dataset.accentColor=p.accent_color;var c=p.accent_color;function h2h(hex,targetL){try{var cl=hex.replace("#","");var r=parseInt(cl.substring(0,2),16)/255,g=parseInt(cl.substring(2,4),16)/255,b=parseInt(cl.substring(4,6),16)/255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,s=0,hh=0;if(mx!==mn){var df=mx-mn;s=l>0.5?df/(2-mx-mn):df/(mx+mn);if(mx===r)hh=((g-b)/df+(g<b?6:0))/6;else if(mx===g)hh=((b-r)/df+2)/6;else hh=((r-g)/df+4)/6;}hh*=360;s*=100;var newL=Math.max(0,Math.min(100,targetL));var sN=s/100,lN=newL/100,cc=(1-Math.abs(2*lN-1))*sN,x=cc*(1-Math.abs((hh/60)%2-1)),m=lN-cc/2,rr=0,gg=0,bb=0;if(hh<60){rr=cc;gg=x;}else if(hh<120){rr=x;gg=cc;}else if(hh<180){gg=cc;bb=x;}else if(hh<240){gg=x;bb=cc;}else if(hh<300){rr=x;bb=cc;}else{rr=cc;bb=x;}function tx(v){return Math.round((v+m)*255).toString(16).padStart(2,"0");}return "#"+tx(rr)+tx(gg)+tx(bb);}catch(e){return hex;}}el.style.setProperty("--color-accent-custom",c);el.style.setProperty("--color-accent-custom-dark",h2h(c,36));el.style.setProperty("--color-accent-custom-darker",h2h(c,24));el.style.setProperty("--color-accent-custom-light",h2h(c,93));el.style.setProperty("--color-accent-custom-500",c);var sh={50:97,100:93,200:85,300:73,400:58,600:36,700:29,800:24,900:20,950:10};for(var sk in sh){el.style.setProperty("--color-accent-custom-"+sk,h2h(c,sh[sk]));}el.style.setProperty("--primary",c);el.style.setProperty("--primary-foreground","#ffffff");el.style.setProperty("--ring",c);el.style.setProperty("--sidebar-primary",c);el.style.setProperty("--sidebar-primary-foreground","#ffffff");el.style.setProperty("--sidebar-ring",c);}function ov(hex){var cl=hex.replace("#","");var r=parseInt(cl.substring(0,2),16)/255,g=parseInt(cl.substring(2,4),16)/255,b=parseInt(cl.substring(4,6),16)/255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2*100;var light=l>55;var base=light?"0,0,0":"255,255,255";return{fg:light?"#111827":"#ffffff",fgMuted:"rgba("+base+",0.6)",fgSubtle:"rgba("+base+",0.45)",fgSubtlest:"rgba("+base+",0.35)",inputText:light?"#111827":"#e5e7eb",border:"rgba("+base+",0.12)",hover:"rgba("+base+",0.1)",surface:"rgba("+base+",0.06)",surfaceStrong:"rgba("+base+",0.09)"};}if(p.sidebar_color){var sp=ov(p.sidebar_color);el.style.setProperty("--sidebar-bg",p.sidebar_color);el.style.setProperty("--sidebar-fg",sp.fg);el.style.setProperty("--sidebar-fg-muted",sp.fgMuted);el.style.setProperty("--sidebar-fg-subtle",sp.fgSubtle);el.style.setProperty("--sidebar-fg-subtlest",sp.fgSubtlest);el.style.setProperty("--sidebar-input-text",sp.inputText);el.style.setProperty("--sidebar-custom-border",sp.border);el.style.setProperty("--sidebar-hover-bg",sp.hover);el.style.setProperty("--sidebar-surface",sp.surface);el.style.setProperty("--sidebar-surface-strong",sp.surfaceStrong);}if(p.navbar_color){var np=ov(p.navbar_color);el.style.setProperty("--navbar-bg",p.navbar_color);el.style.setProperty("--navbar-fg",np.fg);el.style.setProperty("--navbar-fg-muted",np.fgMuted);el.style.setProperty("--navbar-border",np.border);el.style.setProperty("--navbar-hover-bg",np.hover);}else{el.style.setProperty("--navbar-bg","var(--card)");el.style.setProperty("--navbar-fg",d?"#ffffff":"#111827");el.style.setProperty("--navbar-fg-muted",d?"rgba(255,255,255,0.6)":"rgba(0,0,0,0.45)");el.style.setProperty("--navbar-border","var(--border)");el.style.setProperty("--navbar-hover-bg",d?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.05)");}if(p.border_radius){el.style.setProperty("--radius",p.border_radius);}}catch(e){}})();`;
