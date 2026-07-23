"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown, ChevronLeft, ChevronRight, X, Menu, Plus,
  Search,
} from "lucide-react";
import { KhataLogo } from "@/components/khata-logo";
import { WorkplaceSwitcher } from "@/components/dashboard/WorkplaceSwitcher";
import { useAuth } from "@/lib/context/AuthContext";
import { useAppearance } from "@/lib/context/AppearanceContext";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useDesktopWorkspaceOptional } from "@/lib/context/DesktopWorkspaceContext";
import { cn } from "@/lib/utils";
import {
  dashboardNavItems,
  filterDashboardNavItems,
  matchesNavChild,
  type NavItem,
} from "@/lib/dashboard/nav-items";

function SidebarItem({
  item,
  openKey,
  onToggle,
  compact = false,
}: {
  item: NavItem;
  openKey: string | null;
  onToggle: (label: string) => void;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const isOpen = openKey === item.label;

  const isChildActive = item.children?.some((c) => matchesNavChild(pathname, c)) ?? false;
  const isParentActive = item.href ? pathname === item.href : isChildActive;
  const overviewHref =
    item.href ||
    item.children?.find((c) => c.exact)?.href ||
    item.children?.[0]?.href;

  // Direct link (Dashboard) — or compact parent → jump to overview
  if ((item.href && !item.children) || (compact && overviewHref)) {
    const href = item.href && !item.children ? item.href : overviewHref!;
    const active = item.href && !item.children ? isParentActive : isChildActive;
    return (
      <Link
        href={href}
        title={item.label}
        data-tour={`nav-${item.label.toLowerCase()}`}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
          compact && "justify-center px-2",
          active
            ? "bg-[#22C55E] text-white"
            : "text-gray-400 hover:text-white hover:bg-white/10"
        )}
      >
        <item.icon size={17} className="shrink-0" />
        {!compact && item.label}
      </Link>
    );
  }

  return (
    <div data-tour={`nav-${item.label.toLowerCase()}`}>
      <button
        type="button"
        onClick={() => onToggle(item.label)}
        title={item.label}
        data-tour={`nav-${item.label.toLowerCase()}-toggle`}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
          compact && "justify-center px-2",
          isParentActive && !isOpen
            ? "bg-[#22C55E] text-white"
            : isOpen
              ? "bg-white/10 text-white"
              : "text-gray-400 hover:text-white hover:bg-white/10"
        )}
      >
        <item.icon size={17} className="shrink-0" />
        {!compact && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown
              size={14}
              className={cn(
                "shrink-0 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {!compact && (
        <div
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{ maxHeight: isOpen ? "500px" : "0px" }}
        >
          <div className="ml-4 mt-0.5 mb-1 pl-3 border-l border-white/10 space-y-0.5">
            {item.children?.map((child) => {
              const active = matchesNavChild(pathname, child);
              return (
                <div key={child.href} className="group flex items-center gap-1">
                  <Link
                    href={child.href}
                    className={cn(
                      "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-all",
                      active
                        ? "text-[#22C55E] border-l-2 border-[#22C55E] -ml-[1px] pl-[9px] bg-white/5"
                        : "text-gray-500 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {child.label}
                  </Link>
                  {child.createHref && (
                    <Link
                      href={child.createHref}
                      className="p-1 rounded hover:bg-[#22C55E] text-white hover:text-white transition-all"
                      title={`Create new ${child.label}`}
                    >
                      <Plus size={14} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const WEB_SIDEBAR_COLLAPSED_KEY = "khata-sidebar-collapsed";

function filterNavByQuery(items: NavItem[], query: string): NavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items
    .map((item) => {
      const parentMatch = item.label.toLowerCase().includes(q);
      if (parentMatch) return item;

      const matchedChildren = item.children?.filter((child) =>
        child.label.toLowerCase().includes(q)
      );
      if (matchedChildren && matchedChildren.length > 0) {
        return { ...item, children: matchedChildren };
      }
      return null;
    })
    .filter((item): item is NavItem => item !== null);
}

function SidebarContent({
  onClose,
  compact = false,
  searchFocusNonce = 0,
}: {
  onClose?: () => void;
  compact?: boolean;
  /** Increment to focus the search field (e.g. Ctrl+K). */
  searchFocusNonce?: number;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const permissions = usePermissions();
  const [navQuery, setNavQuery] = useState("");
  const [modKey, setModKey] = useState("Ctrl");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredNavItems = filterDashboardNavItems(dashboardNavItems, {
    canView: permissions.canView,
    role: user?.role,
  });

  const searchedNavItems = filterNavByQuery(filteredNavItems, navQuery);
  const isSearching = navQuery.trim().length > 0;

  const defaultOpen = filteredNavItems.find((item) =>
    item.children?.some((c) => matchesNavChild(pathname, c))
  )?.label ?? null;

  const [openKey, setOpenKey] = useState<string | null>(defaultOpen);

  useEffect(() => {
    if (/Mac|iPhone|iPad|iPod/.test(navigator.platform)) {
      setModKey("⌘");
    }
  }, []);

  useEffect(() => {
    if (isSearching) return;
    const match = filteredNavItems.find((item) =>
      item.children?.some((c) => matchesNavChild(pathname, c))
    );
    if (match) {
      setOpenKey(match.label);
    }
  }, [pathname, isSearching]);

  useEffect(() => {
    if (!searchFocusNonce || compact) return;
    const id = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [searchFocusNonce, compact]);

  const handleToggle = (label: string) => {
    setOpenKey((prev) => (prev === label ? null : label));
  };

  return (
    <div className="flex flex-col h-full" data-tour="sidebar-content">
      <div
        data-tour="sidebar-org"
        className={cn(
          "border-b border-white/10 flex items-center justify-between gap-2",
          compact ? "px-2 py-4" : "px-4 py-4"
        )}
      >
        {user?.tenant ? (
          <WorkplaceSwitcher compact={compact} />
        ) : (
          <div className={cn(compact && "flex-1 flex justify-center")}>
            {!compact ? <KhataLogo size="md" /> : (
              <div className="w-8 h-8 rounded-lg bg-[#22C55E] grid place-items-center text-white text-sm font-bold">
                K
              </div>
            )}
          </div>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors lg:hidden p-1.5 shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {!compact && (
        <div data-tour="sidebar-search" className="px-3 pt-3 pb-1">
          <div className="relative flex items-center">
            <Search
              size={15}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              ref={searchInputRef}
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (navQuery) {
                    setNavQuery("");
                  } else {
                    searchInputRef.current?.blur();
                  }
                }
              }}
              placeholder="Search"
              aria-label="Search menu (Ctrl+K)"
              className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-[4.25rem] text-sm text-gray-200 outline-none placeholder:text-gray-500 transition-colors focus:border-[#22C55E]/40 focus:bg-white/[0.07]"
            />
            {navQuery ? (
              <button
                type="button"
                onClick={() => {
                  setNavQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-500 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            ) : (
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 font-sans text-[10px] font-medium leading-none text-gray-500">
                  {modKey}
                </kbd>
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 font-sans text-[10px] font-medium leading-none text-gray-500">
                  K
                </kbd>
              </span>
            )}
          </div>
        </div>
      )}

      <nav
        data-tour="sidebar-nav"
        className={cn(
          "flex-1 py-3 space-y-0.5 overflow-y-auto scrollbar-thin-sidebar",
          compact ? "px-2" : "px-3"
        )}
      >
        {searchedNavItems.length === 0 ? (
          <p className="px-3 py-4 text-xs text-gray-500 text-center">
            No menu items found
          </p>
        ) : (
          searchedNavItems.map((item) => (
            <SidebarItem
              key={item.label}
              item={item}
              openKey={
                isSearching && item.children?.length
                  ? item.label
                  : openKey
              }
              onToggle={handleToggle}
              compact={compact}
            />
          ))
        )}
      </nav>

      {!compact && (
        <div className="px-5 py-4 border-t border-white/10 space-y-1.5">
          {user?.tenant && (
            <p className="text-[11px] font-mono break-all text-gray-500 leading-relaxed">
              https://{user.tenant.slug}.khata.app
            </p>
          )}
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Khata Business OS
          </p>
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  forceDesktop = false,
  compact: compactProp = false,
}: {
  /** Electron desktop shell: always show desktop aside, hide mobile chrome */
  forceDesktop?: boolean;
  compact?: boolean;
}) {
  const ws = useDesktopWorkspaceOptional();
  const { preferences } = useAppearance();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [webCollapsed, setWebCollapsed] = useState(false);
  const [searchFocusNonce, setSearchFocusNonce] = useState(0);
  const railOnTop = preferences.navbar_position === "top";

  useEffect(() => {
    if (forceDesktop || typeof window === "undefined") return;
    setWebCollapsed(localStorage.getItem(WEB_SIDEBAR_COLLAPSED_KEY) === "1");
  }, [forceDesktop]);

  const compact = forceDesktop ? compactProp : webCollapsed;

  const toggleCollapse = () => {
    if (forceDesktop && ws?.enabled) {
      ws.toggleSidebarCollapsed();
      return;
    }
    setWebCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(WEB_SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore quota / private mode
      }
      return next;
    });
  };

  // Ctrl/Cmd+K — focus sidebar menu search (web only; Electron uses DesktopHotkeys)
  useEffect(() => {
    if (ws?.enabled) return;

    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey) return;
      if (e.key.toLowerCase() !== "k") return;
      e.preventDefault();

      const isMobileViewport =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 1023px)").matches;

      if (isMobileViewport && !forceDesktop) {
        setMobileOpen(true);
      } else if (!forceDesktop && webCollapsed) {
        setWebCollapsed(false);
        try {
          localStorage.setItem(WEB_SIDEBAR_COLLAPSED_KEY, "0");
        } catch {
          // ignore
        }
      }

      setSearchFocusNonce((n) => n + 1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ws?.enabled, forceDesktop, webCollapsed]);

  const mobileFocusNonce = mobileOpen ? searchFocusNonce : 0;
  const desktopFocusNonce = mobileOpen ? 0 : searchFocusNonce;

  return (
    <>
      {!forceDesktop && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className={cn(
            "lg:hidden fixed top-4 z-50 p-2 rounded-lg bg-[#1E2A3B] text-white shadow-lg",
            railOnTop ? "left-4" : "left-16"
          )}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {!forceDesktop && mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 h-full bg-[#1E2A3B] z-50 overflow-hidden">
            <SidebarContent
              onClose={() => setMobileOpen(false)}
              searchFocusNonce={mobileFocusNonce}
            />
          </div>
        </div>
      )}

      <aside
        data-tour="sidebar"
        data-compact={compact ? "true" : "false"}
        className={cn(
          "relative flex-col h-full shrink-0 bg-[#1E2A3B] overflow-hidden transition-[width] duration-200",
          forceDesktop
            ? "flex w-full"
            : cn("hidden lg:flex", compact ? "w-[72px]" : "w-64")
        )}
      >
        <SidebarContent
          compact={compact}
          searchFocusNonce={desktopFocusNonce}
        />
        <button
          type="button"
          onClick={toggleCollapse}
          className="absolute top-1/2 right-0 z-20 -translate-y-1/2 h-10 w-5 rounded-l-md border border-r-0 border-white/15 bg-[#243447] text-gray-300 hover:bg-[#2d4058] hover:text-white grid place-items-center transition-colors"
          aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
          title={compact ? "Expand sidebar" : "Collapse sidebar"}
        >
          {compact ? (
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          )}
        </button>
      </aside>
    </>
  );
}

