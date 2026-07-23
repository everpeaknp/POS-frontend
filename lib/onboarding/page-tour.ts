import type { TourStep } from "@/lib/onboarding/tour-steps";

const TITLE_CASE: Record<string, string> = {
  pos: "POS",
  hr: "HR",
  uom: "UOM",
  "chart-of-accounts": "Chart of Accounts",
  "tax-management": "Tax Management",
  "fiscal-year": "Fiscal Year",
  "bank-accounts": "Bank Accounts",
  "bulk-pricing": "Bulk Pricing",
  "credit-notes": "Credit Notes",
  "debit-notes": "Debit Notes",
  "daily-logs": "Daily Logs",
  "material-consumption": "Material Consumption",
  "equipment-usage": "Equipment Usage",
  "profit-loss": "Profit & Loss",
  "balance-sheet": "Balance Sheet",
  "help-desk": "Help Desk",
};

function titleCaseSegment(segment: string): string {
  if (TITLE_CASE[segment]) return TITLE_CASE[segment];
  if (/^\d+$/.test(segment) || segment.length > 20) return "Details";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Human label from `/dashboard/sales/customers` → `Sales › Customers` */
export function humanizeDashboardPath(pathname: string): string {
  const clean = pathname.split("?")[0].replace(/\/+$/, "") || "/dashboard";
  if (clean === "/dashboard") return "Dashboard";

  const parts = clean.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  if (parts.length === 0) return "Dashboard";

  return parts.map(titleCaseSegment).join(" › ");
}

function pageStep(
  partial: Omit<TourStep, "route"> & { route?: string },
  pathname: string
): TourStep {
  return {
    ...partial,
    route: partial.route ?? pathname,
  };
}

/** Home dashboard — curated beats only */
function homeDashboardSteps(pathname: string): TourStep[] {
  return [
    pageStep(
      {
        id: "page_title",
        selectors: [
          '[data-page-tour="title"]',
          '[data-tour="topbar-title"]',
        ],
        title: "Dashboard",
        body: "This is your organization home — KPIs and module snapshots for the period you select.",
        placement: "bottom",
      },
      pathname
    ),
    pageStep(
      {
        id: "page_period",
        selectors: ['[data-page-tour="period"]'],
        title: "Time period",
        body: "Switch between today, week, month, or year to refresh the overview numbers.",
        placement: "bottom",
        optional: true,
      },
      pathname
    ),
    pageStep(
      {
        id: "page_modules",
        selectors: ['[data-page-tour="module-grid"]'],
        title: "Module overview",
        body: "Each card summarizes an enabled module. Click a card to open that module.",
        placement: "bottom",
        optional: true,
      },
      pathname
    ),
  ];
}

/**
 * Short, intentional tour for the open page.
 * Only explicit page-tour anchors + title/body — no loose DOM fishing
 * (search inputs, comboboxes, /new links, tables) that walked the page randomly.
 */
export function buildPageTourSteps(pathname: string): TourStep[] {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/dashboard";
  if (!path.startsWith("/dashboard")) return [];

  if (path === "/dashboard") {
    return homeDashboardSteps(path);
  }

  const label = humanizeDashboardPath(path);
  const segments = path.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  const isModuleHub = segments.length === 1;

  return [
    pageStep(
      {
        id: "page_title",
        selectors: [
          '[data-page-tour="title"]',
          '[data-tour="topbar-title"]',
        ],
        title: label,
        body: isModuleHub
          ? `This is the ${label} hub. Use the header and the content below to review KPIs and open related pages.`
          : `You're on ${label}. The header shows where you are and any page-level actions.`,
        placement: "bottom",
      },
      path
    ),
    pageStep(
      {
        id: "page_header_actions",
        selectors: ['[data-page-tour="header-actions"]'],
        title: "Page actions",
        body: "Shortcuts and controls for this page live here in the header.",
        placement: "bottom",
        optional: true,
      },
      path
    ),
    pageStep(
      {
        id: "page_toolbar",
        selectors: ['[data-page-tour="toolbar"]'],
        title: "Search & filters",
        body: "Search and filter this list from this toolbar, then use the primary action on the right when available.",
        placement: "bottom",
        optional: true,
      },
      path
    ),
    pageStep(
      {
        id: "page_content",
        selectors: [
          '[data-page-tour="content"]',
          '[data-page-tour="body"]',
          // Single main body region — not nested widgets
          ".flex.flex-col.min-h-full > .flex-1.p-6",
          ".flex.flex-col.h-full.min-h-0 > .flex-1.p-6",
        ],
        title: isModuleHub ? "Module content" : "Page content",
        body: isModuleHub
          ? "Charts, summaries, and shortcuts for this module are in this area."
          : "Records and details for this page are shown in this area.",
        placement: "bottom",
        optional: true,
      },
      path
    ),
  ];
}
