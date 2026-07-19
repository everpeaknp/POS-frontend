"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useIsElectron } from "@/lib/desktop/use-is-electron";
import { titleForPath } from "@/lib/desktop/navigation-catalog";

export type DesktopTab = {
  id: string;
  href: string;
  title: string;
  pinned?: boolean;
};

type DesktopWorkspaceValue = {
  enabled: boolean;
  tabs: DesktopTab[];
  activeHref: string;
  recent: DesktopTab[];
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  paletteOpen: boolean;
  searchOpen: boolean;
  aiOpen: boolean;
  smartSearchOpen: boolean;
  diagnosticsOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setAiOpen: (v: boolean) => void;
  setSmartSearchOpen: (v: boolean) => void;
  setDiagnosticsOpen: (v: boolean) => void;
  openTab: (href: string, title?: string) => void;
  closeTab: (id: string) => void;
  pinTab: (id: string) => void;
  setSidebarWidth: (w: number) => void;
  toggleSidebarCollapsed: () => void;
  goBack: () => void;
  goForward: () => void;
};

const STORAGE_TABS = "khata_desktop_tabs_v1";
const STORAGE_RECENT = "khata_desktop_recent_v1";
const STORAGE_SIDEBAR = "khata_desktop_sidebar_v1";

const DesktopWorkspaceContext = createContext<DesktopWorkspaceValue | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function DesktopWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/dashboard";
  const enabled = useIsElectron();
  const [tabs, setTabs] = useState<DesktopTab[]>([]);
  const [recent, setRecent] = useState<DesktopTab[]>([]);
  const [sidebarWidth, setSidebarWidthState] = useState(240);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [smartSearchOpen, setSmartSearchOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const side = loadJson<{ width: number; collapsed: boolean }>(STORAGE_SIDEBAR, {
      width: 240,
      collapsed: false,
    });
    setSidebarWidthState(side.width || 240);
    setSidebarCollapsed(!!side.collapsed);
    setTabs(loadJson<DesktopTab[]>(STORAGE_TABS, []));
    setRecent(loadJson<DesktopTab[]>(STORAGE_RECENT, []));
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    localStorage.setItem(STORAGE_TABS, JSON.stringify(tabs));
  }, [tabs, enabled]);

  useEffect(() => {
    if (!enabled) return;
    localStorage.setItem(STORAGE_RECENT, JSON.stringify(recent));
  }, [recent, enabled]);

  useEffect(() => {
    if (!enabled) return;
    localStorage.setItem(
      STORAGE_SIDEBAR,
      JSON.stringify({ width: sidebarWidth, collapsed: sidebarCollapsed })
    );
  }, [sidebarWidth, sidebarCollapsed, enabled]);

  // Sync active route into tabs + recent
  useEffect(() => {
    if (!enabled) return;
    if (!pathname.startsWith("/dashboard") && pathname !== "/erp") return;

    const title = titleForPath(pathname);
    setTabs((prev) => {
      const existing = prev.find((t) => t.href === pathname);
      if (existing) return prev;
      // Replace unpinned active-style: keep max 12 tabs
      const next = [...prev, { id: pathname, href: pathname, title }];
      return next.slice(-12);
    });
    setRecent((prev) => {
      const filtered = prev.filter((t) => t.href !== pathname);
      return [{ id: pathname, href: pathname, title }, ...filtered].slice(0, 20);
    });
  }, [pathname, enabled]);

  const openTab = useCallback(
    (href: string, title?: string) => {
      const t = title ?? titleForPath(href);
      setTabs((prev) => {
        if (prev.some((x) => x.href === href)) return prev;
        return [...prev, { id: href, href, title: t }].slice(-12);
      });
      router.push(href);
      setPaletteOpen(false);
      setSearchOpen(false);
    },
    [router]
  );

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx < 0) return prev;
        return prev.filter((t) => t.id !== id);
      });

      // Navigate outside the setState updater — never update Router during render
      const idx = tabs.findIndex((t) => t.id === id);
      if (idx < 0) return;
      const closing = tabs[idx];
      if (closing.href !== pathname) return;
      const next = tabs.filter((t) => t.id !== id);
      const fallback = next[idx - 1] || next[idx] || next[0];
      router.push(fallback?.href || "/dashboard");
    },
    [tabs, pathname, router]
  );

  const pinTab = useCallback((id: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t))
    );
  }, []);

  const setSidebarWidth = useCallback((w: number) => {
    setSidebarWidthState(Math.min(360, Math.max(180, w)));
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((c) => !c);
  }, []);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const goForward = useCallback(() => {
    router.forward();
  }, [router]);

  const value = useMemo<DesktopWorkspaceValue>(
    () => ({
      enabled,
      tabs,
      activeHref: pathname,
      recent,
      sidebarWidth,
      sidebarCollapsed,
      paletteOpen,
      searchOpen,
      aiOpen,
      smartSearchOpen,
      diagnosticsOpen,
      setPaletteOpen,
      setSearchOpen,
      setAiOpen,
      setSmartSearchOpen,
      setDiagnosticsOpen,
      openTab,
      closeTab,
      pinTab,
      setSidebarWidth,
      toggleSidebarCollapsed,
      goBack,
      goForward,
    }),
    [
      enabled,
      tabs,
      pathname,
      recent,
      sidebarWidth,
      sidebarCollapsed,
      paletteOpen,
      searchOpen,
      aiOpen,
      smartSearchOpen,
      diagnosticsOpen,
      openTab,
      closeTab,
      pinTab,
      setSidebarWidth,
      toggleSidebarCollapsed,
      goBack,
      goForward,
    ]
  );

  return (
    <DesktopWorkspaceContext.Provider value={value}>
      {children}
    </DesktopWorkspaceContext.Provider>
  );
}

export function useDesktopWorkspace() {
  const ctx = useContext(DesktopWorkspaceContext);
  if (!ctx) {
    throw new Error("useDesktopWorkspace must be used within DesktopWorkspaceProvider");
  }
  return ctx;
}

/** Safe hook when provider may be absent (web) */
export function useDesktopWorkspaceOptional() {
  return useContext(DesktopWorkspaceContext);
}
