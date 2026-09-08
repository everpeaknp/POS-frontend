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
  Wallet,
  CreditCard,
  DollarSign,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  label: string;
  href: string;
  createHref?: string;
  exact?: boolean;
  hideForPersonal?: boolean;
  personalOnly?: boolean;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: NavSubItem[];
  requiredModule?: string;
  requiredRoles?: string[];
  hideForPersonal?: boolean;
  personalOnly?: boolean;
  hasQuickAction?: boolean;
  /** Always renders first in the sidebar, immune to the drag-and-drop module order. */
  pinnedFirst?: boolean;
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

// =============================================================================
// SHARED NAV ITEMS (Reusable across workplace types)
// =============================================================================

const DASHBOARD_NAV: NavItem = {
  label: "Dashboard",
  icon: LayoutDashboard,
  href: "/dashboard",
  hideForPersonal: true,
  pinnedFirst: true,
};

const SALES_NAV: NavItem = {
  label: "Sales",
  icon: TrendingUp,
  requiredModule: "sales",
  children: [
    { label: "Overview", href: "/dashboard/sales", exact: true },
    { label: "Sales Orders", href: "/dashboard/sales/orders", createHref: "/dashboard/sales/orders/new" },
    { label: "Quotations", href: "/dashboard/sales/quotations", createHref: "/dashboard/sales/quotations/new" },
    { label: "Sales Invoice", href: "/dashboard/sales/invoices", createHref: "/dashboard/sales/invoices/new" },
    { label: "Credit Notes", href: "/dashboard/sales/credit-notes", createHref: "/dashboard/sales/credit-notes/new" },
    { label: "Payments", href: "/dashboard/sales/payments", createHref: "/dashboard/sales/payments/new" },
    { label: "Sales Reports", href: "/dashboard/sales/reports" },
  ],
};

const CUSTOMERS_NAV: NavItem = {
  label: "Customers",
  icon: Users,
  requiredModule: "customers",
  children: [
    { label: "Customers", href: "/dashboard/sales/customers", createHref: "/dashboard/sales/customers/new" },
    { label: "Udaro (Credit)", href: "/dashboard/sales/customers/udaro" },
  ],
};

const PURCHASE_NAV: NavItem = {
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
};

const INVENTORY_NAV: NavItem = {
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
};

const ACCOUNTING_NAV: NavItem = {
  label: "Accounting",
  icon: BookOpen,
  requiredModule: "accounting",
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
};

const POS_NAV: NavItem = {
  label: "POS",
  icon: Monitor,
  requiredModule: "pos",
  hideForPersonal: true,
  children: [
    { label: "Checkout", href: "/dashboard/pos/checkout" },
    { label: "Sessions", href: "/dashboard/pos/sessions", createHref: "/dashboard/pos/sessions/new" },
    { label: "Transactions", href: "/dashboard/pos/transactions" },
    { label: "Refunds", href: "/dashboard/pos/refunds", createHref: "/dashboard/pos/refunds/new" },
    { label: "Discounts", href: "/dashboard/pos/discounts", createHref: "/dashboard/pos/discounts?new=1" },
    { label: "Daily Reports", href: "/dashboard/pos/reports" },
    { label: "Settings", href: "/dashboard/pos/settings" },
  ],
};

const HR_NAV: NavItem = {
  label: "HR",
  icon: Users,
  requiredModule: "hr",
  children: [
    { label: "Overview", href: "/dashboard/hr", exact: true },
    { label: "Employees", href: "/dashboard/hr/employees", createHref: "/dashboard/hr/employees/new" },
    { label: "Departments", href: "/dashboard/hr/departments", createHref: "/dashboard/hr/departments/new" },
    { label: "Attendance", href: "/dashboard/hr/attendance", createHref: "/dashboard/hr/attendance/mark" },
    { label: "Leave Management", href: "/dashboard/hr/leave", createHref: "/dashboard/hr/leave/requests/new" },
    { label: "Payroll", href: "/dashboard/hr/payroll", createHref: "/dashboard/hr/payroll/new" },
    { label: "HR Reports", href: "/dashboard/hr/reports" },
  ],
};

/** Every construction-specific page, collapsed under one sidebar dropdown. */
const CONSTRUCTION_SUBMENU_NAV: NavItem = {
  label: "Construction",
  icon: HardHat,
  href: "/dashboard/construction",
  requiredModule: "construction",
  children: [
    { label: "Overview", href: "/dashboard/construction", exact: true },
    { label: "Sites", href: "/dashboard/construction/sites", createHref: "/dashboard/construction/sites/new" },
    { label: "Workers", href: "/dashboard/construction/workers", createHref: "/dashboard/construction/workers/new" },
    { label: "Attendance", href: "/dashboard/construction/attendance", createHref: "/dashboard/construction/attendance/mark" },
    { label: "Daily Logs", href: "/dashboard/construction/daily-logs", createHref: "/dashboard/construction/daily-logs/new" },
    { label: "Material Consumption", href: "/dashboard/construction/material-consumption", createHref: "/dashboard/construction/consumption/new" },
    { label: "Equipment", href: "/dashboard/construction/equipment", createHref: "/dashboard/construction/equipment/new" },
    { label: "Equipment Usage", href: "/dashboard/construction/equipment-usage", createHref: "/dashboard/construction/equipment-usage?new=1" },
    { label: "Construction Reports", href: "/dashboard/construction/reports" },
  ],
};

/** Hardware-specific extras not already covered by Sales/Customers/Purchase/Inventory. */
const HARDWARE_EXTRAS_NAV: NavItem = {
  label: "Hardware",
  icon: Wrench,
  requiredModule: "hardware",
  children: [
    { label: "Rate Board", href: "/dashboard/hardware/rates", createHref: "/dashboard/hardware/rates?new=1" },
    { label: "Rentals", href: "/dashboard/hardware/rentals", createHref: "/dashboard/hardware/rentals?new=1" },
    { label: "Deliveries", href: "/dashboard/hardware/deliveries", createHref: "/dashboard/hardware/deliveries?new=1" },
    { label: "Vehicles", href: "/dashboard/hardware/vehicles", createHref: "/dashboard/hardware/vehicles?new=1" },
  ],
};

const REPORTS_NAV: NavItem = {
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
};

const SETTINGS_NAV: NavItem = {
  label: "Settings",
  icon: Settings,
  requiredModule: "settings",
  requiredRoles: ["admin", "manager"],
  hideForPersonal: true,
  children: [
    { label: "Profile", href: "/dashboard/settings/profile", personalOnly: true },
    { label: "Organization Settings", href: "/dashboard/settings/org", hideForPersonal: true },
    { label: "Modules", href: "/dashboard/settings/modules", hideForPersonal: true },
    { label: "Users & Roles", href: "/dashboard/settings/users", createHref: "/dashboard/settings/users/invite", hideForPersonal: true },
    { label: "Help Desk", href: "/dashboard/settings/help" },
    { label: "Audit Logs", href: "/dashboard/settings/audit", hideForPersonal: true },
  ],
};

// =============================================================================
// WORKPLACE-SPECIFIC NAV CONFIGURATIONS
// =============================================================================

// Personal Finance
const PERSONAL_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/finance",
    requiredModule: "personal_finance",
    personalOnly: true,
    pinnedFirst: true,
  },
  {
    label: "Transactions",
    icon: TrendingUp,
    href: "/dashboard/finance/transactions",
    requiredModule: "personal_finance",
    personalOnly: true,
    children: [
      { label: "Transactions", href: "/dashboard/finance/transactions", createHref: "/dashboard/finance/transactions?new=1" },
    ],
  },
  {
    label: "Parties / Lenders",
    icon: Users,
    href: "/dashboard/finance/parties",
    requiredModule: "personal_finance",
    personalOnly: true,
    children: [
      { label: "Add Transaction", href: "/dashboard/finance/parties?action=add-transaction", createHref: "/dashboard/finance/parties?action=add-transaction" },
    ],
  },
  {
    label: "Budget",
    icon: Wallet,
    href: "/dashboard/finance/budget",
    requiredModule: "personal_finance",
    personalOnly: true,
    children: [
      { label: "Budget", href: "/dashboard/finance/budget", createHref: "/dashboard/finance/budget?new=1" },
    ],
  },
  {
    label: "Category",
    icon: Package,
    href: "/dashboard/finance/category",
    requiredModule: "personal_finance",
    personalOnly: true,
    children: [
      { label: "Category", href: "/dashboard/finance/category", createHref: "/dashboard/finance/category?new=1" },
    ],
  },
  {
    label: "Account",
    icon: BookOpen,
    href: "/dashboard/finance/account",
    requiredModule: "personal_finance",
    personalOnly: true,
    children: [
      { label: "Account", href: "/dashboard/finance/account", createHref: "/dashboard/finance/account?new=1" },
    ],
  },
  {
    label: "Bills",
    icon: ShoppingCart,
    href: "/dashboard/finance/bills",
    requiredModule: "personal_finance",
    personalOnly: true,
    children: [
      { label: "Bills", href: "/dashboard/finance/bills", createHref: "/dashboard/finance/bills?new=1" },
    ],
  },
  {
    label: "Tax",
    icon: BarChart2,
    href: "/dashboard/finance/tax",
    requiredModule: "personal_finance",
    personalOnly: true,
  },
  {
    label: "Reports & Analytics",
    icon: BarChart2,
    href: "/dashboard/finance/reports",
    requiredModule: "personal_finance",
    personalOnly: true,
  },
  {
    label: "Activities",
    icon: Activity,
    href: "/dashboard/finance/activities",
    requiredModule: "personal_finance",
    personalOnly: true,
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/finance/settings",
    requiredModule: "personal_finance",
    personalOnly: true,
  },
];

// Retail/Kirana
const RETAIL_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/retail",
    requiredModule: "pos",
    pinnedFirst: true,
  },
  POS_NAV,
  CUSTOMERS_NAV,
  SALES_NAV,
  {
    label: "Inventory",
    icon: Package,
    requiredModule: "inventory",
    children: [
      { label: "Overview", href: "/dashboard/inventory", exact: true },
      { label: "Products", href: "/dashboard/inventory/products", createHref: "/dashboard/inventory/products/new" },
      { label: "Categories", href: "/dashboard/inventory/categories", createHref: "/dashboard/inventory/categories?new=1" },
      { label: "Units of Measure", href: "/dashboard/inventory/uom", createHref: "/dashboard/inventory/uom?new=1" },
      { label: "Stock Adjustment", href: "/dashboard/inventory/adjustment", createHref: "/dashboard/inventory/adjustment?new=1" },
    ],
  },
  {
    label: "Purchases",
    icon: ShoppingCart,
    requiredModule: "purchase",
    children: [
      { label: "Overview", href: "/dashboard/purchase", exact: true },
      { label: "Invoices", href: "/dashboard/purchase/invoices", createHref: "/dashboard/purchase/invoices/new" },
      { label: "Suppliers", href: "/dashboard/purchase/suppliers", createHref: "/dashboard/purchase/suppliers/new" },
    ],
  },
  ACCOUNTING_NAV,
  HR_NAV,
  {
    label: "Reports",
    icon: BarChart2,
    requiredModule: "reports",
    children: [
      { label: "Overview", href: "/dashboard/reports", exact: true },
      { label: "Sales Report", href: "/dashboard/reports/sales" },
      { label: "Inventory Report", href: "/dashboard/reports/inventory" },
    ],
  },
  SETTINGS_NAV,
];

// Construction — every construction-specific page lives under the single
// "Construction" dropdown (CONSTRUCTION_SUBMENU_NAV) instead of each getting
// its own top-level sidebar row, matching how every other module (Sales,
// Purchase, Inventory, ...) already collapses under one entry. A standalone
// "Dashboard" row still leads, matching the pinned Dashboard/Overview link
// every other account type has — the Construction dropdown label doubling
// as a link isn't visually distinct enough on its own to be discoverable.
const CONSTRUCTION_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/construction",
    pinnedFirst: true,
  },
  {
    ...CONSTRUCTION_SUBMENU_NAV,
    pinnedFirst: true,
    // Overview is redundant here — the standalone "Dashboard" row above
    // already covers it; still present in the shared submenu for
    // organization-type tenants, which have no separate Dashboard link.
    children: CONSTRUCTION_SUBMENU_NAV.children?.filter((c) => c.label !== "Overview"),
  },
  INVENTORY_NAV,
  ACCOUNTING_NAV,
  // Optional business-ops modules — off by default for a construction
  // workplace, but a construction company that also sells materials directly,
  // runs its own hardware line, or wants HR/payroll can enable them from
  // Settings → Modules; each needs its own sidebar entry here to actually
  // show up once enabled (see getModuleCatalogSections's construction case).
  SALES_NAV,
  PURCHASE_NAV,
  CUSTOMERS_NAV,
  POS_NAV,
  HR_NAV,
  HARDWARE_EXTRAS_NAV,
  REPORTS_NAV,
  SETTINGS_NAV,
];

// Hardware
const HARDWARE_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/hardware",
    requiredModule: "hardware",
    pinnedFirst: true,
  },
  POS_NAV,
  CUSTOMERS_NAV,
  SALES_NAV,
  PURCHASE_NAV,
  INVENTORY_NAV,
  ACCOUNTING_NAV,
  HR_NAV,
  HARDWARE_EXTRAS_NAV,
  REPORTS_NAV,
  SETTINGS_NAV,
];

// Organization (Default)
const ORGANIZATION_NAV_ITEMS: NavItem[] = [
  DASHBOARD_NAV,
  CUSTOMERS_NAV,
  SALES_NAV,
  PURCHASE_NAV,
  INVENTORY_NAV,
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
      { label: "Rate Board", href: "/dashboard/hardware/rates", createHref: "/dashboard/hardware/rates?new=1" },
      { label: "Rentals", href: "/dashboard/hardware/rentals", createHref: "/dashboard/hardware/rentals?new=1" },
      { label: "Deliveries", href: "/dashboard/hardware/deliveries", createHref: "/dashboard/hardware/deliveries?new=1" },
      { label: "Vehicles", href: "/dashboard/hardware/vehicles", createHref: "/dashboard/hardware/vehicles?new=1" },
      { label: "Aging Report", href: "/dashboard/hardware/aging" },
      { label: "Bulk Pricing", href: "/dashboard/hardware/bulk-pricing", createHref: "/dashboard/hardware/bulk-pricing/new" },
      { label: "Reports", href: "/dashboard/hardware/reports" },
    ],
  },
  CONSTRUCTION_SUBMENU_NAV,
  ACCOUNTING_NAV,
  POS_NAV,
  HR_NAV,
  REPORTS_NAV,
  SETTINGS_NAV,
];

// =============================================================================
// MAIN EXPORT (for backward compatibility)
// =============================================================================

export const dashboardNavItems: NavItem[] = ORGANIZATION_NAV_ITEMS;

// =============================================================================
// FILTER FUNCTION
// =============================================================================

export function filterDashboardNavItems(
  items: NavItem[],
  opts: {
    canView: (module: string) => boolean;
    role?: string | null;
    accountType?: string | null;
    businessType?: string | null;
    /** Sub-feature hrefs turned off from Settings → Modules (Tenant.disabled_features). */
    disabledFeatures?: string[] | null;
    /** Per-module drag-and-drop order of sub-feature hrefs, keyed by module id. */
    featureOrder?: Record<string, string[]> | null;
  }
): NavItem[] {
  const isPersonal = opts.accountType === "personal";
  const isConstruction = opts.accountType === "construction";
  const isHardware = opts.accountType === "hardware";
  // account_type is the authoritative field (set for every tenant created
  // through the workplace wizard); business_type is checked too only for
  // older tenants predating account_type, whose business_type may already
  // be "kirana"/"retail" while account_type still defaults to "organization".
  const isKirana =
    opts.accountType === "retail" ||
    opts.businessType === "kirana" ||
    opts.businessType === "retail";

  // Select navigation based on workplace type
  let navItems: NavItem[];
  
  if (isPersonal) {
    navItems = PERSONAL_NAV_ITEMS;
  } else if (isKirana) {
    navItems = RETAIL_NAV_ITEMS;
  } else if (isConstruction) {
    navItems = CONSTRUCTION_NAV_ITEMS;
  } else if (isHardware) {
    navItems = HARDWARE_NAV_ITEMS;
  } else {
    navItems = ORGANIZATION_NAV_ITEMS;
  }

  const disabledFeatures = opts.disabledFeatures ?? [];
  const featureOrder = opts.featureOrder ?? {};

  const filterChildren = (children: NavSubItem[] | undefined, moduleId?: string) => {
    const visible = children?.filter((child) => {
      if (child.hideForPersonal && isPersonal) return false;
      if (child.personalOnly && !isPersonal) return false;
      if (disabledFeatures.includes(child.href)) return false;
      return true;
    });
    if (!visible) return visible;

    const order = moduleId ? featureOrder[moduleId] : undefined;
    if (!order?.length) return visible;

    return [...visible].sort((a, b) => {
      const indexA = order.indexOf(a.href);
      const indexB = order.indexOf(b.href);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });
  };

  return navItems
    .filter((item) => {
      if (item.personalOnly && !isPersonal) return false;
      if (item.hideForPersonal && isPersonal) return false;
      if (item.requiredModule && !opts.canView(item.requiredModule)) return false;

      if (item.requiredRoles && opts.role) {
        if (opts.role === "admin" || opts.role === "super_admin") return true;
        if (!item.requiredRoles.includes(opts.role)) return false;
      }

      return true;
    })
    .map((item) =>
      item.children
        ? { ...item, children: filterChildren(item.children, item.requiredModule) }
        : item
    )
    .filter((item) => !item.children || item.children.length > 0);
}

// =============================================================================
// CUSTOM SIDEBAR ORDER (drag-and-drop from Settings → Modules)
// =============================================================================

/** localStorage key holding the user's drag-and-drop module order (array of module ids). */
export const SIDEBAR_MODULE_ORDER_KEY = "khata-sidebar-module-order";
/** localStorage key holding per-module drag-and-drop feature order: `{ [moduleId]: hrefs[] }`. */
export const SIDEBAR_FEATURE_ORDER_KEY = "khata-sidebar-feature-order";
/** Fired on the saving tab so the always-mounted sidebar re-reads localStorage immediately. */
export const SIDEBAR_ORDER_CHANGED_EVENT = "khata-sidebar-order-changed";
/** localStorage key holding module ids whose sidebar menu stays permanently expanded (no accordion), set per-module from Settings → Modules. */
export const SIDEBAR_ALWAYS_EXPANDED_MODULES_KEY = "khata-sidebar-always-expanded-modules";

/**
 * Sidebar layout prefs (order, feature order, always-expanded) are per-workplace,
 * but localStorage is shared across the whole browser origin — so every
 * `SIDEBAR_*_KEY` above must be scoped by tenant slug, or switching workplaces
 * bleeds one tenant's sidebar customization into every other tenant.
 */
export function scopedSidebarKey(baseKey: string, tenantSlug: string | null | undefined): string {
  return tenantSlug ? `${baseKey}:${tenantSlug}` : baseKey;
}

/**
 * Reorders top-level nav items to match a saved module order, keyed by
 * `requiredModule` (which matches ORG_MODULE_CATALOG ids). Items with no
 * `requiredModule`, or not present in `order`, keep their existing relative
 * order (stable sort) rather than jumping to the front or back.
 */
export function sortNavItemsByModuleOrder(items: NavItem[], order: string[]): NavItem[] {
  const pinned = items.filter((item) => item.pinnedFirst);
  const rest = items.filter((item) => !item.pinnedFirst);

  if (!order.length) return [...pinned, ...rest];

  const sortedRest = [...rest].sort((a, b) => {
    const indexA = a.requiredModule ? order.indexOf(a.requiredModule) : -1;
    const indexB = b.requiredModule ? order.indexOf(b.requiredModule) : -1;
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });

  return [...pinned, ...sortedRest];
}

// =============================================================================
// PER-MODULE FEATURES (Settings → Modules feature enable/disable dropdown)
// =============================================================================

/**
 * The sidebar sub-items (children) that belong to a given ORG_MODULE_CATALOG
 * module id, sourced directly from the real organization sidebar definition
 * so "features" shown in Settings → Modules always match actual sidebar
 * entries one-to-one — no separate feature catalog to keep in sync.
 */
export function getOrganizationModuleFeatures(moduleId: string): NavSubItem[] {
  return ORGANIZATION_NAV_ITEMS
    .filter((item) => item.requiredModule === moduleId)
    .flatMap((item) => item.children ?? []);
}

/**
 * Resolves an ORG_MODULE_CATALOG module id to its dashboard landing route,
 * sourced from the organization sidebar definition (which covers every
 * catalog module) so dashboard "explore modules" links stay in sync with
 * the real sidebar routes without a second hardcoded route table.
 */
export function getModulePrimaryHref(moduleId: string): string | undefined {
  if (moduleId === "dashboard") return "/dashboard";
  const item = ORGANIZATION_NAV_ITEMS.find((navItem) => navItem.requiredModule === moduleId);
  return item?.href ?? item?.children?.[0]?.href;
}

/** Applies a saved per-module feature order (see SIDEBAR_FEATURE_ORDER_KEY) to a features list. */
export function sortFeaturesByOrder(features: NavSubItem[], order: string[] | undefined): NavSubItem[] {
  if (!order?.length) return features;
  return [...features].sort((a, b) => {
    const indexA = order.indexOf(a.href);
    const indexB = order.indexOf(b.href);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });
}
