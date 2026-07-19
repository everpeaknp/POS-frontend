/**
 * Static navigation catalog for command palette / quick search.
 * Mirrors sidebar routes — does not duplicate page components.
 */
export type NavCatalogItem = {
  id: string;
  label: string;
  href: string;
  group: string;
  keywords?: string[];
};

export const DESKTOP_NAV_CATALOG: NavCatalogItem[] = [
  { id: "dash", label: "Dashboard", href: "/dashboard", group: "Navigate", keywords: ["home", "overview"] },
  { id: "sales", label: "Sales overview", href: "/dashboard/sales", group: "Sales", keywords: ["billing"] },
  { id: "sales-orders", label: "Sales orders", href: "/dashboard/sales/orders", group: "Sales" },
  { id: "sales-invoices", label: "Sales invoices", href: "/dashboard/sales/invoices", group: "Sales", keywords: ["invoice"] },
  { id: "customers", label: "Customers", href: "/dashboard/sales/customers", group: "Sales" },
  { id: "purchase", label: "Purchase overview", href: "/dashboard/purchase", group: "Purchase" },
  { id: "purchase-orders", label: "Purchase orders", href: "/dashboard/purchase/orders", group: "Purchase" },
  { id: "suppliers", label: "Suppliers", href: "/dashboard/purchase/suppliers", group: "Purchase" },
  { id: "inventory", label: "Inventory overview", href: "/dashboard/inventory", group: "Inventory", keywords: ["stock"] },
  { id: "products", label: "Products", href: "/dashboard/inventory/products", group: "Inventory" },
  { id: "warehouses", label: "Warehouses", href: "/dashboard/inventory/warehouses", group: "Inventory" },
  { id: "accounting", label: "Accounting overview", href: "/dashboard/accounting", group: "Accounting" },
  { id: "coa", label: "Chart of accounts", href: "/dashboard/accounting/chart-of-accounts", group: "Accounting" },
  { id: "journals", label: "Journal entries", href: "/dashboard/accounting/journal-entries", group: "Accounting" },
  { id: "pnl", label: "Profit & Loss", href: "/dashboard/accounting/profit-loss", group: "Accounting" },
  { id: "pos", label: "Point of Sale", href: "/dashboard/pos", group: "POS", keywords: ["billing", "cashier"] },
  { id: "hr", label: "HR overview", href: "/dashboard/hr", group: "HR", keywords: ["employees"] },
  { id: "employees", label: "Employees", href: "/dashboard/hr/employees", group: "HR" },
  { id: "reports", label: "Reports", href: "/dashboard/reports", group: "Reports" },
  { id: "settings-org", label: "Organization settings", href: "/dashboard/settings/org", group: "Settings" },
  { id: "settings-modules", label: "Modules", href: "/dashboard/settings/modules", group: "Settings" },
  { id: "settings-users", label: "Users & roles", href: "/dashboard/settings/users", group: "Settings" },
  { id: "help", label: "Help Desk", href: "/dashboard/settings/help", group: "Settings", keywords: ["tour", "guide"] },
  { id: "erp", label: "Organizations", href: "/erp", group: "Workspace", keywords: ["switch", "tenant"] },
];

export const DESKTOP_COMMANDS: NavCatalogItem[] = [
  { id: "cmd-palette", label: "Command palette", href: "#command-palette", group: "Commands", keywords: ["ctrl", "shift", "p"] },
  { id: "cmd-search", label: "Quick page search", href: "#global-search", group: "Commands", keywords: ["ctrl", "k"] },
  { id: "cmd-reload", label: "Reload window", href: "#reload", group: "Commands", keywords: ["f5"] },
  { id: "cmd-fullscreen", label: "Toggle fullscreen", href: "#fullscreen", group: "Commands", keywords: ["f11"] },
  { id: "cmd-sync", label: "Sync data", href: "#sync", group: "Commands", keywords: ["offline", "queue"] },
];

export function titleForPath(pathname: string): string {
  const exact = DESKTOP_NAV_CATALOG.find((i) => i.href === pathname);
  if (exact) return exact.label;
  const partial = [...DESKTOP_NAV_CATALOG]
    .filter((i) => pathname.startsWith(i.href) && i.href !== "/dashboard")
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (partial) return partial.label;
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/erp")) return "Organizations";
  if (pathname.startsWith("/settings/profile")) return "Profile";
  if (pathname.startsWith("/settings/security")) return "Security";
  if (pathname.startsWith("/settings/notifications")) return "Notifications";
  if (pathname.startsWith("/settings/appearance")) return "Appearance";
  if (pathname.startsWith("/settings/billing")) return "Billing";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/auth")) return "Sign in";
  return "Khata";
}
