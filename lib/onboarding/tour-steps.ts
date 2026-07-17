export type TourStep = {
  id: string;
  route: string;
  /** CSS selectors tried in order until one matches a visible element */
  selectors: string[];
  title: string;
  body: string;
  /** Optional: click a sidebar parent label before highlighting */
  expandNav?: string;
  placement?: "top" | "bottom" | "left" | "right" | "auto";
};

type ModuleTourDef = {
  /** Tenant module id; null = always shown (Dashboard) */
  moduleId: string | null;
  /** Must match sidebar `label` (drives data-tour + expandNav) */
  label: string;
  title: string;
  body: string;
  requiredRoles?: string[];
};

/**
 * One tour beat per sidebar module — filtered at runtime by active modules + role
 * (same rules as `sidebar.tsx`).
 */
const MODULE_TOUR_DEFS: ModuleTourDef[] = [
  {
    moduleId: null,
    label: "Dashboard",
    title: "Dashboard",
    body: "Open the home overview anytime — KPIs and module snapshots for your business.",
  },
  {
    moduleId: "sales",
    label: "Sales",
    title: "Sales",
    body: "Customers, quotations, orders, invoices, and payments live under Sales. Click to expand the submenu.",
  },
  {
    moduleId: "purchase",
    label: "Purchase",
    title: "Purchase",
    body: "Suppliers, purchase requests, orders, invoices, and debit notes are under Purchase.",
  },
  {
    moduleId: "inventory",
    label: "Inventory",
    title: "Inventory",
    body: "Products, warehouses, stock in/out, transfers, and inventory reports are here.",
  },
  {
    moduleId: "hardware",
    label: "Hardware",
    title: "Hardware",
    body: "Hardware-specific products, customers, orders, credit, and aging reports.",
  },
  {
    moduleId: "construction",
    label: "Construction",
    title: "Construction",
    body: "Sites, workers, attendance, daily logs, materials, and equipment for construction jobs.",
  },
  {
    moduleId: "accounting",
    label: "Accounting",
    title: "Accounting",
    body: "Chart of accounts, journals, P&L, balance sheet, tax, and bank tools are under Accounting.",
    requiredRoles: ["admin", "accountant", "manager"],
  },
  {
    moduleId: "pos",
    label: "POS",
    title: "Point of Sale",
    body: "Billing, sessions, transactions, discounts, and daily POS reports.",
  },
  {
    moduleId: "hr",
    label: "HR",
    title: "HR & Payroll",
    body: "Employees, departments, attendance, leave, and payroll live under HR.",
    requiredRoles: ["admin", "manager"],
  },
  {
    moduleId: "reports",
    label: "Reports",
    title: "Reports",
    body: "Cross-module analytics — sales, purchase, inventory, financial, tax, and custom reports.",
  },
  {
    moduleId: "settings",
    label: "Settings",
    title: "Settings",
    body: "Organization profile, modules, users, Help Desk, and audit logs are under Settings.",
    requiredRoles: ["admin", "manager"],
  },
];

const TOUR_INTRO: TourStep[] = [
  {
    id: "sidebar",
    route: "/dashboard",
    selectors: ['[data-tour="sidebar"]'],
    title: "Main sidebar",
    body: "This is your main menu. Every module you enabled appears here so you can move around Khata.",
    placement: "right",
  },
  {
    id: "sidebar_org",
    route: "/dashboard",
    selectors: ['[data-tour="sidebar-org"]'],
    title: "Your organization",
    body: "Your active workspace and role are shown here. Switch organizations from the user menu when you have more than one.",
    placement: "right",
  },
];

const TOUR_OUTRO: TourStep[] = [
  {
    id: "topbar_notifications",
    route: "/dashboard",
    selectors: ['[data-tour="topbar-notifications"]'],
    title: "Notifications",
    body: "Alerts and updates appear here — unpaid invoices, low stock, and other important events.",
    placement: "left",
  },
  {
    id: "topbar_user",
    route: "/dashboard",
    selectors: ['[data-tour="topbar-user"]'],
    title: "Account menu",
    body: "Open your profile, switch organization, or sign out from this menu.",
    placement: "left",
  },
];

function navKey(label: string): string {
  return label.toLowerCase();
}

function moduleToStep(def: ModuleTourDef): TourStep {
  const key = navKey(def.label);
  const isLeaf = def.moduleId === null; // Dashboard is a direct link
  return {
    id: `nav_${key}`,
    route: "/dashboard",
    selectors: isLeaf
      ? [`[data-tour="nav-${key}"]`]
      : [`[data-tour="nav-${key}-toggle"]`, `[data-tour="nav-${key}"]`],
    title: def.title,
    body: def.body,
    expandNav: isLeaf ? undefined : def.label,
    placement: "right",
  };
}

function isModuleNavVisible(
  def: ModuleTourDef,
  canView: (moduleId: string) => boolean,
  role?: string | null
): boolean {
  if (!def.moduleId) return true;
  if (!canView(def.moduleId)) return false;

  if (def.requiredRoles) {
    if (role === "admin" || role === "super_admin") return true;
    if (!role || !def.requiredRoles.includes(role)) return false;
  }
  return true;
}

/**
 * Build tour steps for the modules this user can actually see in the sidebar.
 */
export function buildProductTourSteps(opts: {
  canView: (moduleId: string) => boolean;
  role?: string | null;
}): TourStep[] {
  const moduleSteps = MODULE_TOUR_DEFS.filter((def) =>
    isModuleNavVisible(def, opts.canView, opts.role)
  ).map(moduleToStep);

  return [...TOUR_INTRO, ...moduleSteps, ...TOUR_OUTRO];
}

/** @deprecated Prefer buildProductTourSteps — kept for docs/tests */
export const ADMIN_TOUR_STEPS: TourStep[] = buildProductTourSteps({
  canView: () => true,
  role: "admin",
});
