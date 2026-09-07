import { getHomeRoute } from "@/lib/onboarding/home-route";
import {
  dashboardNavItems,
  filterDashboardNavItems,
  sortNavItemsByModuleOrder,
  type NavItem,
} from "@/lib/dashboard/nav-items";

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

/**
 * Friendly title/body copy for each sidebar item, keyed by lowercased label.
 * Deliberately separate from the sidebar's own nav definitions (`nav-items.ts`)
 * so the ORDER and SET of tour steps always comes straight from whatever the
 * sidebar actually renders (per account type, role, and the user's own
 * drag-and-drop order) — this table only supplies the copy, never gates
 * which steps exist. Any real sidebar label missing here still gets a
 * step, just with a generic body (see `navItemToStep`).
 */
const NAV_STEP_COPY: Record<string, { title: string; body: string }> = {
  dashboard: {
    title: "Dashboard",
    body: "Open the home overview anytime — KPIs and module snapshots for your business.",
  },
  overview: {
    title: "Overview",
    body: "Your workspace's home screen — key numbers and quick actions at a glance.",
  },
  sales: {
    title: "Sales",
    body: "Customers, quotations, orders, invoices, and payments live under Sales. Click to expand the submenu.",
  },
  customers: {
    title: "Customers",
    body: "Manage customer contacts, credit, and purchase history.",
  },
  purchase: {
    title: "Purchase",
    body: "Suppliers, purchase requests, orders, invoices, and debit notes are under Purchase.",
  },
  purchases: {
    title: "Purchases",
    body: "Suppliers, purchase invoices, and procurement live here.",
  },
  inventory: {
    title: "Inventory",
    body: "Products, warehouses, stock in/out, transfers, and inventory reports are here.",
  },
  hardware: {
    title: "Hardware",
    body: "Hardware-specific products, customers, orders, credit, and aging reports.",
  },
  construction: {
    title: "Construction",
    body: "Sites, workers, attendance, daily logs, materials, and equipment for construction jobs.",
  },
  accounting: {
    title: "Accounting",
    body: "Chart of accounts, journals, P&L, balance sheet, tax, and bank tools are under Accounting.",
  },
  pos: {
    title: "Point of Sale",
    body: "Billing, sessions, transactions, discounts, and daily POS reports.",
  },
  hr: {
    title: "HR & Payroll",
    body: "Employees, departments, attendance, leave, and payroll live under HR.",
  },
  reports: {
    title: "Reports",
    body: "Cross-module analytics — sales, purchase, inventory, financial, tax, and custom reports.",
  },
  "reports & analytics": {
    title: "Reports & Analytics",
    body: "Spending trends, budgets vs actuals, and category breakdowns for your personal finances.",
  },
  settings: {
    title: "Settings",
    body: "Organization profile, modules, users, Help Desk, and audit logs are under Settings.",
  },
  "personal finance": {
    title: "Personal Finance",
    body: "Track your income, expenses, budgets, and bills here — this is your home for Khata.",
  },
  transactions: {
    title: "Transactions",
    body: "Record and review your income and expense transactions.",
  },
  "parties / lenders": {
    title: "Parties & Lenders",
    body: "Track money you owe or are owed, and log transactions against each party.",
  },
  budget: {
    title: "Budget",
    body: "Set spending limits per category and track progress against them.",
  },
  category: {
    title: "Category",
    body: "Organize transactions into custom categories.",
  },
  account: {
    title: "Account",
    body: "Manage your bank, cash, and wallet accounts.",
  },
  bills: {
    title: "Bills",
    body: "Track upcoming and recurring bills so nothing slips through.",
  },
  tax: {
    title: "Tax",
    body: "Estimate and track tax obligations.",
  },
  sites: {
    title: "Sites",
    body: "Manage construction sites and track their progress.",
  },
  "material consumption": {
    title: "Material Consumption",
    body: "Log materials used on each site.",
  },
  "daily logs": {
    title: "Daily Logs",
    body: "Record daily site activity and progress notes.",
  },
  equipment: {
    title: "Equipment",
    body: "Track equipment assigned to your sites.",
  },
  "equipment usage": {
    title: "Equipment Usage",
    body: "Log equipment usage hours per site.",
  },
  workers: {
    title: "Workers",
    body: "Manage your construction workforce.",
  },
  attendance: {
    title: "Attendance",
    body: "Mark and review worker attendance.",
  },
};

/** App bar (vertical left rail) — before module sidebar */
function introForLeftNavbar(homeRoute: string): TourStep[] {
  return [
    {
      id: "app_icon_rail",
      route: homeRoute,
      selectors: ['[data-tour="app-icon-rail"][data-position="left"]'],
      title: "App icon rail",
      body: "This vertical strip holds quick access — ERP home, your organizations, notifications, theme, and account.",
      placement: "right",
    },
    {
      id: "app_icon_rail_orgs",
      route: homeRoute,
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
      route: homeRoute,
      selectors: ['[data-tour="sidebar"]'],
      title: "Main sidebar",
      body: "This is your main menu. Every module you enabled appears here so you can move around Khata.",
      placement: "right",
    },
    {
      id: "sidebar_org",
      route: homeRoute,
      selectors: ['[data-tour="sidebar-org"]'],
      title: "Your organization",
      body: "Your active workspace and role are shown here.",
      placement: "right",
    },
  ];
}

/** App bar (horizontal top bar) — before module sidebar */
function introForTopNavbar(homeRoute: string): TourStep[] {
  return [
    {
      id: "app_icon_rail",
      route: homeRoute,
      selectors: ['[data-tour="app-icon-rail"][data-position="top"]'],
      title: "Top app bar",
      body: "This horizontal bar shows the page title, notifications, theme, and your account — always at the top.",
      placement: "bottom",
    },
    {
      id: "app_icon_rail_orgs",
      route: homeRoute,
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
      route: homeRoute,
      selectors: ['[data-tour="sidebar"]'],
      title: "Main sidebar",
      body: "Modules still live in this left menu. Expand a section to open its pages.",
      placement: "right",
    },
    {
      id: "sidebar_org",
      route: homeRoute,
      selectors: ['[data-tour="sidebar-org"]'],
      title: "Your organization",
      body: "Your active workspace and role are shown here.",
      placement: "right",
    },
  ];
}

/**
 * Notifications / theme / account — order mirrors AppIconRail's actual
 * left-to-right (horizontal) / top-to-bottom (vertical) render order:
 * notifications, then theme, then account.
 */
function outroForNavbar(position: NavbarPosition, homeRoute: string): TourStep[] {
  const railPlacement = position === "top" ? "bottom" : "right";

  return [
    {
      id: "topbar_notifications",
      route: homeRoute,
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
      route: homeRoute,
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
      route: homeRoute,
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

/** Builds one tour step per real, currently-visible top-level sidebar item. */
function navItemToStep(item: NavItem, homeRoute: string): TourStep {
  const key = navKey(item.label);
  const isLeaf = !item.children || item.children.length === 0;
  const copy = NAV_STEP_COPY[key] ?? {
    title: item.label,
    body: `Open ${item.label} from the sidebar.`,
  };

  return {
    id: `nav_${key}`,
    route: homeRoute,
    selectors: isLeaf
      ? [`[data-tour="nav-${key}"]`]
      : [`[data-tour="nav-${key}-toggle"]`, `[data-tour="nav-${key}"]`],
    title: copy.title,
    body: copy.body,
    expandNav: isLeaf ? undefined : item.label,
    placement: "right",
  };
}

/**
 * Build tour steps for the modules this user can see, adapted to left or top
 * app bar. The sidebar section always mirrors the ACTUAL sidebar: same
 * account-type nav list, same role/module filtering, and the same
 * drag-and-drop `moduleOrder` the sidebar itself applies — so the tour walks
 * top-to-bottom in whatever order the sidebar is really rendered in, never a
 * separately hand-maintained order that can drift from it.
 */
export function buildProductTourSteps(opts: {
  canView: (moduleId: string) => boolean;
  role?: string | null;
  navbarPosition?: NavbarPosition;
  accountType?: string | null;
  businessType?: string | null;
  disabledFeatures?: string[] | null;
  /** Same as the sidebar's saved drag-and-drop module order (SIDEBAR_MODULE_ORDER_KEY). */
  moduleOrder?: string[] | null;
}): TourStep[] {
  const position: NavbarPosition = opts.navbarPosition === "top" ? "top" : "left";
  const homeRoute = getHomeRoute({
    account_type: opts.accountType ?? null,
    business_type: opts.businessType ?? null,
  });

  const intro =
    position === "top" ? introForTopNavbar(homeRoute) : introForLeftNavbar(homeRoute);

  const visibleNavItems = filterDashboardNavItems(dashboardNavItems, {
    canView: opts.canView,
    role: opts.role,
    accountType: opts.accountType,
    businessType: opts.businessType,
    disabledFeatures: opts.disabledFeatures,
  });
  const orderedNavItems = sortNavItemsByModuleOrder(visibleNavItems, opts.moduleOrder ?? []);
  const moduleSteps = orderedNavItems.map((item) => navItemToStep(item, homeRoute));

  return [...intro, ...moduleSteps, ...outroForNavbar(position, homeRoute)];
}

/** @deprecated Prefer buildProductTourSteps — kept for docs/tests */
export const ADMIN_TOUR_STEPS: TourStep[] = buildProductTourSteps({
  canView: () => true,
  role: "admin",
  navbarPosition: "left",
});
