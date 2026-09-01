"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown, ChevronLeft, ChevronRight, X, Menu, Plus,
  Search, ArrowLeft,
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
  sortNavItemsByModuleOrder,
  SIDEBAR_MODULE_ORDER_KEY,
  SIDEBAR_FEATURE_ORDER_KEY,
  SIDEBAR_ORDER_CHANGED_EVENT,
  SIDEBAR_ALWAYS_EXPANDED_MODULES_KEY,
  scopedSidebarKey,
  type NavItem,
} from "@/lib/dashboard/nav-items";

function SidebarItem({
  item,
  openKey,
  onToggle,
  compact = false,
  onQuickAction,
  alwaysExpanded = false,
}: {
  item: NavItem;
  openKey: string | null;
  onToggle: (label: string) => void;
  compact?: boolean;
  onQuickAction?: (item: NavItem) => void;
  alwaysExpanded?: boolean;
}) {
  const pathname = usePathname();
  const isOpen = alwaysExpanded ? true : openKey === item.label;
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  const isChildActive = item.children?.some((c) => matchesNavChild(pathname, c)) ?? false;
  const isParentActive = item.href ? pathname === item.href : isChildActive;
  
  // Check if this is a "direct link with add button" pattern (has href AND single child with createHref)
  const hasDirectAdd = item.href && item.children?.length === 1 && item.children[0].createHref;
  const addHref = hasDirectAdd ? item.children[0].createHref : undefined;

  // Close quick menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(event.target as Node)) {
        setShowQuickMenu(false);
      }
    };
    if (showQuickMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showQuickMenu]);

  // Direct link (no children) OR compact mode
  if ((item.href && !item.children) || (compact && item.href)) {
    // Check if it has quick action
    if (item.hasQuickAction && !compact) {
      return (
        <div className="group flex items-center gap-1 relative" data-tour={`nav-${item.label.toLowerCase()}`}>
          <Link
            href={item.href!}
            title={item.label}
            className={cn(
              "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              isParentActive
                ? "bg-[#22C55E] text-white"
                : "!text-gray-400 hover:!text-white hover:bg-white/10"
            )}
          >
            <item.icon size={17} className={cn(
              "shrink-0",
              isParentActive ? "!text-white" : "!text-gray-400"
            )} />
            {item.label}
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowQuickMenu(!showQuickMenu);
            }}
            className="p-1.5 rounded hover:bg-[#22C55E] !text-gray-400 hover:!text-white transition-all shrink-0 mr-2"
            title="Quick actions"
          >
            <Plus size={16} />
          </button>
          
          {/* Quick Action Menu */}
          {showQuickMenu && (
            <div
              ref={quickMenuRef}
              className="absolute left-full ml-2 top-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px]"
            >
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  if (onQuickAction) onQuickAction({ ...item, quickActionType: "money-in" } as any);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                💰 Money In
              </button>
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  if (onQuickAction) onQuickAction({ ...item, quickActionType: "money-out" } as any);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                💸 Money Out
              </button>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <Link
        href={item.href}
        title={item.label}
        data-tour={`nav-${item.label.toLowerCase()}`}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
          compact && "justify-center px-2",
          isParentActive
            ? "bg-[#22C55E] text-white"
            : "!text-gray-400 hover:!text-white hover:bg-white/10"
        )}
      >
        <item.icon size={17} className={cn(
          "shrink-0",
          isParentActive ? "!text-white" : "!text-gray-400"
        )} />
        {!compact && item.label}
      </Link>
    );
  }

  // Direct link with add button (href + children with createHref)
  if (hasDirectAdd && !compact) {
    return (
      <div className="group flex items-center gap-1" data-tour={`nav-${item.label.toLowerCase()}`}>
        <Link
          href={item.href!}
          title={item.label}
          className={cn(
            "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            isParentActive
              ? "bg-[#22C55E] text-white"
              : "!text-gray-400 hover:!text-white hover:bg-white/10"
          )}
        >
          <item.icon size={17} className={cn(
            "shrink-0",
            isParentActive ? "!text-white" : "!text-gray-400"
          )} />
          {item.label}
        </Link>
        <Link
          href={addHref!}
          className="p-1.5 rounded hover:bg-[#22C55E] !text-gray-400 hover:!text-white transition-all shrink-0 mr-2"
          title={`Add ${item.label}`}
        >
          <Plus size={16} />
        </Link>
      </div>
    );
  }

  // Expandable menu with children
  return (
    <div data-tour={`nav-${item.label.toLowerCase()}`}>
      <button
        type="button"
        onClick={() => !alwaysExpanded && onToggle(item.label)}
        title={item.label}
        data-tour={`nav-${item.label.toLowerCase()}-toggle`}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
          compact && "justify-center px-2",
          alwaysExpanded && "cursor-default",
          isParentActive && !isOpen
            ? "bg-[#22C55E] text-white"
            : isOpen
              ? "bg-white/10 text-white"
              : "!text-gray-400 hover:!text-white hover:bg-white/10"
        )}
      >
        <item.icon size={17} className={cn(
          "shrink-0",
          isParentActive && !isOpen
            ? "!text-white"
            : isOpen
              ? "!text-white"
              : "!text-gray-400"
        )} />
        {!compact && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {!alwaysExpanded && (
              <ChevronDown
                size={14}
                className={cn(
                  "shrink-0 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            )}
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
  const router = useRouter();
  const { user } = useAuth();
  const permissions = usePermissions();
  const [navQuery, setNavQuery] = useState("");
  const [modKey, setModKey] = useState("Ctrl");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Drag-and-drop module order, set from Settings → Modules. Stored in
  // localStorage (not per-request state), so we read it once on mount and
  // then listen for the custom event that page dispatches on save — a plain
  // `storage` event only fires in *other* tabs, never the one that wrote it.
  const [moduleOrder, setModuleOrder] = useState<string[]>([]);
  const [featureOrder, setFeatureOrder] = useState<Record<string, string[]>>({});
  const [alwaysExpandedModules, setAlwaysExpandedModules] = useState<string[]>([]);
  const tenantSlug = user?.tenant?.slug;

  useEffect(() => {
    const readOrder = () => {
      try {
        const raw = localStorage.getItem(scopedSidebarKey(SIDEBAR_MODULE_ORDER_KEY, tenantSlug));
        setModuleOrder(raw ? JSON.parse(raw) : []);
      } catch {
        setModuleOrder([]);
      }
      try {
        const raw = localStorage.getItem(scopedSidebarKey(SIDEBAR_FEATURE_ORDER_KEY, tenantSlug));
        setFeatureOrder(raw ? JSON.parse(raw) : {});
      } catch {
        setFeatureOrder({});
      }
      try {
        const raw = localStorage.getItem(
          scopedSidebarKey(SIDEBAR_ALWAYS_EXPANDED_MODULES_KEY, tenantSlug)
        );
        setAlwaysExpandedModules(raw ? JSON.parse(raw) : []);
      } catch {
        setAlwaysExpandedModules([]);
      }
    };
    readOrder();
    window.addEventListener(SIDEBAR_ORDER_CHANGED_EVENT, readOrder);
    window.addEventListener("storage", readOrder);
    return () => {
      window.removeEventListener(SIDEBAR_ORDER_CHANGED_EVENT, readOrder);
      window.removeEventListener("storage", readOrder);
    };
  }, [tenantSlug]);

  const filteredNavItems = useMemo(() => {
    const items = filterDashboardNavItems(dashboardNavItems, {
      canView: permissions.canView,
      role: user?.role,
      accountType: user?.tenant?.account_type,
      businessType: user?.tenant?.business_type,
      disabledFeatures: user?.tenant?.disabled_features,
      featureOrder,
    });

    return sortNavItemsByModuleOrder(items, moduleOrder);
  }, [permissions.canView, user?.role, user?.tenant?.account_type, user?.tenant?.business_type, user?.tenant?.active_modules?.join(','), user?.tenant?.disabled_features?.join(','), moduleOrder, featureOrder]);

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
      const el = searchInputRef.current;
      if (!el) return;
      el.readOnly = false;
      el.focus();
      el.select();
    });
    return () => cancelAnimationFrame(id);
  }, [searchFocusNonce, compact]);

  const handleToggle = (label: string) => {
    setOpenKey((prev) => (prev === label ? null : label));
  };

  const handleQuickAction = (item: any) => {
    const actionType = item.quickActionType;
    if (item.href && actionType) {
      router.push(`${item.href}?action=${actionType}`);
    }
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
              type="search"
              name="khata-dashboard-menu-filter"
              value={navQuery}
              readOnly
              onFocus={(e) => {
                e.currentTarget.readOnly = false;
              }}
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
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
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
              onQuickAction={handleQuickAction}
              compact={compact}
              alwaysExpanded={
                !isSearching &&
                !!item.requiredModule &&
                alwaysExpandedModules.includes(item.requiredModule)
              }
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
            "lg:hidden fixed top-4 z-50 p-2 rounded-lg !bg-[#1E2A3B] !text-white shadow-lg",
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
          <div className="relative w-64 h-full !bg-[#1E2A3B] z-50 overflow-hidden">
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
          "relative flex-col h-full shrink-0 !bg-[#1E2A3B] overflow-hidden transition-[width] duration-200",
          forceDesktop
            ? "flex w-full"
            : cn("hidden lg:flex", compact ? "w-[72px]" : "w-64")
        )}
      >
        <SidebarContent
          compact={compact}
          searchFocusNonce={desktopFocusNonce}
        />
        
        {/* Toggle button - positioned at the edge of sidebar */}
        {!forceDesktop && (
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 items-center justify-center rounded-full bg-[#1E2A3B] border border-white/10 !text-gray-400 hover:!text-white hover:bg-[#22C55E] transition-all duration-200 shadow-lg"
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            title={compact ? "Expand sidebar" : "Collapse sidebar"}
          >
            {compact ? (
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        )}
      </aside>
    </>
  );
}

