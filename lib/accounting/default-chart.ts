/** Preview list for standard chart of accounts — mirrors backend accounting/chart_seed.py */
export const DEFAULT_CHART_OF_ACCOUNTS = [
  { code: "1000", name: "Cash", type: "Assets", sub_type: "Cash" },
  { code: "1010", name: "Bank", type: "Assets", sub_type: "Bank" },
  { code: "1100", name: "Accounts Receivable", type: "Assets", sub_type: "Receivable" },
  { code: "1200", name: "Inventory", type: "Assets", sub_type: "Current Asset" },
  { code: "1300", name: "Prepaid Expenses", type: "Assets", sub_type: "Current Asset" },
  { code: "1500", name: "Fixed Assets", type: "Assets", sub_type: "Fixed Asset" },
  { code: "2000", name: "Accounts Payable", type: "Liabilities", sub_type: "Payable" },
  { code: "2100", name: "Wages Payable", type: "Liabilities", sub_type: "Payable" },
  { code: "2200", name: "VAT Payable", type: "Liabilities", sub_type: "Tax" },
  { code: "2300", name: "TDS Payable", type: "Liabilities", sub_type: "Tax" },
  { code: "3000", name: "Owner's Capital", type: "Equity", sub_type: "Capital" },
  { code: "3100", name: "Retained Earnings", type: "Equity", sub_type: "Retained Earnings" },
  { code: "4000", name: "Sales Revenue", type: "Income", sub_type: "Revenue" },
  { code: "4100", name: "Other Income", type: "Income", sub_type: "Other Income" },
  { code: "5000", name: "Cost of Goods Sold", type: "Expense", sub_type: "COGS" },
  { code: "5100", name: "Construction Expenses", type: "Expense", sub_type: "Operating" },
  { code: "5200", name: "Labor Expenses", type: "Expense", sub_type: "Operating" },
  { code: "5300", name: "Equipment Expenses", type: "Expense", sub_type: "Operating" },
  { code: "5400", name: "Administrative Expenses", type: "Expense", sub_type: "Administrative" },
  { code: "5500", name: "Payroll Expenses", type: "Expense", sub_type: "Operating" },
] as const;

export const CHART_ACCOUNT_TYPES = [
  "Assets",
  "Liabilities",
  "Equity",
  "Income",
  "Expense",
] as const;
