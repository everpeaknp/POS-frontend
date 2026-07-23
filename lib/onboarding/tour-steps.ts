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
  /** If true, skip this step when no selector matches (e.g. empty org strip) */
  optional?: boolean;
};

export type NavbarPosition = "left" | "top";

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

/** App bar (vertical left rail) — before module sidebar */
function introForLeftNavbar(): TourStep[] {
  return [
    {
      id: "app_icon_rail",
      route: "/dashboard",
      selectors: ['[data-tour="app-icon-rail"][data-position="left"]'],
      title: "App icon rail",
      body: "This vertical strip holds quick access — ERP home, your organizations, notifications, theme, and account.",
      placement: "right",
    },
    {
      id: "app_icon_rail_orgs",
      route: "/dashboard",
      selectors: [
        '[data-tour="app-icon-rail"][data-position="left"] [data-tour="app-icon-rail-orgs"]',
      ],
      title: "Organizations",
      body: "Jump between workspaces from here when you belong to more than one organization.",
      placement: "right",
      optional: true,
    },
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
      body: "Your active workspace and role are shown here.",
      placement: "right",
    },
  ];
}

/** App bar (horizontal top bar) — before module sidebar */
function introForTopNavbar(): TourStep[] {
  return [
    {
      id: "app_icon_rail",
      route: "/dashboard",
      selectors: ['[data-tour="app-icon-rail"][data-position="top"]'],
      title: "Top app bar",
      body: "This horizontal bar shows the page title, notifications, theme, and your account — always at the top.",
      placement: "bottom",
    },
    {
      id: "app_icon_rail_orgs",
      route: "/dashboard",
      selectors: [
        '[data-tour="app-icon-rail"][data-position="top"] [data-tour="app-icon-rail-orgs"]',
      ],
      title: "Organizations",
      body: "Jump between workspaces from the top bar when you belong to more than one organization.",
      placement: "bottom",
      optional: true,
    },
    {
      id: "sidebar",
      route: "/dashboard",
      selectors: ['[data-tour="sidebar"]'],
      title: "Main sidebar",
      body: "Modules still live in this left menu. Expand a section to open its pages.",
      placement: "right",
    },
    {
      id: "sidebar_org",
      route: "/dashboard",
      selectors: ['[data-tour="sidebar-org"]'],
      title: "Your organization",
      body: "Your active workspace and role are shown here.",
      placement: "right",
    },
  ];
}

/** Notifications / theme / account — placement depends on left vs top app bar */
function outroForNavbar(position: NavbarPosition): TourStep[] {
  const railPlacement = position === "top" ? "bottom" : "right";

  return [
    {
      id: "topbar_notifications",
      route: "/dashboard",
      selectors: [
        '[data-tour="app-icon-rail"] [data-tour="topbar-notifications"]',
        '[data-tour="topbar-notifications"]',
      ],
      title: "Notifications",
      body: "Alerts and updates appear here — unpaid invoices, low stock, and other important events.",
      placement: railPlacement,
    },
    {
      id: "topbar_theme",
      route: "/dashboard",
      selectors: [
        '[data-tour="app-icon-rail"] [data-tour="topbar-theme"]',
        '[data-tour="topbar-theme"]',
      ],
      title: "Theme",
      body: "Switch between light and dark mode anytime from here.",
      placement: railPlacement,
    },
    {
      id: "topbar_user",
      route: "/dashboard",
      selectors: [
        '[data-tour="app-icon-rail"] [data-tour="topbar-user"]',
        '[data-tour="topbar-user"]',
      ],
      title: "Account menu",
      body: "Open your profile or sign out from this menu.",
      placement: railPlacement,
    },
  ];
}

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
 * Build tour steps for the modules this user can see, adapted to left or top app bar.
 */
export function buildProductTourSteps(opts: {
  canView: (moduleId: string) => boolean;
  role?: string | null;
  navbarPosition?: NavbarPosition;
}): TourStep[] {
  const position: NavbarPosition = opts.navbarPosition === "top" ? "top" : "left";

  const intro =
    position === "top" ? introForTopNavbar() : introForLeftNavbar();

  const moduleSteps = MODULE_TOUR_DEFS.filter((def) =>
    isModuleNavVisible(def, opts.canView, opts.role)
  ).map(moduleToStep);

  return [...intro, ...moduleSteps, ...outroForNavbar(position)];
}

/** @deprecated Prefer buildProductTourSteps — kept for docs/tests */
export const ADMIN_TOUR_STEPS: TourStep[] = buildProductTourSteps({
  canView: () => true,
  role: "admin",
  navbarPosition: "left",
});
