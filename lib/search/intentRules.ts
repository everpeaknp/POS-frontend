/**
 * Pattern-matching rules for common financial queries
 * No AI needed — fast, free intent detection
 */

export interface IntentMatch {
  type: "navigate" | "answer" | "nomatch";
  answer?: string;
  answer_ne?: string;
  link?: string;
  action?: "view_bills" | "view_tax" | "view_transactions" | "view_budget";
}

export function matchIntent(query: string, language: "en" | "ne"): IntentMatch {
  const q = query.toLowerCase().trim();

  // Nepali text handling — basic
  const isNepali = /[\u0900-\u097F]/.test(q);

  // 1. TAX-related queries
  if (
    q.includes("tax") ||
    q.includes("कर") ||
    q.includes("estimate") ||
    q.includes("obligation")
  ) {
    return {
      type: "navigate",
      link: "/dashboard/finance/tax",
      action: "view_tax",
    };
  }

  // 2. BILL-related queries
  if (
    q.includes("bill") ||
    q.includes("बिल") ||
    q.includes("due") ||
    q.includes("payment") ||
    q.includes("भुक्तान")
  ) {
    return {
      type: "navigate",
      link: "/dashboard/finance/bills",
      action: "view_bills",
    };
  }

  // 3. SPENDING / BUDGET queries
  if (
    q.includes("spend") ||
    q.includes("खर्च") ||
    q.includes("expense") ||
    q.includes("budget") ||
    q.includes("बजेट") ||
    q.includes("how much") ||
    q.includes("कति")
  ) {
    return {
      type: "navigate",
      link: "/dashboard/finance/transactions",
      action: "view_transactions",
    };
  }

  // 4. TRANSACTION/INCOME queries
  if (
    q.includes("add") ||
    q.includes("जोड्नुहोस्") ||
    q.includes("transaction") ||
    q.includes("income") ||
    q.includes("आय") ||
    q.includes("expense") ||
    q.includes("खर्च")
  ) {
    return {
      type: "navigate",
      link: "/dashboard/finance/transactions",
      action: "view_transactions",
    };
  }

  // 5. GENERAL STATUS/OVERVIEW
  if (
    q.includes("summary") ||
    q.includes("overview") ||
    q.includes("total") ||
    q.includes("जम्मा") ||
    q.includes("status")
  ) {
    return {
      type: "navigate",
      link: "/dashboard/finance",
      action: undefined,
    };
  }

  // No match — fall back to LLM
  return {
    type: "nomatch",
  };
}
