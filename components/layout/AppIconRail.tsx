"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleHelp, LogOut, Moon, Sun, User } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import { useAppearance } from "@/lib/context/AppearanceContext";
import { usePageTourOptional } from "@/lib/context/PageTourContext";
import { tenantApi, type Tenant } from "@/lib/api/tenant";
import { getDesktopApi } from "@/lib/desktop";
import { useIsElectron } from "@/lib/desktop/use-is-electron";
import { cn, getMediaUrl } from "@/lib/utils";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { useTopbarContentOptional } from "@/lib/context/TopbarContentContext";
import { ErpTabsNav, useErpNavOptional } from "@/lib/context/ErpNavContext";
import { KhataLogo } from "@/components/khata-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function KhataMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M16 2L28 10V22L16 30L4 22V10L16 2Z" fill="#22C55E" />
      <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" fill="white" opacity="0.2" />
      <path d="M16 6L26 12V20L16 26L6 20V12L16 6Z" fill="#22C55E" />
      <path d="M16 10L22 14V18L16 22L10 18V14L16 10Z" fill="white" opacity="0.45" />
    </svg>
  );
}

function RailButton({
  label,
  active,
  onClick,
  href,
  danger,
  disabled,
  horizontal,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
  horizontal?: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    "rounded-lg grid place-items-center transition-colors shrink-0",
    horizontal ? "h-9 w-9" : "h-10 w-10",
    danger
      ? "text-red-500 hover:text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10"
      : active
        ? "bg-[#22C55E]/15 ring-1 ring-[#22C55E]/40 dark:bg-[#22C55E]/20 dark:ring-[#22C55E]/50"
        : "hover:bg-black/5 dark:hover:bg-white/10",
    disabled && "opacity-50 pointer-events-none"
  );

  if (href) {
    return (
      <Link href={href} title={label} aria-label={label} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        className,
        !danger && !active && "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function OrgAvatar({ tenant, active }: { tenant: Tenant; active?: boolean }) {
  const logo = getMediaUrl(tenant.logo);
  const initial = tenant.name.charAt(0).toUpperCase() || "O";

  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg bg-[#22C55E] text-white text-xs font-bold overflow-hidden",
        active && "ring-2 ring-[#22C55E]/50 dark:ring-white/50"
      )}
    >
      {logo ? (
        <img src={logo} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

/**
 * App chrome rail (web only): Khata · orgs · theme · profile · logout.
 * Position: left (vertical) or top (horizontal) — from appearance.navbar_position.
 * Light mode: white · Dark mode: navy.
 */
export function AppIconRail({
  forceHorizontal = false,
}: {
  /** Force horizontal bar (used when placed above content, right of sidebar). */
  forceHorizontal?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const desktop = useIsElectron();
  const { user, logout, switchOrganization } = useAuth();
  const { isDark, preferences, updatePreferences } = useAppearance();
  const pageTour = usePageTourOptional();
  const topbarContent = useTopbarContentOptional();
  const erpNav = useErpNavOptional();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [switchingSlug, setSwitchingSlug] = useState<string | null>(null);

  const onDashboard = pathname.startsWith("/dashboard");
  const onSettings = pathname.startsWith("/settings");
  const onErp = pathname.startsWith("/erp");
  // No workplace switcher in the rail on dashboard, settings, or ERP
  const showOrgs = !onDashboard && !onSettings && !onErp;
  const showNotifications = onDashboard;
  const showPageHelp = onDashboard && Boolean(pageTour);
  const horizontal =
    forceHorizontal || preferences.navbar_position === "top";

  const loadTenants = useCallback(async () => {
    try {
      const data = await tenantApi.getAll();
      setTenants(data.filter((t) => t.is_active !== false));
    } catch {
      // non-critical — rail still works without org list
    }
  }, []);

  useEffect(() => {
    if (!user || !showOrgs) return;
    void loadTenants();
  }, [user?.id, loadTenants, showOrgs]);

  if (desktop) return null;

  const activeSlug = user?.tenant?.slug ?? null;
  const avatarUrl = getMediaUrl(user?.avatar);
  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() ||
      user.username?.[0]?.toUpperCase() ||
      "U"
    : "U";

  const toggleTheme = async () => {
    const next = isDark ? "light" : "dark";
    try {
      await updatePreferences({ theme: next });
      const api = getDesktopApi();
      if (api) {
        await api.store.set("appearance.theme", next);
      }
    } catch {
      // AppearanceContext rolls back optimistic update
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/auth/login");
  };

  const handleOpenOrg = async (tenant: Tenant) => {
    if (switchingSlug) return;

    // Already on this org in dashboard — no-op
    if (activeSlug === tenant.slug && pathname.startsWith("/dashboard")) {
      return;
    }

    try {
      setSwitchingSlug(tenant.slug);
      await switchOrganization(tenant.slug, "/dashboard");
    } catch {
      toast.error(`Could not open ${tenant.name}`);
      setSwitchingSlug(null);
    }
  };

  const shellClass = cn(
    "bg-white border-gray-200 dark:bg-[#162232] dark:border-white/10"
  );

  const dividerClass = "bg-gray-200 dark:bg-white/10";

  const erpBtn = (
    <RailButton label="ERP" href="/erp" active={onErp} horizontal={horizontal}>
      <KhataMark size={horizontal ? 20 : 22} />
    </RailButton>
  );

  const orgButtons =
    showOrgs && tenants.length > 0
      ? tenants.map((tenant) => {
          const active =
            activeSlug === tenant.slug && pathname.startsWith("/dashboard");
          return (
            <RailButton
              key={tenant.id}
              label={tenant.name}
              active={active}
              disabled={switchingSlug === tenant.slug}
              horizontal={horizontal}
              onClick={() => void handleOpenOrg(tenant)}
            >
              <OrgAvatar tenant={tenant} active={active} />
            </RailButton>
          );
        })
      : null;

  const notificationControl = showNotifications ? (
    <div data-tour="topbar-notifications" className="shrink-0">
      <NotificationBell placement={horizontal ? "bottom-end" : "right-start"} />
    </div>
  ) : null;

  const pageHelpControl = showPageHelp ? (
    <div data-tour="topbar-page-help" className="shrink-0">
      <RailButton
        label="Page help"
        onClick={() => {
          if (pageTour?.active) pageTour.endPageTour();
          else pageTour?.startPageTour();
        }}
        horizontal={horizontal}
        active={pageTour?.active}
      >
        <CircleHelp
          className={cn(
            "h-[18px] w-[18px]",
            pageTour?.active
              ? "text-[#22C55E]"
              : "text-gray-500 dark:text-gray-400"
          )}
          strokeWidth={2}
        />
      </RailButton>
    </div>
  ) : null;

  const utilityButtons = (
    <>
      {pageHelpControl}
      <div data-tour="topbar-theme" className="shrink-0">
        <RailButton
          label={isDark ? "Light mode" : "Dark mode"}
          onClick={() => void toggleTheme()}
          horizontal={horizontal}
        >
          {isDark ? (
            <Sun className="h-[18px] w-[18px] text-gray-400" strokeWidth={2} />
          ) : (
            <Moon className="h-[18px] w-[18px] text-gray-500" strokeWidth={2} />
          )}
        </RailButton>
      </div>
      <div data-tour="topbar-user" className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "rounded-lg grid place-items-center transition-colors shrink-0 outline-none",
              horizontal ? "h-9 w-9" : "h-10 w-10",
              onSettings
                ? "bg-[#22C55E]/15 ring-1 ring-[#22C55E]/40 dark:bg-[#22C55E]/20 dark:ring-[#22C55E]/50"
                : "hover:bg-black/5 dark:hover:bg-white/10"
            )}
            aria-label="Account menu"
            title="Account"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22C55E] text-white text-xs font-semibold overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={horizontal ? "end" : "start"}
            side={horizontal ? "bottom" : "right"}
            sideOffset={8}
            className="w-48"
          >
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => router.push("/settings/profile")}
            >
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  if (horizontal) {
    const pageTitle = topbarContent.title;
    const pageSubtitle = topbarContent.subtitle;
    const pageActions = topbarContent.actions;
    const showErpNav =
      onErp && Boolean(erpNav.activeTab && erpNav.onTabChange);
    // Dashboard/settings page chrome matches DashHeader (h-14 card bar)
    const pageChrome = Boolean(pageTitle) && (onDashboard || onSettings);

    return (
      <header
        data-tour="app-icon-rail"
        data-position="top"
        className={cn(
          "flex items-center gap-3 shrink-0 h-14 min-h-14 max-h-14 w-full border-b overflow-hidden",
          pageChrome
            ? "bg-card border-border px-6 shadow-sm"
            : cn("px-4 sm:px-6", shellClass)
        )}
      >
        {showErpNav ? (
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="shrink-0">
              <KhataLogo size="md" />
            </div>
            <ErpTabsNav
              activeTab={erpNav.activeTab}
              onTabChange={erpNav.onTabChange}
              pendingInvitationsCount={erpNav.pendingInvitationsCount}
              className="flex items-center gap-0.5 min-w-0 overflow-x-auto scrollbar-none"
            />
          </div>
        ) : pageTitle ? (
          <div
            data-tour="topbar-title"
            data-page-tour="title"
            className="min-w-0 flex-1"
          >
            <h1
              className={cn(
                "text-base font-medium tracking-tight flex items-baseline gap-x-2 whitespace-nowrap",
                pageChrome
                  ? "text-foreground"
                  : "text-foreground dark:text-white"
              )}
            >
              <span className="truncate">{pageTitle}</span>
              {pageSubtitle && (
                <span
                  className={cn(
                    "text-xs font-normal truncate",
                    pageChrome
                      ? "text-muted-foreground"
                      : "text-muted-foreground dark:text-gray-400"
                  )}
                >
                  {pageSubtitle}
                </span>
              )}
            </h1>
          </div>
        ) : (
          <>
            {!onErp && erpBtn}
            <div className="flex-1" />
          </>
        )}

        {orgButtons && orgButtons.length > 0 && (
          <div
            data-tour="app-icon-rail-orgs"
            className="flex max-w-[40%] min-w-0 items-center justify-end gap-1.5 overflow-x-auto overflow-y-hidden scrollbar-none"
          >
            {orgButtons}
          </div>
        )}

        <div
          data-tour="topbar-actions"
          className="flex items-center gap-1.5 shrink-0 h-9"
        >
          {pageActions ? (
            <div
              data-tour="topbar-page-actions"
              data-page-tour="header-actions"
              className="flex items-center h-9"
            >
              {pageActions}
            </div>
          ) : null}
          {notificationControl}
          {utilityButtons}
        </div>
      </header>
    );
  }

  return (
    <aside
      data-tour="app-icon-rail"
      data-position="left"
      className={cn(
        "flex flex-col items-center shrink-0 w-14 h-full border-r py-3",
        shellClass
      )}
    >
      {!onErp && erpBtn}

      {orgButtons && orgButtons.length > 0 ? (
        <>
          <div className={cn("my-2 h-px w-6 shrink-0", dividerClass)} />
          <div
            data-tour="app-icon-rail-orgs"
            className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden scrollbar-thin-sidebar flex flex-col items-center gap-1.5 px-1"
          >
            {orgButtons}
          </div>
        </>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex flex-col items-center gap-1.5 pt-2 shrink-0">
        {notificationControl}
        {utilityButtons}
      </div>
    </aside>
  );
}
