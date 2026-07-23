import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Package,
  BookOpen,
  Monitor,
  Users,
  BarChart2,
  Settings,
  HardHat,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  label: string;
  href: string;
  createHref?: string;
  exact?: boolean;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: NavSubItem[];
  requiredModule?: string;
  requiredRoles?: string[];
}

export function matchesNavChild(pathname: string, child: NavSubItem): boolean {
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

export const dashboardNavItems: NavItem[] = [
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

export function filterDashboardNavItems(
  items: NavItem[],
  opts: {
    canView: (module: string) => boolean;
    role?: string | null;
  }
): NavItem[] {
  return items.filter((item) => {
    if (item.requiredModule && !opts.canView(item.requiredModule)) {
      return false;
    }

    if (item.requiredRoles && opts.role) {
      if (opts.role === "admin" || opts.role === "super_admin") {
        return true;
      }
      if (!item.requiredRoles.includes(opts.role)) {
        return false;
      }
    }

    return true;
  });
}
