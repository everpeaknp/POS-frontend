/**
 * Natural-language → structured desktop actions.
 * Deterministic first; LLM is only for free-form drafting when configured.
 */

export type AiAction =
  | { type: "navigate"; href: string; label: string }
  | { type: "search"; query: string; scope?: string }
  | { type: "sync" }
  | { type: "print" }
  | { type: "open_ai" }
  | { type: "draft"; kind: DraftKind; prompt: string }
  | { type: "message"; text: string };

export type DraftKind =
  | "email"
  | "quotation"
  | "purchase_order"
  | "meeting_notes"
  | "reminder"
  | "task_list"
  | "summary"
  | "rewrite"
  | "translate"
  | "grammar";

type IntentRule = {
  re: RegExp;
  run: (m: RegExpMatchArray, raw: string) => AiAction | AiAction[];
};

const NAV: { re: RegExp; href: string; label: string }[] = [
  { re: /\b(open|go to|show)\s+(sales|billing)\b/i, href: "/dashboard/sales", label: "Sales" },
  { re: /\b(open|go to|show)\s+(hr|human resources|payroll)\b/i, href: "/dashboard/hr", label: "HR" },
  { re: /\b(open|go to|show)\s+(inventory|stock)\b/i, href: "/dashboard/inventory", label: "Inventory" },
  { re: /\b(open|go to|show)\s+(purchase|procurement)\b/i, href: "/dashboard/purchase", label: "Purchase" },
  { re: /\b(open|go to|show)\s+(accounting|accounts|books)\b/i, href: "/dashboard/accounting", label: "Accounting" },
  { re: /\b(open|go to|show)\s+(pos|point of sale|cashier)\b/i, href: "/dashboard/pos", label: "POS" },
  { re: /\b(open|go to|show)\s+(reports?|analytics)\b/i, href: "/dashboard/reports", label: "Reports" },
  { re: /\b(open|go to|show)\s+(settings|preferences)\b/i, href: "/dashboard/settings/org", label: "Settings" },
  { re: /\b(open|go to|show)\s+(dashboard|home)\b/i, href: "/dashboard", label: "Dashboard" },
  { re: /\b(open|go to|show)\s+(attendance)\b/i, href: "/dashboard/hr/attendance", label: "Attendance" },
  { re: /\b(open|go to|show)\s+(customers?)\b/i, href: "/dashboard/sales/customers", label: "Customers" },
  { re: /\b(open|go to|show)\s+(products?)\b/i, href: "/dashboard/inventory/products", label: "Products" },
  { re: /\b(open|go to|show)\s+(invoices?)\b/i, href: "/dashboard/sales/invoices", label: "Invoices" },
  { re: /\b(open|go to|show)\s+(employees?)\b/i, href: "/dashboard/hr/employees", label: "Employees" },
  { re: /\b(open|go to|show)\s+(help|tour)\b/i, href: "/dashboard/settings/help", label: "Help Desk" },
];

const CREATE: { re: RegExp; href: string; label: string }[] = [
  { re: /\b(create|new|add)\s+(employee)\b/i, href: "/dashboard/hr/employees/new", label: "Create employee" },
  { re: /\b(create|new|add)\s+(invoice)\b/i, href: "/dashboard/sales/invoices/new", label: "Create invoice" },
  { re: /\b(create|new|add)\s+(customer)\b/i, href: "/dashboard/sales/customers/new", label: "Create customer" },
  { re: /\b(create|new|add)\s+(product)\b/i, href: "/dashboard/inventory/products/new", label: "Create product" },
  { re: /\b(create|new|add)\s+(quotation|quote)\b/i, href: "/dashboard/sales/quotations/new", label: "Create quotation" },
  { re: /\b(create|new|add)\s+(purchase\s*order|po)\b/i, href: "/dashboard/purchase/orders/new", label: "Create purchase order" },
  { re: /\b(create|new|add)\s+(sales\s*order)\b/i, href: "/dashboard/sales/orders/new", label: "Create sales order" },
];

const RULES: IntentRule[] = [
  {
    re: /\b(sync|restart sync|sync data|sync now)\b/i,
    run: () => ({ type: "sync" }),
  },
  {
    re: /\b(print)(\s+invoice|\s+receipt)?\b/i,
    run: () => ({ type: "print" }),
  },
  {
    re: /\b(backup)(\s+database|\s+data)?\b/i,
    run: () => ({
      type: "message",
      text: "Backup is available from the desktop sync/offline layer. Use the status bar Sync control, or ask for “Sync Data”. Full encrypted backup lands in a later wave.",
    }),
  },
  {
    re: /\b(low stock|out of stock)\b/i,
    run: () => ({
      type: "navigate",
      href: "/dashboard/inventory/products",
      label: "Products (check low stock)",
    }),
  },
  {
    re: /\b(today'?s?\s+sales|sales today)\b/i,
    run: () => ({ type: "navigate", href: "/dashboard/sales", label: "Sales overview" }),
  },
  {
    re: /\bsearch\s+(customer|product|employee|invoice|supplier)s?\s+(.+)/i,
    run: (m) => ({
      type: "search",
      scope: m[1].toLowerCase(),
      query: m[2].trim(),
    }),
  },
  {
    re: /\b(find|search)\s+(.+)/i,
    run: (m) => ({ type: "search", query: m[2].trim() }),
  },
  {
    re: /\b(write|draft|generate)\s+(an?\s+)?(email)\b([\s\S]*)/i,
    run: (_m, raw) => ({ type: "draft", kind: "email", prompt: raw }),
  },
  {
    re: /\b(write|draft|generate)\s+(a\s+)?(quotation|quote)\b([\s\S]*)/i,
    run: (_m, raw) => ({ type: "draft", kind: "quotation", prompt: raw }),
  },
  {
    re: /\b(write|draft|generate)\s+(a\s+)?(purchase order|po)\b([\s\S]*)/i,
    run: (_m, raw) => ({ type: "draft", kind: "purchase_order", prompt: raw }),
  },
  {
    re: /\b(meeting notes|summarize meeting)\b([\s\S]*)/i,
    run: (_m, raw) => ({ type: "draft", kind: "meeting_notes", prompt: raw }),
  },
  {
    re: /\b(remind|reminder|task list)\b([\s\S]*)/i,
    run: (_m, raw) => ({ type: "draft", kind: "task_list", prompt: raw }),
  },
  {
    re: /\b(summarize|summary)\b([\s\S]*)/i,
    run: (_m, raw) => ({ type: "draft", kind: "summary", prompt: raw }),
  },
  {
    re: /\b(rewrite|rephrase)\b([\s\S]*)/i,
    run: (_m, raw) => ({ type: "draft", kind: "rewrite", prompt: raw }),
  },
  {
    re: /\b(translate)\b([\s\S]*)/i,
    run: (_m, raw) => ({ type: "draft", kind: "translate", prompt: raw }),
  },
  {
    re: /\b(fix grammar|correct grammar|proofread)\b([\s\S]*)/i,
    run: (_m, raw) => ({ type: "draft", kind: "grammar", prompt: raw }),
  },
];

export function parseAiIntent(input: string): AiAction[] {
  const raw = input.trim();
  if (!raw) return [];

  for (const n of NAV) {
    if (n.re.test(raw)) {
      return [{ type: "navigate", href: n.href, label: n.label }];
    }
  }
  for (const c of CREATE) {
    if (c.re.test(raw)) {
      return [{ type: "navigate", href: c.href, label: c.label }];
    }
  }
  for (const rule of RULES) {
    const m = raw.match(rule.re);
    if (m) {
      const out = rule.run(m, raw);
      return Array.isArray(out) ? out : [out];
    }
  }

  // Bare module names
  const bare = raw.toLowerCase();
  const bareMap: Record<string, { href: string; label: string }> = {
    sales: { href: "/dashboard/sales", label: "Sales" },
    hr: { href: "/dashboard/hr", label: "HR" },
    inventory: { href: "/dashboard/inventory", label: "Inventory" },
    purchase: { href: "/dashboard/purchase", label: "Purchase" },
    accounting: { href: "/dashboard/accounting", label: "Accounting" },
    pos: { href: "/dashboard/pos", label: "POS" },
    reports: { href: "/dashboard/reports", label: "Reports" },
    settings: { href: "/dashboard/settings/org", label: "Settings" },
  };
  if (bareMap[bare]) {
    const b = bareMap[bare];
    return [{ type: "navigate", href: b.href, label: b.label }];
  }

  return [{ type: "draft", kind: "summary", prompt: raw }];
}

export const AI_QUICK_PROMPTS = [
  "Open Sales",
  "Create Invoice",
  "Search customer ",
  "Show low stock",
  "Show today's sales",
  "Sync Data",
  "Draft an email to a customer about overdue payment",
  "Summarize what I should check in HR today",
  "Generate a short quotation intro for a hardware retailer",
];
