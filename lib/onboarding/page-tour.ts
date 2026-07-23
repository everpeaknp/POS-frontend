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

/** Human label from `/settings/security` → `Security` */
export function humanizeSettingsPath(pathname: string): string {
  const clean = pathname.split("?")[0].replace(/\/+$/, "") || "/settings";
  if (clean === "/settings") return "Settings";

  const parts = clean.replace(/^\/settings\/?/, "").split("/").filter(Boolean);
  if (parts.length === 0) return "Settings";

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

function pageTitleStep(pathname: string, title: string, body: string): TourStep {
  return pageStep(
    {
      id: "page_title",
      selectors: [
        '[data-page-tour="title"]',
        '[data-tour="topbar-title"]',
      ],
      title,
      body,
      placement: "bottom",
    },
    pathname
  );
}

/** Home dashboard — curated beats + discovered module sections */
function homeDashboardSteps(pathname: string): TourStep[] {
  return [
    pageTitleStep(
      pathname,
      "Dashboard",
      "This is your organization home — KPIs and module snapshots for the period you select."
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
    // Module detail cards / extra sections below the grid
    ...discoverDetailSteps(pathname).filter(
      (s) =>
        s.id.startsWith("page_section_") || s.id.startsWith("page_stats_")
    ),
  ];
}

function isDisplayed(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return false;
    node = node.parentElement;
  }
  return true;
}

function inChrome(el: Element): boolean {
  return Boolean(
    el.closest(
      '[data-tour="sidebar"], [data-tour="settings-sidebar"], [data-tour="app-icon-rail"]'
    )
  );
}

function pageRoot(): Element {
  const explicit = document.querySelector(
    "[data-page-tour-root], [data-page-tour='content']"
  );
  if (explicit && isDisplayed(explicit)) return explicit as Element;

  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".flex-1.p-6, .flex-1.overflow-y-auto.p-6, .flex-1.min-h-0.p-6, .flex-1.overflow-y-auto"
    )
  ).filter((el) => isDisplayed(el) && !inChrome(el));

  candidates.sort(
    (a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width
  );
  const found = candidates[0] || document.body;
  if (found !== document.body && !found.hasAttribute("data-page-tour-root")) {
    found.setAttribute("data-page-tour-root", "");
  }
  return found;
}

function stampId(el: Element, sid: string) {
  el.setAttribute("data-page-tour-id", sid);
  return `[data-page-tour-id="${CSS.escape(sid)}"]`;
}

function markSection(el: Element, title: string, body?: string) {
  if (el.getAttribute("data-page-tour")) return;
  el.setAttribute("data-page-tour", "section");
  el.setAttribute("data-page-tour-title", title);
  el.setAttribute(
    "data-page-tour-body",
    body || `This is the ${title} area — review the details here.`
  );
}

function autoMarkDashboardPatterns(root: Element) {
  // Toolbar: search / filter row (invoices-style)
  if (!root.querySelector('[data-page-tour="toolbar"]')) {
    const rows = Array.from(
      root.querySelectorAll<HTMLElement>("div.flex.flex-wrap, div.flex.items-center")
    );
    for (const row of rows) {
      if (inChrome(row)) continue;
      if (row.closest('[data-page-tour="toolbar"], [data-page-tour="section"]'))
        continue;
      const hasSearch = row.querySelector(
        'input[placeholder*="Search" i], input[placeholder*="search" i], input[type="search"]'
      );
      const hasFilter = row.querySelector(
        'button[role="combobox"], [data-slot="select-trigger"], select'
      );
      const hasAction = row.querySelector(
        'a[href*="/new"], a[href*="invite"], button'
      );
      if (hasSearch || (hasFilter && hasAction)) {
        const outer =
          (row.closest(".justify-between") as HTMLElement | null) || row;
        // Prefer the toolbar card wrapper when present
        const card = outer.closest(
          ".rounded-xl, .rounded-2xl, [class*='border']"
        ) as HTMLElement | null;
        const target =
          card &&
          card !== root &&
          !card.hasAttribute("data-page-tour-root") &&
          card.querySelector("input, button[role='combobox'], select")
            ? card
            : outer;
        target.setAttribute("data-page-tour", "toolbar");
        break;
      }
    }
  }

  // Stats grid near the top (KPI cards) — not nested inside another card
  if (!root.querySelector('[data-page-tour="stats"]')) {
    const grids = Array.from(root.querySelectorAll<HTMLElement>("div.grid"));
    for (const grid of grids) {
      if (inChrome(grid)) continue;
      if (
        grid.closest(
          '[data-page-tour="module-grid"], [data-page-tour="section"], [data-page-tour="toolbar"], [data-page-tour="table"]'
        )
      ) {
        continue;
      }
      // Skip grids nested inside existing cards (module detail KPIs, etc.)
      const cardAncestor = grid.closest(
        "section, .rounded-xl, .rounded-2xl"
      ) as HTMLElement | null;
      if (cardAncestor && cardAncestor !== grid) continue;
      if (grid.querySelector("table")) continue;
      const cards = grid.querySelectorAll(
        ":scope > .rounded-xl, :scope > .rounded-2xl, :scope > .rounded-lg, :scope > a.rounded-xl, :scope > a.rounded-2xl, :scope > [class*='shadow-sm']"
      );
      if (cards.length >= 2 && cards.length <= 8) {
        grid.setAttribute("data-page-tour", "stats");
        break;
      }
    }
  }

  // Table card wrappers
  root.querySelectorAll("table").forEach((table) => {
    if (inChrome(table)) return;
    if (table.closest('[data-page-tour="section"], [data-page-tour="table"]'))
      return;
    const wrap =
      (table.closest(
        ".overflow-hidden, .rounded-xl, .rounded-2xl"
      ) as HTMLElement | null) || (table as unknown as HTMLElement);
    wrap.setAttribute("data-page-tour", "table");
  });

  // Primary green / New action
  if (!root.querySelector('[data-page-tour="primary-action"]')) {
    const newLink = Array.from(
      root.querySelectorAll<HTMLElement>('a[href*="/new"]')
    ).find((a) => isDisplayed(a) && !inChrome(a));
    if (newLink) {
      const target =
        (newLink.querySelector("button") as HTMLElement | null) ||
        (newLink.closest("button") as HTMLElement | null) ||
        newLink;
      target.setAttribute("data-page-tour", "primary-action");
    } else {
      const greenBtn = Array.from(root.querySelectorAll("button")).find(
        (btn) =>
          isDisplayed(btn) &&
          !inChrome(btn) &&
          (btn.className.includes("22C55E") ||
            btn.className.includes("16A34A") ||
            /^(new|add|create|invite|export)/i.test(
              (btn.textContent || "").trim()
            ))
      );
      if (greenBtn) {
        greenBtn.setAttribute("data-page-tour", "primary-action");
      }
    }
  }

  // Card / section blocks with a clear heading (charts, credit, recent lists)
  root
    .querySelectorAll("section, div.rounded-xl, div.rounded-2xl")
    .forEach((el) => {
      if (inChrome(el)) return;
      if (el.getAttribute("data-page-tour")) return;
      if (
        el.closest(
          '[data-page-tour="toolbar"], [data-page-tour="stats"], [data-page-tour="table"], [data-page-tour="module-grid"]'
        )
      ) {
        return;
      }
      const heading = el.querySelector(
        ":scope > div h2, :scope > div h3, :scope > h2, :scope > h3, :scope > div > h2, :scope > div > h3"
      );
      const title = heading?.textContent?.trim();
      if (!title || title.length < 3 || title.length > 60) return;
      const rect = el.getBoundingClientRect();
      if (rect.height < 80 || rect.width < 200) return;
      if (
        !el.querySelector(
          "table, canvas, .recharts-wrapper, a[href^='/dashboard'], button, ul, ol"
        )
      ) {
        return;
      }
      markSection(el, title);
    });

  // Headed blocks where h2/h3 sits above a grid (Quick Actions, module links)
  root.querySelectorAll("h2, h3").forEach((heading) => {
    if (inChrome(heading)) return;
    if (heading.closest("[data-page-tour]")) return;
    const parent = heading.parentElement;
    if (!parent || parent === root) return;
    if (parent.hasAttribute("data-page-tour-root")) return;
    if (parent.getAttribute("data-page-tour")) return;
    if (
      parent.closest(
        '[data-page-tour="toolbar"], [data-page-tour="stats"], [data-page-tour="table"], [data-page-tour="module-grid"], [data-page-tour="section"]'
      )
    ) {
      return;
    }
    const title = (heading.textContent || "").trim();
    if (!title || title.length < 3 || title.length > 48) return;
    const rect = parent.getBoundingClientRect();
    if (rect.height < 70 || rect.height > window.innerHeight * 0.9) return;
    if (
      !parent.querySelector(
        ":scope > div.grid, :scope > .grid, a[href^='/dashboard'], table, .recharts-wrapper"
      )
    ) {
      return;
    }
    markSection(parent, title);
  });
}

/**
 * Discover concrete page pieces (cards, tables, toolbars, actions) — never the whole page shell.
 */
function discoverDetailSteps(pathname: string): TourStep[] {
  if (typeof document === "undefined") return [];

  const root = pageRoot();
  autoMarkDashboardPatterns(root);

  const steps: TourStep[] = [];
  const seen = new Set<Element>();
  const MAX_SECTIONS = 8;

  const pushUnique = (
    el: Element,
    step: Omit<TourStep, "route"> & { route?: string }
  ) => {
    if (seen.has(el) || !isDisplayed(el) || inChrome(el)) return;
    if (
      el.hasAttribute("data-page-tour-root") ||
      el.getAttribute("data-page-tour") === "content"
    ) {
      return;
    }
    seen.add(el);
    steps.push(pageStep(step, pathname));
  };

  // Header page actions (filters/period toggles in the top bar)
  const headerActions = document.querySelector(
    '[data-page-tour="header-actions"]'
  );
  if (headerActions && !inChrome(headerActions)) {
    pushUnique(headerActions, {
      id: "page_header_actions",
      selectors: ['[data-page-tour="header-actions"]'],
      title: "Page actions",
      body: "Shortcuts and controls for this page live here in the header.",
      placement: "bottom",
      optional: true,
    });
  }

  root.querySelectorAll('[data-page-tour="toolbar"]').forEach((el, i) => {
    const sel = stampId(el, `toolbar_${i}`);
    pushUnique(el, {
      id: `page_toolbar_${i}`,
      selectors: [sel],
      title: "Search & filters",
      body: "Search and filter this list, then use the action on the right when available.",
      placement: "bottom",
      optional: true,
    });
  });

  root.querySelectorAll('[data-page-tour="stats"]').forEach((el, i) => {
    const sel = stampId(el, `stats_${i}`);
    pushUnique(el, {
      id: `page_stats_${i}`,
      selectors: [sel],
      title: "Summary cards",
      body: "Key totals and status counts for this page are summarized here.",
      placement: "bottom",
      optional: true,
    });
  });

  Array.from(root.querySelectorAll('[data-page-tour="section"]'))
    .slice(0, MAX_SECTIONS)
    .forEach((el, i) => {
      const id =
        el.getAttribute("data-page-tour-id") ||
        el
          .getAttribute("data-page-tour-title")
          ?.toLowerCase()
          .replace(/\s+/g, "-") ||
        `section_${i}`;
      const sel = stampId(el, id);
      const title =
        el.getAttribute("data-page-tour-title") || `Section ${i + 1}`;
      const body =
        el.getAttribute("data-page-tour-body") ||
        `Review the ${title} section on this page.`;
      pushUnique(el, {
        id: `page_section_${id}`,
        selectors: [sel],
        title,
        body,
        placement: "bottom",
        optional: true,
      });
    });

  root.querySelectorAll('[data-page-tour="table"]').forEach((el, i) => {
    if (el.closest('[data-page-tour="section"]')) return;
    const sel = stampId(el, `table_${i}`);
    pushUnique(el, {
      id: `page_table_${i}`,
      selectors: [sel],
      title: "Records",
      body: "Your records and details for this page are listed here.",
      placement: "top",
      optional: true,
    });
  });

  root.querySelectorAll('[data-page-tour="primary-action"]').forEach((el, i) => {
    // Skip if already inside toolbar (covered there)
    if (el.closest('[data-page-tour="toolbar"]')) return;
    const sel = stampId(el, `primary_${i}`);
    pushUnique(el, {
      id: `page_primary_${i}`,
      selectors: [sel],
      title: "Primary action",
      body: "Use this action to create, export, or save on this page.",
      placement: "left",
      optional: true,
    });
  });

  return steps;
}

/**
 * Build page-help steps for the open route.
 * Prefer concrete UI pieces (sections, tables, toolbars) over the whole page shell.
 */
export function buildPageTourSteps(pathname: string): TourStep[] {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/dashboard";

  if (path === "/dashboard") {
    return homeDashboardSteps(path);
  }

  if (path === "/settings" || path.startsWith("/settings/")) {
    const label = humanizeSettingsPath(path);
    return [
      pageTitleStep(
        path,
        label,
        `You're on ${label}. The tips next highlight each section on this page.`
      ),
      ...discoverDetailSteps(path),
    ];
  }

  if (!path.startsWith("/dashboard")) return [];

  const label = humanizeDashboardPath(path);
  const segments = path.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  const isModuleHub = segments.length === 1;

  return [
    pageTitleStep(
      path,
      label,
      isModuleHub
        ? `This is the ${label} hub. The next tips walk through the main parts of this page.`
        : `You're on ${label}. The next tips walk through search, filters, and records on this page.`
    ),
    ...discoverDetailSteps(path),
  ];
}
