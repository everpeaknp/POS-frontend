"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, ShoppingCart, Package, BookOpen,
  Monitor, Users, BarChart2, Settings, ChevronDown, X, Menu, HardHat, Plus, Wrench,
} from "lucide-react";
import { TiggLogo } from "@/components/tigg-logo";
import { useAuth } from "@/lib/context/AuthContext";
import { usePermissions } from "@/lib/hooks/usePermissions";

interface SubItem {
  label: string;
  href: string;
  createHref?: string; // Optional quick create link
}

function matchesNavChild(pathname: string, child: SubItem): boolean {
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
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", requiredModule: "dashboard" },
  {
    label: "Sales", 
    icon: TrendingUp,
    requiredModule: "sales",
    children: [
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
      { label: "Products", href: "/dashboard/inventory/products", createHref: "/dashboard/inventory/products/new" },
      { label: "Product Categories", href: "/dashboard/inventory/categories", createHref: "/dashboard/inventory/categories?new=1" },
      { label: "Bulk Pricing", href: "/dashboard/inventory/bulk-pricing", createHref: "/dashboard/inventory/bulk-pricing/new" },
      { label: "Stock Adjustment", href: "/dashboard/inventory/adjustment", createHref: "/dashboard/inventory/adjustment?new=1" },
      { label: "Stock Transfer", href: "/dashboard/inventory/transfer", createHref: "/dashboard/inventory/transfer?new=1" },
      { label: "Warehouses", href: "/dashboard/inventory/warehouses", createHref: "/dashboard/inventory/warehouses?new=1" },
      { label: "Units of Measure", href: "/dashboard/inventory/uom", createHref: "/dashboard/inventory/uom?new=1" },
      { label: "Inventory Reports", href: "/dashboard/inventory/reports" },
    ],
  },
  {
    label: "Hardware", 
    icon: Wrench,
    requiredModule: "hardware",
    children: [
      { label: "Dashboard", href: "/dashboard/hardware" },
      { label: "Products", href: "/dashboard/hardware/products", createHref: "/dashboard/inventory/products/new" },
      { label: "Customers", href: "/dashboard/hardware/customers", createHref: "/dashboard/sales/customers/new" },
      { label: "Orders", href: "/dashboard/hardware/orders", createHref: "/dashboard/sales/orders/new" },
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
      { label: "Sites", href: "/dashboard/construction/sites", createHref: "/dashboard/construction/sites/new" },
      { label: "Workers", href: "/dashboard/construction/workers", createHref: "/dashboard/construction/workers/new" },
      { label: "Attendance", href: "/dashboard/construction/attendance" },
      { label: "Daily Logs", href: "/dashboard/construction/daily-logs", createHref: "/dashboard/construction/daily-logs/new" },
      { label: "Material Consumption", href: "/dashboard/construction/material-consumption", createHref: "/dashboard/construction/consumption/new" },
      { label: "Equipment", href: "/dashboard/construction/equipment", createHref: "/dashboard/construction/equipment/new" },
      { label: "Construction Reports", href: "/dashboard/construction/reports" },
    ],
  },
  {
    label: "Accounting", 
    icon: BookOpen,
    requiredModule: "accounting",
    requiredRoles: ["admin", "accountant", "manager"],
    children: [
      { label: "Overview", href: "/dashboard/accounting" },
      { label: "Chart of Accounts", href: "/dashboard/accounting/chart-of-accounts", createHref: "/dashboard/accounting/chart-of-accounts/new" },
      { label: "Journal Entries", href: "/dashboard/accounting/journal-entries", createHref: "/dashboard/accounting/journal-entries/new" },
      { label: "General Ledger", href: "/dashboard/accounting/general-ledger" },
      { label: "Trial Balance", href: "/dashboard/accounting/trial-balance" },
      { label: "Profit & Loss", href: "/dashboard/accounting/profit-loss" },
      { label: "Balance Sheet", href: "/dashboard/accounting/balance-sheet" },
      { label: "Tax Management", href: "/dashboard/accounting/tax-management", createHref: "/dashboard/accounting/tax-management/new" },
      { label: "Bank Accounts", href: "/dashboard/accounting/bank-accounts", createHref: "/dashboard/accounting/bank-accounts/new" },
    ],
  },
  {
    label: "POS", 
    icon: Monitor,
    requiredModule: "pos",
    children: [
      { label: "Billing", href: "/dashboard/pos" },
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
      { label: "Users & Roles", href: "/dashboard/settings/users", createHref: "/dashboard/settings/users/invite" },
      { label: "Billing & Subscription", href: "/dashboard/settings/billing" },
      { label: "Integrations", href: "/dashboard/settings/integrations" },
      { label: "Audit Logs", href: "/dashboard/settings/audit" },
    ],
  },
];

function SidebarItem({ item, openKey, onToggle }: {
  item: NavItem;
  openKey: string | null;
  onToggle: (label: string) => void;
}) {
  const pathname = usePathname();
  const isOpen = openKey === item.label;

  const isChildActive = item.children?.some((c) => matchesNavChild(pathname, c)) ?? false;
  const isParentActive = item.href ? pathname === item.href : isChildActive;

  // Direct link (Dashboard)
  if (item.href && !item.children) {
    return (
      <Link href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isParentActive
            ? "bg-[#22C55E] text-white"
            : "text-gray-400 hover:text-white hover:bg-white/10"
        }`}>
        <item.icon size={17} className="shrink-0" />
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      {/* Parent button */}
      <button
        onClick={() => onToggle(item.label)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isParentActive && !isOpen
            ? "bg-[#22C55E] text-white"
            : isOpen
            ? "bg-white/10 text-white"
            : "text-gray-400 hover:text-white hover:bg-white/10"
        }`}
      >
        <item.icon size={17} className="shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Submenu */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ maxHeight: isOpen ? "500px" : "0px" }}
      >
        <div className="ml-4 mt-0.5 mb-1 pl-3 border-l border-white/10 space-y-0.5">
          {item.children?.map((child) => {
            const active = matchesNavChild(pathname, child);
            return (
              <div key={child.href} className="group flex items-center gap-1">
                <Link href={child.href}
                  className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-all ${
                    active
                      ? "text-[#22C55E] border-l-2 border-[#22C55E] -ml-[1px] pl-[9px] bg-white/5"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}>
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
    </div>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const permissions = usePermissions();

  // Filter nav items based on user permissions
  const filteredNavItems = navItems.filter((item) => {
    // Check if user has required role
    if (item.requiredRoles && user) {
      // Admin can see everything
      if (user.role === 'admin') {
        return true;
      }
      if (!item.requiredRoles.includes(user.role)) {
        return false;
      }
    }

    // Check if user has module access via permissions
    if (item.requiredModule) {
      if (!permissions.canView(item.requiredModule)) {
        return false;
      }
    }

    return true;
  });

  // Find which parent should be open by default based on current path
  const defaultOpen = filteredNavItems.find((item) =>
    item.children?.some((c) => matchesNavChild(pathname, c))
  )?.label ?? null;

  const [openKey, setOpenKey] = useState<string | null>(defaultOpen);

  // Update open key when pathname changes
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
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        {user?.tenant ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(user.tenant.workspace_name || user.tenant.name).charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-semibold text-sm leading-tight truncate">
                {user.tenant.workspace_name || user.tenant.name}
              </span>
              <span className="text-gray-400 text-xs leading-tight truncate">
                {user.tenant.slug}.khata.app
              </span>
            </div>
          </div>
        ) : (
          <TiggLogo size="md" />
        )}
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors lg:hidden" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-green">
        {filteredNavItems.map((item) => (
          <SidebarItem key={item.label} item={item} openKey={openKey} onToggle={handleToggle} />
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-xs text-gray-600">© 2025 Khata Business OS</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1E2A3B] text-white shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full bg-[#1E2A3B] z-50 overflow-hidden">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#1E2A3B] h-screen sticky top-0 overflow-hidden">
        <SidebarContent />
      </aside>
    </>
  );
}
