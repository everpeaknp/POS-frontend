import { FinanceTransaction, FinanceBudget, FinanceBill } from "@/lib/api/personal-finance";

export interface Insight {
  type: "budget_overspend" | "spending_trend" | "bill_due_soon" | "tax_estimate" | "pending_items";
  message_en: string;
  message_ne: string;
  priority: number; // 1 = highest
  action_link?: string;
  action_label?: string;
}

/**
 * Generate proactive insights from user's financial data
 * Plain logic (no AI) — runs server-side or client-side
 * Returns max ~4 insights ranked by priority
 */
export async function generateInsights(
  transactions: FinanceTransaction[],
  budgets: FinanceBudget[],
  bills: FinanceBill[],
  monthlyIncome: number
): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Check for bills due soon
  const upcomingBills = bills.filter((bill) => {
    if (bill.status === "paid") return false;
    const dueDate = new Date(bill.due_date);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue > 0 && daysUntilDue <= 7;
  });

  upcomingBills.forEach((bill) => {
    const dueDate = new Date(bill.due_date);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    insights.push({
      type: "bill_due_soon",
      message_en: `${bill.name} is due in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""} — Rs. ${bill.amount.toLocaleString()}`,
      message_ne: `${bill.name} ${daysUntilDue} दिन मा देय छ — रु. ${bill.amount.toLocaleString()}`,
      priority: 1,
      action_link: `/dashboard/personal-finance/bills`,
      action_label: "View Bills",
    });
  });

  // 2. Check for budgets over/near limit
  const currentMonthTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return (
      tDate.getMonth() === currentMonth &&
      tDate.getFullYear() === currentYear &&
      t.type === "expense"
    );
  });

  budgets.forEach((budget) => {
    const categorySpent = currentMonthTransactions
      .filter((t) => t.category?.id === budget.category?.id)
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const budgetAmount = parseFloat(budget.amount.toString());
    const percentUsed = (categorySpent / budgetAmount) * 100;

    if (percentUsed >= 100) {
      insights.push({
        type: "budget_overspend",
        message_en: `You've exceeded your ${budget.category?.name || "budget"} budget by Rs. ${Math.round(categorySpent - budgetAmount).toLocaleString()}`,
        message_ne: `तपाईंले आफ्नो ${budget.category?.name || "बजेट"} बजेट रु. ${Math.round(categorySpent - budgetAmount).toLocaleString()} ले अतिक्रम गरेको हुनुहुन्छ`,
        priority: 2,
        action_link: `/dashboard/personal-finance/budget`,
        action_label: "View Budget",
      });
    } else if (percentUsed >= 80) {
      insights.push({
        type: "budget_overspend",
        message_en: `You're at ${Math.round(percentUsed)}% of your ${budget.category?.name || "budget"} budget (Rs. ${Math.round(budgetAmount).toLocaleString()})`,
        message_ne: `तपाई आफ्नो ${budget.category?.name || "बजेट"} बजेटको ${Math.round(percentUsed)}% मा पुगेको हुनुहुन्छ (रु. ${Math.round(budgetAmount).toLocaleString()})`,
        priority: 3,
        action_link: `/dashboard/personal-finance/budget`,
        action_label: "View Budget",
      });
    }
  });

  // 3. Spending trend vs last month
  if (insights.length < 3) {
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const thisMonthExpenses = currentMonthTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()),
      0
    );

    const lastMonthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return (
        tDate.getMonth() === lastMonth &&
        tDate.getFullYear() === lastMonthYear &&
        t.type === "expense"
      );
    });

    const lastMonthExpenses = lastMonthTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()),
      0
    );

    if (lastMonthExpenses > 0) {
      const percentChange = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
      if (Math.abs(percentChange) >= 20) {
        const direction = percentChange > 0 ? "more" : "less";
        const directionNe = percentChange > 0 ? "बढी" : "कम";
        insights.push({
          type: "spending_trend",
          message_en: `You spent ${Math.abs(Math.round(percentChange))}% ${direction} this month than last month`,
          message_ne: `तपाईंले यो महिना गत महिना भन्दा ${Math.abs(Math.round(percentChange))}% ${directionNe} खर्च गरेको हुनुहुन्छ`,
          priority: 4,
          action_link: `/dashboard/personal-finance/transactions`,
          action_label: "View Transactions",
        });
      }
    }
  }

  // 4. Tax estimate (simple: ~30% of income as ballpark estimate for Nepal)
  if (insights.length < 4 && monthlyIncome > 0) {
    const yearlyIncome = monthlyIncome * 12;
    const estimatedTax = Math.round(yearlyIncome * 0.3); // Rough estimate
    insights.push({
      type: "tax_estimate",
      message_en: `Estimated tax this year: ~Rs. ${estimatedTax.toLocaleString()} (based on current income)`,
      message_ne: `यस वर्ष अनुमानित कर: ~रु. ${estimatedTax.toLocaleString()} (वर्तमान आय अनुसार)`,
      priority: 5,
      action_link: `/dashboard/personal-finance/tax`,
      action_label: "View Tax",
    });
  }

  // Sort by priority and limit to 4
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 4);
}
