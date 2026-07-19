"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu, PanelLeft, PanelLeftClose, X } from "lucide-react";
import { KhataLogo } from "@/components/khata-logo";
import { useAuth } from "@/lib/context/AuthContext";
import { billingApi } from "@/lib/api/billing";
import { cn, getMediaUrl } from "@/lib/utils";
import { SETTINGS_NAV_ITEMS, isSettingsNavActive } from "@/lib/settings/nav-items";

const SETTINGS_SIDEBAR_COLLAPSED_KEY = "khata-settings-sidebar-collapsed";

function AccountSidebarContent({
  onClose,
  compact = false,
  onToggleCollapse,
}: {
  onClose?: () => void;
  compact?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [planName, setPlanName] = useState<string | null>(null);

  const displayName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username
    : "";
  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() ||
      user.username?.[0]?.toUpperCase() ||
      "U"
    : "U";

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

  return (
    <div className="flex flex-col h-full">
      <div
        className={cn(
          "border-b border-white/10 flex items-center justify-between gap-2",
          compact ? "px-2 py-4" : "px-5 py-5"
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

        <div className="flex items-center gap-1 shrink-0">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
              title={compact ? "Expand sidebar" : "Collapse sidebar"}
            >
              {compact ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors lg:hidden p-1.5"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <nav
        className={cn(
          "flex-1 py-3 space-y-0.5 overflow-y-auto scrollbar-thin-sidebar",
          compact ? "px-2" : "px-3"
        )}
      >
        {SETTINGS_NAV_ITEMS.map((item) => {
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1E2A3B] text-white shadow-lg"
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
            <AccountSidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <aside
        data-compact={collapsed ? "true" : "false"}
        className={cn(
          "hidden lg:flex flex-col shrink-0 bg-[#1E2A3B] h-full sticky top-0 overflow-hidden transition-[width] duration-200",
          collapsed ? "w-[72px]" : "w-60"
        )}
      >
        <AccountSidebarContent
          compact={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>
    </>
  );
}
