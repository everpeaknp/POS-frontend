// Accounting Mock Data

export interface Account {
  id: string; code: string; name: string; type: string; subType: string;
  level: number; balance: number; parentId?: string; status?: string; description?: string;
}

export const mockChartOfAccounts: Account[] = [
  { id: "1000", code: "1000", name: "Assets", type: "Assets", subType: "Header", level: 0, balance: 1250000 },
  { id: "1100", code: "1100", name: "Current Assets", type: "Assets", subType: "Current Asset", level: 1, balance: 850000, parentId: "1000" },
  { id: "1110", code: "1110", name: "Cash in Hand", type: "Assets", subType: "Cash", level: 2, balance: 45000, parentId: "1100" },
  { id: "1120", code: "1120", name: "Cash at Bank", type: "Assets", subType: "Bank", level: 2, balance: 380000, parentId: "1100" },
  { id: "1130", code: "1130", name: "Accounts Receivable", type: "Assets", subType: "Receivable", level: 2, balance: 425000, parentId: "1100" },
  { id: "1200", code: "1200", name: "Fixed Assets", type: "Assets", subType: "Fixed Asset", level: 1, balance: 400000, parentId: "1000" },
  { id: "1210", code: "1210", name: "Furniture & Fixtures", type: "Assets", subType: "Fixed Asset", level: 2, balance: 150000, parentId: "1200" },
  { id: "1220", code: "1220", name: "Computer Equipment", type: "Assets", subType: "Fixed Asset", level: 2, balance: 250000, parentId: "1200" },
  { id: "2000", code: "2000", name: "Liabilities", type: "Liabilities", subType: "Header", level: 0, balance: 680000 },
  { id: "2100", code: "2100", name: "Current Liabilities", type: "Liabilities", subType: "Current Liability", level: 1, balance: 480000, parentId: "2000" },
  { id: "2110", code: "2110", name: "Accounts Payable", type: "Liabilities", subType: "Payable", level: 2, balance: 320000, parentId: "2100" },
  { id: "2120", code: "2120", name: "VAT Payable", type: "Liabilities", subType: "Tax", level: 2, balance: 85000, parentId: "2100" },
  { id: "2130", code: "2130", name: "TDS Payable", type: "Liabilities", subType: "Tax", level: 2, balance: 75000, parentId: "2100" },
  { id: "3000", code: "3000", name: "Equity", type: "Equity", subType: "Header", level: 0, balance: 570000 },
  { id: "3100", code: "3100", name: "Owner's Capital", type: "Equity", subType: "Capital", level: 1, balance: 500000, parentId: "3000" },
  { id: "3200", code: "3200", name: "Retained Earnings", type: "Equity", subType: "Retained Earnings", level: 1, balance: 70000, parentId: "3000" },
  { id: "4000", code: "4000", name: "Income", type: "Income", subType: "Header", level: 0, balance: 850000 },
  { id: "4100", code: "4100", name: "Sales Revenue", type: "Income", subType: "Revenue", level: 1, balance: 800000, parentId: "4000" },
  { id: "4200", code: "4200", name: "Other Income", type: "Income", subType: "Other Income", level: 1, balance: 50000, parentId: "4000" },
  { id: "5000", code: "5000", name: "Expenses", type: "Expense", subType: "Header", level: 0, balance: 420000 },
  { id: "5100", code: "5100", name: "Cost of Goods Sold", type: "Expense", subType: "COGS", level: 1, balance: 280000, parentId: "5000" },
  { id: "5200", code: "5200", name: "Operating Expenses", type: "Expense", subType: "Operating", level: 1, balance: 140000, parentId: "5000" },
  { id: "5210", code: "5210", name: "Rent Expense", type: "Expense", subType: "Operating", level: 2, balance: 60000, parentId: "5200" },
  { id: "5220", code: "5220", name: "Salary Expense", type: "Expense", subType: "Operating", level: 2, balance: 80000, parentId: "5200" },
];

export interface JournalLine { accountId: string; accountName: string; description: string; debit: number; credit: number; }
export interface JournalEntry {
  id: string; date: string; reference: string | null; description: string;
  type: string; debit: number; credit: number; status: string;
  lines?: JournalLine[]; postedBy?: string; postedDate?: string;
}

export const mockJournalEntries: JournalEntry[] = [
  { id: "JE-0001", date: "2082-01-10", reference: "INV-0001", description: "Sales invoice - Ram Sharma", type: "Sales", debit: 24000, credit: 24000, status: "Posted", postedBy: "Admin", postedDate: "2082-01-10",
    lines: [
      { accountId: "1130", accountName: "Accounts Receivable", description: "Sales to Ram Sharma", debit: 24000, credit: 0 },
      { accountId: "4100", accountName: "Sales Revenue", description: "Sales revenue", debit: 0, credit: 21239 },
      { accountId: "2120", accountName: "VAT Payable", description: "VAT 13%", debit: 0, credit: 2761 },
    ]
  },
  { id: "JE-0002", date: "2082-01-09", reference: "PINV-0001", description: "Purchase invoice - ABC Suppliers", type: "Purchase", debit: 85000, credit: 85000, status: "Posted", postedBy: "Admin", postedDate: "2082-01-09",
    lines: [
      { accountId: "5100", accountName: "Cost of Goods Sold", description: "Purchase from ABC", debit: 75221, credit: 0 },
      { accountId: "2120", accountName: "VAT Payable", description: "Input VAT 13%", debit: 9779, credit: 0 },
      { accountId: "2110", accountName: "Accounts Payable", description: "Payable to ABC", debit: 0, credit: 85000 },
    ]
  },
  { id: "JE-0003", date: "2082-01-08", reference: "PAY-0001", description: "Payment received - Sita Thapa", type: "Payment", debit: 18000, credit: 18000, status: "Posted", postedBy: "Admin", postedDate: "2082-01-08",
    lines: [
      { accountId: "1120", accountName: "Cash at Bank", description: "Payment received", debit: 18000, credit: 0 },
      { accountId: "1130", accountName: "Accounts Receivable", description: "Clear receivable", debit: 0, credit: 18000 },
    ]
  },
  { id: "JE-0004", date: "2082-01-07", reference: null, description: "Monthly rent payment", type: "Manual", debit: 30000, credit: 30000, status: "Draft",
    lines: [
      { accountId: "5210", accountName: "Rent Expense", description: "Office rent Magh", debit: 30000, credit: 0 },
      { accountId: "1120", accountName: "Cash at Bank", description: "Bank payment", debit: 0, credit: 30000 },
    ]
  },
  { id: "JE-0005", date: "2082-01-05", reference: "SAL-001", description: "Salary payment - Magh", type: "Payment", debit: 80000, credit: 80000, status: "Posted", postedBy: "Admin", postedDate: "2082-01-05",
    lines: [
      { accountId: "5220", accountName: "Salary Expense", description: "Salary Magh 2082", debit: 80000, credit: 0 },
      { accountId: "1120", accountName: "Cash at Bank", description: "Bank payment", debit: 0, credit: 80000 },
    ]
  },
];

export interface LedgerEntry { date: string; reference: string; description: string; debit: number; credit: number; balance: number; source: string; }

export const mockLedgerEntries: LedgerEntry[] = [
  { date: "2082-01-01", reference: "OB", description: "Opening Balance", debit: 380000, credit: 0, balance: 380000, source: "Opening" },
  { date: "2082-01-03", reference: "PAY-0001", description: "Payment from Ram Sharma", debit: 24000, credit: 0, balance: 404000, source: "Sales" },
  { date: "2082-01-05", reference: "SAL-001", description: "Salary payment Magh", debit: 0, credit: 80000, balance: 324000, source: "Journal" },
  { date: "2082-01-07", reference: "PINV-0002", description: "Payment to supplier", debit: 0, credit: 45000, balance: 279000, source: "Purchase" },
  { date: "2082-01-08", reference: "PAY-0002", description: "Payment from Sita Thapa", debit: 18000, credit: 0, balance: 297000, source: "Sales" },
  { date: "2082-01-10", reference: "RENT-001", description: "Office rent payment", debit: 0, credit: 30000, balance: 267000, source: "Journal" },
  { date: "2082-01-12", reference: "PAY-0003", description: "Payment from Gita Rai", debit: 9600, credit: 0, balance: 276600, source: "Sales" },
  { date: "2082-01-15", reference: "UTIL-001", description: "Utilities payment", debit: 0, credit: 12000, balance: 264600, source: "Journal" },
];

export interface TaxRule { id: string; name: string; type: string; rate: number; applicableOn: string; account: string; status: string; }

export const mockTaxRules: TaxRule[] = [
  { id: "T001", name: "VAT 13%", type: "VAT", rate: 13, applicableOn: "Both", account: "VAT Payable", status: "active" },
  { id: "T002", name: "TDS 15%", type: "TDS", rate: 15, applicableOn: "Purchase", account: "TDS Payable", status: "active" },
  { id: "T003", name: "TDS 5%", type: "TDS", rate: 5, applicableOn: "Purchase", account: "TDS Payable", status: "active" },
  { id: "T004", name: "TDS 1.5%", type: "TDS", rate: 1.5, applicableOn: "Purchase", account: "TDS Payable", status: "active" },
];

export interface VatReturn { id: string; period: string; fromDate: string; toDate: string; outputTax: number; inputTax: number; netPayable: number; status: string; }

export const mockVatReturns: VatReturn[] = [
  { id: "VAT-0001", period: "Magh 2081", fromDate: "2081-10-01", toDate: "2081-10-29", outputTax: 62400, inputTax: 28600, netPayable: 33800, status: "Filed" },
  { id: "VAT-0002", period: "Falgun 2081", fromDate: "2081-11-01", toDate: "2081-11-30", outputTax: 58500, inputTax: 24300, netPayable: 34200, status: "Paid" },
  { id: "VAT-0003", period: "Chaitra 2081", fromDate: "2081-12-01", toDate: "2081-12-30", outputTax: 71500, inputTax: 31200, netPayable: 40300, status: "Draft" },
];

export interface BankAccount { id: string; bankName: string; accountName: string; accountNumber: string; type: string; balance: number; lastReconciled: string; status: string; branch?: string; swift?: string; }

export const mockBankAccounts: BankAccount[] = [
  { id: "BA001", bankName: "Nepal Bank Ltd.", accountName: "FashionNep Current A/C", accountNumber: "0012345678901", type: "Current", balance: 380000, lastReconciled: "2082-01-01", status: "active", branch: "Thamel, Kathmandu", swift: "NEBLNPKA" },
  { id: "BA002", bankName: "NIC Asia Bank", accountName: "FashionNep Savings", accountNumber: "1098765432100", type: "Savings", balance: 125000, lastReconciled: "2082-01-01", status: "active", branch: "New Road, Kathmandu", swift: "NICENPKA" },
];

export const mockBankTransactions = [
  { id: "BT001", date: "2082-01-01", reference: "OB", description: "Opening Balance", debit: 380000, credit: 0, balance: 380000, type: "Opening" },
  { id: "BT002", date: "2082-01-03", reference: "PAY-0001", description: "Payment from Ram Sharma", debit: 24000, credit: 0, balance: 404000, type: "Credit" },
  { id: "BT003", date: "2082-01-05", reference: "SAL-001", description: "Salary payment", debit: 0, credit: 80000, balance: 324000, type: "Debit" },
  { id: "BT004", date: "2082-01-07", reference: "PINV-0002", description: "Supplier payment", debit: 0, credit: 45000, balance: 279000, type: "Debit" },
  { id: "BT005", date: "2082-01-08", reference: "PAY-0002", description: "Payment from Sita Thapa", debit: 18000, credit: 0, balance: 297000, type: "Credit" },
  { id: "BT006", date: "2082-01-10", reference: "RENT-001", description: "Office rent", debit: 0, credit: 30000, balance: 267000, type: "Debit" },
  { id: "BT007", date: "2082-01-12", reference: "PAY-0003", description: "Payment from Gita Rai", debit: 9600, credit: 0, balance: 276600, type: "Credit" },
  { id: "BT008", date: "2082-01-15", reference: "UTIL-001", description: "Utilities", debit: 0, credit: 12000, balance: 264600, type: "Debit" },
];

export const monthlyIncomeExpense = [
  { month: "Bai", income: 320000, expense: 210000 },
  { month: "Jes", income: 285000, expense: 195000 },
  { month: "Asa", income: 410000, expense: 260000 },
  { month: "Shr", income: 375000, expense: 230000 },
  { month: "Bha", income: 445000, expense: 280000 },
  { month: "Asw", income: 390000, expense: 245000 },
];

export const expenseBreakdown = [
  { name: "COGS", value: 280000 },
  { name: "Salaries", value: 80000 },
  { name: "Rent", value: 60000 },
  { name: "Utilities", value: 12000 },
  { name: "Other", value: 8000 },
];
