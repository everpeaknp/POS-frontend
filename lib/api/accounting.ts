import apiClient from './client';

type Paginated<T> = T[] | { results?: T[]; next?: string | null; count?: number };

function unwrapList<T>(data: Paginated<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

async function fetchAllPages<T>(url: string, params?: Record<string, unknown>): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const response = await apiClient.get<Paginated<T>>(url, { params: { ...params, page } });
    const data = response.data;
    if (Array.isArray(data)) return data;
    const results = data.results ?? [];
    all.push(...results);
    if (!data.next) break;
    page += 1;
  }
  return all;
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'Assets' | 'Liabilities' | 'Equity' | 'Income' | 'Expense';
  sub_type: string;
  level: number;
  parent?: string;
  parent_name?: string;
  balance: number;
  status: 'active' | 'inactive';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalLine {
  id?: string;
  account: string;
  account_name?: string;
  account_code?: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  date: string;
  reference?: string;
  description: string;
  type: 'Manual' | 'Sales' | 'Purchase' | 'Payment' | 'Receipt' | 'Adjustment';
  status: 'draft' | 'posted' | 'reversed';
  total_debit: number;
  total_credit: number;
  posted_by?: string;
  posted_by_name?: string;
  posted_date?: string;
  reversed_by?: string;
  reversed_by_name?: string;
  reversed_date?: string;
  reversal_entry?: string;
  lines: JournalLine[];
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  type: 'Current' | 'Savings' | 'Fixed' | 'Overdraft';
  branch?: string;
  swift_code?: string;
  gl_account: string;
  gl_account_name?: string;
  gl_account_code?: string;
  balance: number;
  last_reconciled?: string;
  status: 'active' | 'inactive' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  bank_account: string;
  bank_account_name?: string;
  date: string;
  reference: string;
  description: string;
  type: 'Opening' | 'Credit' | 'Debit' | 'Transfer';
  debit: number;
  credit: number;
  balance: number;
  reconciled: boolean;
  reconciled_date?: string;
  journal_entry?: string;
  journal_entry_number?: string;
  created_at: string;
  updated_at: string;
}

export interface TaxRule {
  id: string;
  name: string;
  type: 'VAT' | 'TDS' | 'Income Tax' | 'Other';
  rate: number;
  applicable_on: 'Sales' | 'Purchase' | 'Both';
  account: string;
  account_name?: string;
  account_code?: string;
  status: 'active' | 'inactive';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface VATReturn {
  id: string;
  return_number: string;
  period: string;
  from_date: string;
  to_date: string;
  output_tax: number;
  input_tax: number;
  net_payable: number;
  status: 'draft' | 'filed' | 'paid';
  filed_date?: string;
  paid_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  source: string;
}

// ============================================================================
// CHART OF ACCOUNTS API
// ============================================================================

export const accountsAPI = {
  // List all accounts
  list: async (params?: {
    type?: string;
    sub_type?: string;
    status?: string;
    parent?: string;
    search?: string;
    ordering?: string;
  }) => {
    return fetchAllPages<Account>('/accounting/accounts/', params);
  },

  // Get account by ID
  get: async (id: string) => {
    const response = await apiClient.get<Account>(`/accounting/accounts/${id}/`);
    return response.data;
  },

  // Create new account
  create: async (data: Partial<Account>) => {
    const response = await apiClient.post<Account>('/accounting/accounts/', data);
    return response.data;
  },

  // Update account
  update: async (id: string, data: Partial<Account>) => {
    const response = await apiClient.put<Account>(`/accounting/accounts/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<Account>) => {
    const response = await apiClient.patch<Account>(`/accounting/accounts/${id}/`, data);
    return response.data;
  },

  // Delete account
  delete: async (id: string) => {
    await apiClient.delete(`/accounting/accounts/${id}/`);
  },

  // Get account tree structure
  tree: async () => {
    const response = await apiClient.get<Account[]>('/accounting/accounts/tree/');
    return response.data;
  },

  // Get account ledger
  ledger: async (id: string, params?: { from_date?: string; to_date?: string }) => {
    const response = await apiClient.get<LedgerEntry[]>(`/accounting/accounts/${id}/ledger/`, { params });
    return response.data;
  },

  // Get trial balance
  trialBalance: async (params?: { as_of_date?: string }) => {
    const response = await apiClient.get<{
      as_of_date: string;
      accounts: Array<{
        id: string;
        code: string;
        name: string;
        type: string;
        level: number;
        debit: number;
        credit: number;
        balance: number;
      }>;
      total_debit: number;
      total_credit: number;
      is_balanced: boolean;
    }>('/accounting/accounts/trial_balance/', { params });
    return response.data;
  },

  // Get profit & loss statement
  profitLoss: async (params?: { from_date?: string; to_date?: string }) => {
    const response = await apiClient.get<{
      from_date: string;
      to_date: string;
      income: {
        accounts: Array<{
          id: string;
          code: string;
          name: string;
          sub_type: string;
          amount: number;
        }>;
        total: number;
      };
      expenses: {
        accounts: Array<{
          id: string;
          code: string;
          name: string;
          sub_type: string;
          amount: number;
        }>;
        total: number;
      };
      net_profit: number;
      net_margin: number;
    }>('/accounting/accounts/profit_loss/', { params });
    return response.data;
  },

  // Get balance sheet
  balanceSheet: async (params?: { as_of_date?: string }) => {
    const response = await apiClient.get<{
      as_of_date: string;
      assets: {
        current: Array<{
          id: string;
          code: string;
          name: string;
          sub_type: string;
          amount: number;
        }>;
        fixed: Array<{
          id: string;
          code: string;
          name: string;
          sub_type: string;
          amount: number;
        }>;
        other: Array<{
          id: string;
          code: string;
          name: string;
          sub_type: string;
          amount: number;
        }>;
        total_current: number;
        total_fixed: number;
        total_other: number;
        total: number;
      };
      liabilities: {
        current: Array<{
          id: string;
          code: string;
          name: string;
          sub_type: string;
          amount: number;
        }>;
        long_term: Array<{
          id: string;
          code: string;
          name: string;
          sub_type: string;
          amount: number;
        }>;
        other: Array<{
          id: string;
          code: string;
          name: string;
          sub_type: string;
          amount: number;
        }>;
        total_current: number;
        total_long_term: number;
        total_other: number;
        total: number;
      };
      equity: {
        accounts: Array<{
          id: string;
          code: string;
          name: string;
          sub_type: string;
          amount: number;
        }>;
        total: number;
      };
      total_liabilities_equity: number;
      is_balanced: boolean;
    }>('/accounting/accounts/balance_sheet/', { params });
    return response.data;
  },
};

// ============================================================================
// JOURNAL ENTRIES API
// ============================================================================

export const journalEntriesAPI = {
  // List all journal entries
  list: async (params?: {
    status?: string;
    type?: string;
    date?: string;
    search?: string;
    ordering?: string;
  }) => {
    return fetchAllPages<JournalEntry>('/accounting/journal-entries/', params);
  },

  // Get journal entry by ID
  get: async (id: string) => {
    const response = await apiClient.get<JournalEntry>(`/accounting/journal-entries/${id}/`);
    return response.data;
  },

  // Create new journal entry
  create: async (data: Partial<JournalEntry>) => {
    const response = await apiClient.post<JournalEntry>('/accounting/journal-entries/', data);
    return response.data;
  },

  // Update journal entry (draft only)
  update: async (id: string, data: Partial<JournalEntry>) => {
    const response = await apiClient.put<JournalEntry>(`/accounting/journal-entries/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<JournalEntry>) => {
    const response = await apiClient.patch<JournalEntry>(`/accounting/journal-entries/${id}/`, data);
    return response.data;
  },

  // Delete journal entry (draft only)
  delete: async (id: string) => {
    await apiClient.delete(`/accounting/journal-entries/${id}/`);
  },

  glIntegrationSummary: async () => {
    const response = await apiClient.get<{
      by_prefix: Record<string, number>;
      by_type: Record<string, number>;
      total_posted: number;
      checklist: Array<{ step: number; action: string; expect: string }>;
    }>('/accounting/journal-entries/gl-integration-summary/');
    return response.data;
  },

  // Post journal entry
  post: async (id: string) => {
    const response = await apiClient.post<JournalEntry>(`/accounting/journal-entries/${id}/post_entry/`);
    return response.data;
  },

  // Reverse journal entry
  reverse: async (id: string, date?: string) => {
    const response = await apiClient.post<JournalEntry>(`/accounting/journal-entries/${id}/reverse/`, { date });
    return response.data;
  },
};

// ============================================================================
// BANK ACCOUNTS API
// ============================================================================

export const bankAccountsAPI = {
  // List all bank accounts
  list: async (params?: {
    type?: string;
    status?: string;
    search?: string;
    ordering?: string;
  }) => {
    return fetchAllPages<BankAccount>('/accounting/bank-accounts/', params);
  },

  // Get bank account by ID
  get: async (id: string) => {
    const response = await apiClient.get<BankAccount>(`/accounting/bank-accounts/${id}/`);
    return response.data;
  },

  // Create new bank account
  create: async (data: Partial<BankAccount>) => {
    const response = await apiClient.post<BankAccount>('/accounting/bank-accounts/', data);
    return response.data;
  },

  // Update bank account
  update: async (id: string, data: Partial<BankAccount>) => {
    const response = await apiClient.put<BankAccount>(`/accounting/bank-accounts/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<BankAccount>) => {
    const response = await apiClient.patch<BankAccount>(`/accounting/bank-accounts/${id}/`, data);
    return response.data;
  },

  // Delete bank account
  delete: async (id: string) => {
    await apiClient.delete(`/accounting/bank-accounts/${id}/`);
  },

  // Get bank statement
  statement: async (id: string) => {
    const response = await apiClient.get<BankTransaction[] | Paginated<BankTransaction>>(`/accounting/bank-accounts/${id}/statement/`);
    return unwrapList(response.data);
  },
};

// ============================================================================
// BANK TRANSACTIONS API
// ============================================================================

export const bankTransactionsAPI = {
  // List all bank transactions
  list: async (params?: {
    bank_account?: string;
    type?: string;
    reconciled?: boolean;
    search?: string;
    ordering?: string;
  }) => {
    return fetchAllPages<BankTransaction>('/accounting/bank-transactions/', params);
  },

  // Get bank transaction by ID
  get: async (id: string) => {
    const response = await apiClient.get<BankTransaction>(`/accounting/bank-transactions/${id}/`);
    return response.data;
  },

  // Create new bank transaction
  create: async (data: Partial<BankTransaction>) => {
    const response = await apiClient.post<BankTransaction>('/accounting/bank-transactions/', data);
    return response.data;
  },

  // Update bank transaction
  update: async (id: string, data: Partial<BankTransaction>) => {
    const response = await apiClient.put<BankTransaction>(`/accounting/bank-transactions/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<BankTransaction>) => {
    const response = await apiClient.patch<BankTransaction>(`/accounting/bank-transactions/${id}/`, data);
    return response.data;
  },

  // Delete bank transaction
  delete: async (id: string) => {
    await apiClient.delete(`/accounting/bank-transactions/${id}/`);
  },

  // Reconcile transaction
  reconcile: async (id: string) => {
    const response = await apiClient.post<BankTransaction>(`/accounting/bank-transactions/${id}/reconcile/`);
    return response.data;
  },
};

// ============================================================================
// TAX RULES API
// ============================================================================

export const taxRulesAPI = {
  // List all tax rules
  list: async (params?: {
    type?: string;
    applicable_on?: string;
    status?: string;
    search?: string;
    ordering?: string;
  }) => {
    return fetchAllPages<TaxRule>('/accounting/tax-rules/', params);
  },

  // Get tax rule by ID
  get: async (id: string) => {
    const response = await apiClient.get<TaxRule>(`/accounting/tax-rules/${id}/`);
    return response.data;
  },

  // Create new tax rule
  create: async (data: Partial<TaxRule>) => {
    const response = await apiClient.post<TaxRule>('/accounting/tax-rules/', data);
    return response.data;
  },

  // Update tax rule
  update: async (id: string, data: Partial<TaxRule>) => {
    const response = await apiClient.put<TaxRule>(`/accounting/tax-rules/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<TaxRule>) => {
    const response = await apiClient.patch<TaxRule>(`/accounting/tax-rules/${id}/`, data);
    return response.data;
  },

  // Delete tax rule
  delete: async (id: string) => {
    await apiClient.delete(`/accounting/tax-rules/${id}/`);
  },
};

// ============================================================================
// VAT RETURNS API
// ============================================================================

export const vatReturnsAPI = {
  // List all VAT returns
  list: async (params?: {
    status?: string;
    search?: string;
    ordering?: string;
  }) => {
    return fetchAllPages<VATReturn>('/accounting/vat-returns/', params);
  },

  // Get VAT return by ID
  get: async (id: string) => {
    const response = await apiClient.get<VATReturn>(`/accounting/vat-returns/${id}/`);
    return response.data;
  },

  // Create new VAT return
  create: async (data: Partial<VATReturn>) => {
    const response = await apiClient.post<VATReturn>('/accounting/vat-returns/', data);
    return response.data;
  },

  // Update VAT return
  update: async (id: string, data: Partial<VATReturn>) => {
    const response = await apiClient.put<VATReturn>(`/accounting/vat-returns/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<VATReturn>) => {
    const response = await apiClient.patch<VATReturn>(`/accounting/vat-returns/${id}/`, data);
    return response.data;
  },

  // Delete VAT return
  delete: async (id: string) => {
    await apiClient.delete(`/accounting/vat-returns/${id}/`);
  },

  // File VAT return
  file: async (id: string) => {
    const response = await apiClient.post<VATReturn>(`/accounting/vat-returns/${id}/file/`);
    return response.data;
  },

  // Mark VAT return as paid
  markPaid: async (id: string) => {
    const response = await apiClient.post<VATReturn>(`/accounting/vat-returns/${id}/mark_paid/`);
    return response.data;
  },
};
