"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, ShoppingCart, Package, BookOpen,
  Monitor, Users, BarChart2, Settings, ChevronDown, X, Menu, HardHat, Plus, Wrench,
  PanelLeft, PanelLeftClose,
} from "lucide-react";
import { KhataLogo } from "@/components/khata-logo";
import { useAuth } from "@/lib/context/AuthContext";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useDesktopWorkspaceOptional } from "@/lib/context/DesktopWorkspaceContext";
import { cn } from "@/lib/utils";

interface SubItem {
  label: string;
  href: string;
  createHref?: string; // Optional quick create link
  exact?: boolean; // Only highlight on exact path (for module overview pages)
}

function matchesNavChild(pathname: string, child: SubItem): boolean {
  if (child.exact) {
    return pathname === child.href;
  }
  if (pathname === child.href || pathname.startsWith(`${child.href}/`)) {
    return true;
  }
  if (!child.createHref) {
    return false;
  }
  const createPath = child.createHref.split("?")[0];
  return pathname === createPath || pathname.startsWith(`${createPath}/`);
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: SubItem[];
  requiredModule?: string; // Module required to see this nav item
  requiredRoles?: string[]; // Roles allowed to see this nav item
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  {
    label: "Sales", 
    icon: TrendingUp,
    requiredModule: "sales",
    children: [
      { label: "Overview", href: "/dashboard/sales", exact: true },
      { label: "Sales Orders", href: "/dashboard/sales/orders", createHref: "/dashboard/sales/orders/new" },
      { label: "Quotations", href: "/dashboard/sales/quotations", createHref: "/dashboard/sales/quotations/new" },
      { label: "Customers", href: "/dashboard/sales/customers", createHref: "/dashboard/sales/customers/new" },
      { label: "Sales Invoice", href: "/dashboard/sales/invoices", createHref: "/dashboard/sales/invoices/new" },
      { label: "Credit Notes", href: "/dashboard/sales/credit-notes", createHref: "/dashboard/sales/credit-notes/new" },
      { label: "Payments", href: "/dashboard/sales/payments", createHref: "/dashboard/sales/payments/new" },
      { label: "Customer Credit", href: "/dashboard/sales/credit" },
      { label: "Sales Reports", href: "/dashboard/sales/reports" },
    ],
  },
  {
    label: "Purchase", 
    icon: ShoppingCart,
    requiredModule: "purchase",
    children: [
      { label: "Overview", href: "/dashboard/purchase", exact: true },
      { label: "Purchase Orders", href: "/dashboard/purchase/orders", createHref: "/dashboard/purchase/orders/new" },
      { label: "Purchase Requests", href: "/dashboard/purchase/requests", createHref: "/dashboard/purchase/requests/new" },
      { label: "Suppliers", href: "/dashboard/purchase/suppliers", createHref: "/dashboard/purchase/suppliers/new" },
      { label: "Purchase Invoice", href: "/dashboard/purchase/invoices", createHref: "/dashboard/purchase/invoices/new" },
      { label: "Debit Notes", href: "/dashboard/purchase/debit-notes", createHref: "/dashboard/purchase/debit-notes/new" },
      { label: "Purchase Reports", href: "/dashboard/purchase/reports" },
    ],
  },
  {
    label: "Inventory", 
    icon: Package,
    requiredModule: "inventory",
    children: [
      { label: "Overview", href: "/dashboard/inventory", exact: true },
      { label: "Products", href: "/dashboard/inventory/products", createHref: "/dashboard/inventory/products/new" },
      { label: "Product Categories", href: "/dashboard/inventory/categories", createHref: "/dashboard/inventory/categories?new=1" },
      { label: "Bulk Pricing", href: "/dashboard/inventory/bulk-pricing", createHref: "/dashboard/inventory/bulk-pricing/new" },
      { label: "Stock Adjustment", href: "/dashboard/inventory/adjustment", createHref: "/dashboard/inventory/adjustment?new=1" },
      { label: "Stock Transfer", href: "/dashboard/inventory/transfer", createHref: "/dashboard/inventory/transfer?new=1" },
      { label: "Warehouses", href: "/dashboard/inventory/warehouses", createHref: "/dashboard/inventory/warehouses?new=1" },
      { label: "Units of Measure", href: "/dashboard/inventory/uom", createHref: "/dashboard/inventory/uom?new=1" },
      { label: "Stock In", href: "/dashboard/inventory/stock-in" },
      { label: "Stock Out", href: "/dashboard/inventory/stock-out" },
      { label: "Inventory Reports", href: "/dashboard/inventory/reports" },
    ],
  },
  {
    label: "Hardware", 
    icon: Wrench,
    requiredModule: "hardware",
    children: [
      { label: "Overview", href: "/dashboard/hardware", exact: true },
      { label: "Products", href: "/dashboard/hardware/products", createHref: "/dashboard/hardware/products/new" },
      { label: "Customers", href: "/dashboard/hardware/customers", createHref: "/dashboard/hardware/customers/new" },
      { label: "Orders", href: "/dashboard/hardware/orders", createHref: "/dashboard/hardware/orders/new" },
      { label: "Payments", href: "/dashboard/hardware/payments", createHref: "/dashboard/hardware/payments/new" },
      { label: "Customer Credit", href: "/dashboard/hardware/credit" },
      { label: "Aging Report", href: "/dashboard/hardware/aging" },
      { label: "Bulk Pricing", href: "/dashboard/hardware/bulk-pricing", createHref: "/dashboard/hardware/bulk-pricing/new" },
      { label: "Reports", href: "/dashboard/hardware/reports" },
    ],
  },
  {
    label: "Construction", 
    icon: HardHat,
    requiredModule: "construction",
    children: [
      { label: "Overview", href: "/dashboard/construction", exact: true },
      { label: "Sites", href: "/dashboard/construction/sites", createHref: "/dashboard/construction/sites/new" },
      { label: "Workers", href: "/dashboard/construction/workers", createHref: "/dashboard/construction/workers/new" },
      { label: "Attendance", href: "/dashboard/construction/attendance", createHref: "/dashboard/construction/attendance/mark" },
      { label: "Daily Logs", href: "/dashboard/construction/daily-logs", createHref: "/dashboard/construction/daily-logs/new" },
      { label: "Material Consumption", href: "/dashboard/construction/material-consumption", createHref: "/dashboard/construction/consumption/new" },
      { label: "Equipment", href: "/dashboard/construction/equipment", createHref: "/dashboard/construction/equipment/new" },
      { label: "Equipment Usage", href: "/dashboard/construction/equipment-usage" },
      { label: "Construction Reports", href: "/dashboard/construction/reports" },
    ],
  },
  {
    label: "Accounting", 
    icon: BookOpen,
    requiredModule: "accounting",
    requiredRoles: ["admin", "accountant", "manager"],
    children: [
      { label: "Overview", href: "/dashboard/accounting", exact: true },
      { label: "Chart of Accounts", href: "/dashboard/accounting/chart-of-accounts", createHref: "/dashboard/accounting/chart-of-accounts/new" },
      { label: "Journal Entries", href: "/dashboard/accounting/journal-entries", createHref: "/dashboard/accounting/journal-entries/new" },
      { label: "General Ledger", href: "/dashboard/accounting/general-ledger" },
      { label: "Trial Balance", href: "/dashboard/accounting/trial-balance" },
      { label: "Profit & Loss", href: "/dashboard/accounting/profit-loss" },
      { label: "Balance Sheet", href: "/dashboard/accounting/balance-sheet" },
      { label: "Tax Management", href: "/dashboard/accounting/tax-management", createHref: "/dashboard/accounting/tax-management/new" },
      { label: "Financial Reports", href: "/dashboard/accounting/reports" },
      { label: "Fiscal Year", href: "/dashboard/accounting/fiscal-year" },
      { label: "Bank Accounts", href: "/dashboard/accounting/bank-accounts", createHref: "/dashboard/accounting/bank-accounts/new" },
    ],
  },
  {
    label: "POS", 
    icon: Monitor,
    requiredModule: "pos",
    children: [
      { label: "Billing", href: "/dashboard/pos" },
      { label: "Sessions", href: "/dashboard/pos/sessions", createHref: "/dashboard/pos/sessions/new" },
      { label: "Transactions", href: "/dashboard/pos/transactions" },
      { label: "Discounts", href: "/dashboard/pos/discounts", createHref: "/dashboard/pos/discounts?new=1" },
      { label: "Daily Reports", href: "/dashboard/pos/reports" },
    ],
  },
  {
    label: "HR", 
    icon: Users,
    requiredModule: "hr",
    requiredRoles: ["admin", "manager"],
    children: [
      { label: "Overview", href: "/dashboard/hr", exact: true },
      { label: "Employees", href: "/dashboard/hr/employees", createHref: "/dashboard/hr/employees/new" },
      { label: "Departments", href: "/dashboard/hr/departments", createHref: "/dashboard/hr/departments/new" },
      { label: "Attendance", href: "/dashboard/hr/attendance", createHref: "/dashboard/hr/attendance/mark" },
      { label: "Leave Management", href: "/dashboard/hr/leave", createHref: "/dashboard/hr/leave/requests/new" },
      { label: "Payroll", href: "/dashboard/hr/payroll", createHref: "/dashboard/hr/payroll/new" },
      { label: "HR Reports", href: "/dashboard/hr/reports" },
    ],
  },
  {
    label: "Reports", 
    icon: BarChart2,
    requiredModule: "reports",
    children: [
      { label: "Overview", href: "/dashboard/reports", exact: true },
      { label: "Sales Report", href: "/dashboard/reports/sales" },
      { label: "Purchase Report", href: "/dashboard/reports/purchase" },
      { label: "Inventory Report", href: "/dashboard/reports/inventory" },
      { label: "Financial Report", href: "/dashboard/reports/financial" },
      { label: "Tax Report", href: "/dashboard/reports/tax" },
      { label: "Custom Reports", href: "/dashboard/reports/custom", createHref: "/dashboard/reports/custom?tab=builder" },
    ],
  },
  {
    label: "Settings", 
    icon: Settings,
    requiredModule: "settings",
    requiredRoles: ["admin", "manager"],
    children: [
      { label: "Organization Settings", href: "/dashboard/settings/org" },
      { label: "Modules", href: "/dashboard/settings/modules" },
      { label: "Users & Roles", href: "/dashboard/settings/users", createHref: "/dashboard/settings/users/invite" },
      { label: "Help Desk", href: "/dashboard/settings/help" },
      { label: "Audit Logs", href: "/dashboard/settings/audit" },
    ],
  },
];

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

function SidebarContent({
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
  const permissions = usePermissions();

  const filteredNavItems = navItems.filter((item) => {
    if (item.requiredModule && !permissions.canView(item.requiredModule)) {
      return false;
    }

    if (item.requiredRoles && user) {
      if (user.role === "admin" || user.role === "super_admin") {
        return true;
      }
      if (!item.requiredRoles.includes(user.role)) {
        return false;
      }
    }

    return true;
  });

  const defaultOpen = filteredNavItems.find((item) =>
    item.children?.some((c) => matchesNavChild(pathname, c))
  )?.label ?? null;

  const [openKey, setOpenKey] = useState<string | null>(defaultOpen);

  useEffect(() => {
    const match = filteredNavItems.find((item) =>
      item.children?.some((c) => matchesNavChild(pathname, c))
    );
    if (match) {
      setOpenKey(match.label);
    }
  }, [pathname]);

  const handleToggle = (label: string) => {
    setOpenKey((prev) => (prev === label ? null : label));
  };

  return (
    <div className="flex flex-col h-full" data-tour="sidebar-content">
      <div
        data-tour="sidebar-org"
        className={cn(
          "border-b border-white/10 flex items-center justify-between gap-2",
          compact ? "px-2 py-4" : "px-5 py-5"
        )}
      >
        {user?.tenant ? (
          <div className={cn("flex items-center gap-3 min-w-0", compact && "justify-center flex-1")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user.tenant.name.charAt(0).toUpperCase()}
            </div>
            {!compact && (
              <div className="flex flex-col min-w-0">
                <span className="text-white font-semibold text-sm leading-tight truncate">
                  {user.tenant.name}
                </span>
                {user.role && (
                  <span className="text-gray-400 text-xs leading-tight truncate capitalize">
                    {user.role === "super_admin" ? "Super Admin" : user.role}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={cn(compact && "flex-1 flex justify-center")}>
            {!compact ? <KhataLogo size="md" /> : (
              <div className="w-8 h-8 rounded-lg bg-[#22C55E] grid place-items-center text-white text-sm font-bold">
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
        data-tour="sidebar-nav"
        className={cn(
          "flex-1 py-3 space-y-0.5 overflow-y-auto scrollbar-thin-sidebar",
          compact ? "px-2" : "px-3"
        )}
      >
        {filteredNavItems.map((item) => (
          <SidebarItem
            key={item.label}
            item={item}
            openKey={openKey}
            onToggle={handleToggle}
            compact={compact}
          />
        ))}
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [webCollapsed, setWebCollapsed] = useState(false);

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

  return (
    <>
      {!forceDesktop && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1E2A3B] text-white shadow-lg"
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
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <aside
        data-tour="sidebar"
        data-compact={compact ? "true" : "false"}
        className={cn(
          "flex-col h-full shrink-0 bg-[#1E2A3B] overflow-hidden transition-[width] duration-200",
          forceDesktop
            ? "flex w-full"
            : cn("hidden lg:flex", compact ? "w-[72px]" : "w-64")
        )}
      >
        <SidebarContent compact={compact} onToggleCollapse={toggleCollapse} />
      </aside>
    </>
  );
}

