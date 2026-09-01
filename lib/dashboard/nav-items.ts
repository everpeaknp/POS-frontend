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
  Building2,
  ClipboardCheck,
  FileText,
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
    label: "Overview",
    icon: LayoutDashboard,
    href: "/dashboard/personal-finance",
    requiredModule: "personal_finance",
    personalOnly: true,
  },
  {
    label: "Transactions",
    icon: TrendingUp,
    href: "/dashboard/personal-finance/transactions",
    requiredModule: "personal_finance",
    personalOnly: true,
    children: [
      { label: "Transactions", href: "/dashboard/personal-finance/transactions", createHref: "/dashboard/personal-finance/transactions?new=1" },
    ],
  },
  {
    label: "Parties / Lenders",
    icon: Users,
    href: "/dashboard/personal-finance/parties",
    requiredModule: "personal_finance",
    personalOnly: true,
    children: [
      { label: "Add Transaction", href: "/dashboard/personal-finance/parties?action=add-transaction", createHref: "/dashboard/personal-finance/parties?action=add-transaction" },
    ],
  },
  {
    label: "Budget",
    icon: Wallet,
    href: "/dashboard/personal-finance/budget",
    requiredModule: "personal_finance",
    personalOnly: true,
    children: [
      { label: "Budget", href: "/dashboard/personal-finance/budget", createHref: "/dashboard/personal-finance/budget?new=1" },
    ],
  },
  {
    label: "Category",
    icon: Package,
    href: "/dashboard/personal-finance/category",
    requiredModule: "personal_finance",
    personalOnly: true,
    children: [
      { label: "Category", href: "/dashboard/personal-finance/category", createHref: "/dashboard/personal-finance/category?new=1" },
    ],
  },
  {
    label: "Account",
    icon: BookOpen,
    href: "/dashboard/personal-finance/account",
    requiredModule: "personal_finance",
    personalOnly: true,
    children: [
      { label: "Account", href: "/dashboard/personal-finance/account", createHref: "/dashboard/personal-finance/account?new=1" },
    ],
  },
  {
    label: "Bills",
    icon: ShoppingCart,
    href: "/dashboard/personal-finance/bills",
    requiredModule: "personal_finance",
    personalOnly: true,
    children: [
      { label: "Bills", href: "/dashboard/personal-finance/bills", createHref: "/dashboard/personal-finance/bills?new=1" },
    ],
  },
  {
    label: "Tax",
    icon: BarChart2,
    href: "/dashboard/personal-finance/tax",
    requiredModule: "personal_finance",
    personalOnly: true,
  },
  {
    label: "Reports & Analytics",
    icon: BarChart2,
    href: "/dashboard/personal-finance/reports",
    requiredModule: "personal_finance",
    personalOnly: true,
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/personal-finance/settings",
    requiredModule: "personal_finance",
    personalOnly: true,
  },
];

// Retail/Kirana
const RETAIL_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/kirana",
    requiredModule: "pos",
  },
  POS_NAV,
  CUSTOMERS_NAV,
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

// Construction
const CONSTRUCTION_NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/dashboard/construction",
    requiredModule: "construction",
  },
  {
    label: "Sites",
    icon: Building2,
    href: "/dashboard/construction/sites",
    requiredModule: "construction",
    children: [
      { label: "Sites", href: "/dashboard/construction/sites", createHref: "/dashboard/construction/sites/new" },
    ],
  },
  INVENTORY_NAV,
  {
    label: "Material Consumption",
    icon: Package,
    href: "/dashboard/construction/material-consumption",
    requiredModule: "construction",
    children: [
      { label: "Material Consumption", href: "/dashboard/construction/material-consumption", createHref: "/dashboard/construction/consumption/new" },
    ],
  },
  {
    label: "Daily Logs",
    icon: FileText,
    href: "/dashboard/construction/daily-logs",
    requiredModule: "construction",
    children: [
      { label: "Daily Logs", href: "/dashboard/construction/daily-logs", createHref: "/dashboard/construction/daily-logs/new" },
    ],
  },
  {
    label: "Equipment",
    icon: Wrench,
    href: "/dashboard/construction/equipment",
    requiredModule: "construction",
    children: [
      { label: "Equipment", href: "/dashboard/construction/equipment", createHref: "/dashboard/construction/equipment/new" },
    ],
  },
  {
    label: "Equipment Usage",
    icon: BarChart2,
    href: "/dashboard/construction/equipment-usage",
    requiredModule: "construction",
    children: [
      { label: "Equipment Usage", href: "/dashboard/construction/equipment-usage", createHref: "/dashboard/construction/equipment-usage?new=1" },
    ],
  },
  {
    label: "Workers",
    icon: HardHat,
    href: "/dashboard/construction/workers",
    requiredModule: "construction",
    children: [
      { label: "Workers", href: "/dashboard/construction/workers", createHref: "/dashboard/construction/workers/new" },
    ],
  },
  {
    label: "Attendance",
    icon: ClipboardCheck,
    href: "/dashboard/construction/attendance",
    requiredModule: "construction",
    children: [
      { label: "Attendance", href: "/dashboard/construction/attendance", createHref: "/dashboard/construction/attendance/mark" },
    ],
  },
  {
    label: "Reports",
    icon: BarChart2,
    href: "/dashboard/construction/reports",
    requiredModule: "construction",
  },
  SETTINGS_NAV,
];

// Hardware
const HARDWARE_NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/dashboard/hardware",
    requiredModule: "hardware",
  },
  POS_NAV,
  CUSTOMERS_NAV,
  SALES_NAV,
  PURCHASE_NAV,
  INVENTORY_NAV,
  {
    label: "Hardware Features",
    icon: Wrench,
    requiredModule: "hardware",
    children: [
      { label: "Deliveries", href: "/dashboard/hardware/deliveries", createHref: "/dashboard/hardware/deliveries/new" },
      { label: "Vehicles", href: "/dashboard/hardware/vehicles", createHref: "/dashboard/hardware/vehicles/new" },
    ],
  },
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
      { label: "Equipment Usage", href: "/dashboard/construction/equipment-usage", createHref: "/dashboard/construction/equipment-usage?new=1" },
      { label: "Construction Reports", href: "/dashboard/construction/reports" },
    ],
  },
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
  }
): NavItem[] {
  const isPersonal = opts.accountType === "personal";
  const isConstruction = opts.accountType === "construction";
  const isHardware = opts.accountType === "hardware";
  const isKirana = opts.businessType === "kirana" || opts.businessType === "retail";

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

  const filterChildren = (children?: NavSubItem[]) =>
    children?.filter((child) => {
      if (child.hideForPersonal && isPersonal) return false;
      if (child.personalOnly && !isPersonal) return false;
      return true;
    });

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
      item.children ? { ...item, children: filterChildren(item.children) } : item
    )
    .filter((item) => !item.children || item.children.length > 0);
}
