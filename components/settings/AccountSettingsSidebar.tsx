"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  X,
} from "lucide-react";
import { KhataLogo } from "@/components/khata-logo";
import { useAuth } from "@/lib/context/AuthContext";
import { useAppearance } from "@/lib/context/AppearanceContext";
import { billingApi } from "@/lib/api/billing";
import { cn, getMediaUrl } from "@/lib/utils";
import { SETTINGS_NAV_ITEMS, isSettingsNavActive } from "@/lib/settings/nav-items";

const SETTINGS_SIDEBAR_COLLAPSED_KEY = "khata-settings-sidebar-collapsed";

function AccountSidebarContent({
  onClose,
  compact = false,
  searchFocusNonce = 0,
}: {
  onClose?: () => void;
  compact?: boolean;
  searchFocusNonce?: number;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [planName, setPlanName] = useState<string | null>(null);
  const [navQuery, setNavQuery] = useState("");
  const [modKey, setModKey] = useState("Ctrl");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const displayName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username
    : "";
  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() ||
      user.username?.[0]?.toUpperCase() ||
      "U"
    : "U";

  useEffect(() => {
    if (/Mac|iPhone|iPad|iPod/.test(navigator.platform)) {
      setModKey("⌘");
    }
  }, []);

  // Drop menu filter when navigating (also clears password-manager autofill into search)
  useEffect(() => {
    setNavQuery("");
  }, [pathname]);

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

  useEffect(() => {
    if (!user) {
      setPlanName(null);
      return;
    }

    let cancelled = false;
    billingApi
      .getAccountLimits()
      .then((limits) => {
        if (!cancelled) setPlanName(limits.account_plan_name || "Free");
      })
      .catch(() => {
        if (!cancelled) setPlanName("Free");
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const avatarUrl = user?.avatar ? getMediaUrl(user.avatar) : null;
  const q = navQuery.trim().toLowerCase();
  const filteredNavItems = q
    ? SETTINGS_NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(q))
    : SETTINGS_NAV_ITEMS;
  const showBack = !q || "back".includes(q);

  return (
    <div className="flex flex-col h-full" data-tour="settings-sidebar">
      <div
        className={cn(
          "border-b border-white/10 flex items-center justify-between gap-2",
          compact ? "px-2 py-4" : "px-4 py-4"
        )}
      >
        {user ? (
          <div
            className={cn(
              "flex items-center gap-3 min-w-0",
              compact && "justify-center flex-1"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-[#22C55E] flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {!compact && (
              <div className="flex flex-col min-w-0">
                <span className="text-white font-semibold text-sm leading-tight truncate">
                  {displayName}
                </span>
                <span className="text-gray-400 text-xs leading-tight truncate">
                  {planName ? `${planName} plan` : "…"}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className={cn(compact && "flex-1 flex justify-center")}>
            {!compact ? (
              <KhataLogo size="md" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#22C55E] grid place-items-center text-white text-sm font-bold">
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
              name="khata-settings-menu-filter"
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
        className={cn(
          "flex-1 py-3 space-y-0.5 overflow-y-auto scrollbar-thin-sidebar",
          compact ? "px-2" : "px-3"
        )}
      >
        {filteredNavItems.length === 0 && !showBack ? (
          <p className="px-3 py-4 text-xs text-gray-500 text-center">
            No menu items found
          </p>
        ) : (
          <>
            {filteredNavItems.map((item) => {
              const active = isSettingsNavActive(pathname, item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={item.label}
                  onClick={onClose}
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
            })}

            {showBack && (
              <Link
                href="/erp"
                title="Back"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all mt-1",
                  compact && "justify-center px-2"
                )}
              >
                <ArrowLeft size={17} className="shrink-0" />
                {!compact && "Back"}
              </Link>
            )}
          </>
        )}
      </nav>

      {!compact && (
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Khata Business OS
          </p>
        </div>
      )}
    </div>
  );
}

export function AccountSettingsSidebar() {
  const { preferences } = useAppearance();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchFocusNonce, setSearchFocusNonce] = useState(0);
  const railOnTop = preferences.navbar_position === "top";

  useEffect(() => {
    setCollapsed(localStorage.getItem(SETTINGS_SIDEBAR_COLLAPSED_KEY) === "1");
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SETTINGS_SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey) return;
      if (e.key.toLowerCase() !== "k") return;
      e.preventDefault();

      const isMobileViewport =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 1023px)").matches;

      if (isMobileViewport) {
        setMobileOpen(true);
      } else if (collapsed) {
        setCollapsed(false);
        try {
          localStorage.setItem(SETTINGS_SIDEBAR_COLLAPSED_KEY, "0");
        } catch {
          // ignore
        }
      }

      setSearchFocusNonce((n) => n + 1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed]);

  const mobileFocusNonce = mobileOpen ? searchFocusNonce : 0;
  const desktopFocusNonce = mobileOpen ? 0 : searchFocusNonce;

  return (
    <>
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

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 h-full bg-[#1E2A3B] z-50 overflow-hidden">
            <AccountSidebarContent
              onClose={() => setMobileOpen(false)}
              searchFocusNonce={mobileFocusNonce}
            />
          </div>
        </div>
      )}

      <aside
        data-compact={collapsed ? "true" : "false"}
        className={cn(
          "relative hidden lg:flex flex-col shrink-0 bg-[#1E2A3B] h-full sticky top-0 overflow-hidden transition-[width] duration-200",
          collapsed ? "w-[72px]" : "w-60"
        )}
      >
        <AccountSidebarContent
          compact={collapsed}
          searchFocusNonce={desktopFocusNonce}
        />
        <button
          type="button"
          onClick={toggleCollapse}
          className="absolute top-1/2 right-0 z-20 -translate-y-1/2 h-10 w-5 rounded-l-md border border-r-0 border-white/15 bg-[#243447] text-gray-300 hover:bg-[#2d4058] hover:text-white grid place-items-center transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          )}
        </button>
      </aside>
    </>
  );
}
