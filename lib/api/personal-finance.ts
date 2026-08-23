import apiClient from './client';

// ==================== TYPES ====================

export interface FinanceAccount {
  id: number;
  name: string;
  type: 'bank' | 'cash' | 'credit_card' | 'investment' | 'loan';
  type_display: string;
  opening_balance: string;
  current_balance: string;
  description?: string;
  bank_name?: string;
  account_number?: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceCategory {
  id: number;
  name: string;
  type: 'income' | 'expense';
  type_display: string;
  description?: string;
  transaction_count: number;
  created_at: string;
  updated_at: string;
}

export interface FinanceTransaction {
  id: number;
  transaction_number: string;
  date: string;
  type: 'income' | 'expense';
  type_display: string;
  amount: string;
  category: number;
  category_name?: string;
  category_type?: string;
  account: number;
  account_name?: string;
  account_type?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface FinanceBudget {
  id: number;
  name: string;
  category: number | null;
  category_name?: string;
  amount: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  period_display: string;
  start_date: string;
  end_date?: string | null;
  spent_amount: number;
  remaining_amount: number;
  created_at: string;
  updated_at: string;
}

export interface FinanceBill {
  id: number;
  bill_number: string;
  name: string;
  amount: string;
  due_date: string;
  category: number | null;
  category_name?: string;
  recurring: 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurring_display: string;
  status: 'unpaid' | 'paid' | 'pending' | 'overdue';
  status_display: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PartyLender {
  id: number;
  name: string;
  pan?: string;
  mobile?: string;
  email?: string;
  photo?: File | string | null;
  photo_url?: string | null;
  total_given: number;
  total_received: number;
  net_balance: number;
  share_token?: string;
  created_at: string;
  updated_at: string;
}

export interface PartyTransaction {
  id: number;
  party: number;
  party_name: string;
  direction: 'in' | 'out';
  direction_display: string;
  amount: string;
  date: string;
  payment_method?: 'cash' | 'esewa' | 'bank' | null;
  payment_method_display?: string;
  receipt?: File | string | null;
  receipt_url?: string | null;
  note?: string;
  share_token?: string;
  created_at: string;
  updated_at: string;
}

export interface PartyTransactionShare {
  id: number;
  token: string;
  share_type: 'transaction' | 'party_ledger';
  share_type_display: string;
  is_active: boolean;
  expires_at?: string | null;
  transaction_data?: PartyTransaction | null;
  party_data?: PartyLender | null;
  created_at: string;
}

// ==================== API ENDPOINTS ====================

// Parties/Lenders API
export const partyLenderAPI = {
  list: async () => {
    const response = await apiClient.get<{ results: PartyLender[] }>('/finance/parties/');
    return response.data.results;
  },
  get: async (id: number) => {
    const response = await apiClient.get<PartyLender>(`/finance/parties/${id}/`);
    return response.data;
  },
  create: async (data: FormData | Partial<PartyLender>) => {
    const response = await apiClient.post<PartyLender>('/finance/parties/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },
  update: async (id: number, data: FormData | Partial<PartyLender>) => {
    const response = await apiClient.put<PartyLender>(`/finance/parties/${id}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/finance/parties/${id}/`);
  },
};

// Party Transactions API (In/Out)
export const partyTransactionAPI = {
  list: async () => {
    const response = await apiClient.get<{ results: PartyTransaction[] }>('/finance/party-transactions/');
    return response.data.results;
  },
  get: async (id: number) => {
    const response = await apiClient.get<PartyTransaction>(`/finance/party-transactions/${id}/`);
    return response.data;
  },
  create: async (data: FormData | Partial<PartyTransaction>) => {
    const response = await apiClient.post<PartyTransaction>('/finance/party-transactions/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },
  update: async (id: number, data: FormData | Partial<PartyTransaction>) => {
    const response = await apiClient.put<PartyTransaction>(`/finance/party-transactions/${id}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/finance/party-transactions/${id}/`);
  },
};

// Party Transaction Shares API (Read-only links)
export const partyTransactionShareAPI = {
  list: async () => {
    const response = await apiClient.get<{ results: PartyTransactionShare[] }>('/finance/party-shares/');
    return response.data.results;
  },
  get: async (id: number) => {
    const response = await apiClient.get<PartyTransactionShare>(`/finance/party-shares/${id}/`);
    return response.data;
  },
  create: async (data: { share_type: 'transaction' | 'party_ledger'; transaction?: number; party?: number; is_active: boolean }) => {
    const response = await apiClient.post<PartyTransactionShare>('/finance/party-shares/', data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/finance/party-shares/${id}/`);
  },
};

// Accounts API
export const financeAccountAPI = {
  list: async () => {
    const response = await apiClient.get<{ results: FinanceAccount[] }>('/finance/accounts/');
    return response.data.results;
  },
  get: async (id: number) => {
    const response = await apiClient.get<FinanceAccount>(`/finance/accounts/${id}/`);
    return response.data;
  },
  create: async (data: Partial<FinanceAccount>) => {
    const response = await apiClient.post<FinanceAccount>('/finance/accounts/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<FinanceAccount>) => {
    const response = await apiClient.put<FinanceAccount>(`/finance/accounts/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/finance/accounts/${id}/`);
  },
};

// Categories API
export const financeCategoryAPI = {
  list: async () => {
    const response = await apiClient.get<{ results: FinanceCategory[] }>('/finance/categories/');
    return response.data.results;
  },
  get: async (id: number) => {
    const response = await apiClient.get<FinanceCategory>(`/finance/categories/${id}/`);
    return response.data;
  },
  create: async (data: Partial<FinanceCategory>) => {
    const response = await apiClient.post<FinanceCategory>('/finance/categories/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<FinanceCategory>) => {
    const response = await apiClient.put<FinanceCategory>(`/finance/categories/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/finance/categories/${id}/`);
  },
};

// Transactions API
export const financeTransactionAPI = {
  list: async () => {
    const response = await apiClient.get<{ results: FinanceTransaction[] }>('/finance/transactions/');
    return response.data.results;
  },
  get: async (id: number) => {
    const response = await apiClient.get<FinanceTransaction>(`/finance/transactions/${id}/`);
    return response.data;
  },
  create: async (data: Partial<FinanceTransaction>) => {
    const response = await apiClient.post<FinanceTransaction>('/finance/transactions/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<FinanceTransaction>) => {
    const response = await apiClient.put<FinanceTransaction>(`/finance/transactions/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/finance/transactions/${id}/`);
  },
  summary: async () => {
    const response = await apiClient.get<{
      total_income: number;
      total_expenses: number;
      net_balance: number;
      transaction_count: number;
    }>('/finance/transactions/summary/');
    return response.data;
  },
};

// Budgets API
export const financeBudgetAPI = {
  list: async () => {
    const response = await apiClient.get<{ results: FinanceBudget[] }>('/finance/budgets/');
    return response.data.results;
  },
  get: async (id: number) => {
    const response = await apiClient.get<FinanceBudget>(`/finance/budgets/${id}/`);
    return response.data;
  },
  create: async (data: Partial<FinanceBudget>) => {
    const response = await apiClient.post<FinanceBudget>('/finance/budgets/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<FinanceBudget>) => {
    const response = await apiClient.put<FinanceBudget>(`/finance/budgets/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/finance/budgets/${id}/`);
  },
};

// Bills API
export const financeBillAPI = {
  list: async () => {
    const response = await apiClient.get<{ results: FinanceBill[] }>('/finance/bills/');
    return response.data.results;
  },
  get: async (id: number) => {
    const response = await apiClient.get<FinanceBill>(`/finance/bills/${id}/`);
    return response.data;
  },
  create: async (data: Partial<FinanceBill>) => {
    const response = await apiClient.post<FinanceBill>('/finance/bills/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<FinanceBill>) => {
    const response = await apiClient.put<FinanceBill>(`/finance/bills/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/finance/bills/${id}/`);
  },
  upcoming: async () => {
    const response = await apiClient.get<FinanceBill[]>('/finance/bills/upcoming/');
    return response.data;
  },
};

// Types for Personal Finance Dashboard
export interface PersonalFinanceDashboardData {
  summary: {
    total_balance: number;
    total_investments: number;
    total_debt: number;
    upcoming_renewals: number;
  };
  netWorthTrend: Array<{ month: string; value: number }>;
  alerts: Array<{
    type: 'emi' | 'insurance' | 'over_budget' | 'tax';
    message: string;
    amount?: number;
    date?: string;
  }>;
  activities: Array<{
    type: 'transaction' | 'account' | 'budget' | 'bill' | 'category';
    action: 'created' | 'updated' | 'deleted';
    description: string;
    timestamp: string;
    amount?: number;
  }>;
  topAccounts: Array<{
    name: string;
    balance: number;
    type: string;
  }>;
}

export const personalFinanceDashboardAPI = {
  get: async (): Promise<PersonalFinanceDashboardData> => {
    // TODO: Replace with actual API endpoints when backend is ready
    // For now, returning mock data matching the structure
    
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock data for development
    return {
      summary: {
        total_balance: 150000,
        total_investments: 250000,
        total_debt: 50000,
        upcoming_renewals: 3,
      },
      netWorthTrend: [
        { month: 'Jan', value: 320000 },
        { month: 'Feb', value: 335000 },
        { month: 'Mar', value: 340000 },
        { month: 'Apr', value: 350000 },
        { month: 'May', value: 350000 },
      ],
      alerts: [
        {
          type: 'emi',
          message: 'Home Loan EMI due in 3 days',
          amount: 15000,
          date: '2026-08-16',
        },
        {
          type: 'insurance',
          message: 'Health Insurance renewal due',
          amount: 12000,
          date: '2026-08-20',
        },
        {
          type: 'over_budget',
          message: 'Shopping budget exceeded by 15%',
          amount: 3000,
        },
      ],
      activities: [
        {
          type: 'transaction',
          action: 'created',
          description: 'Added expense: Grocery Shopping',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          amount: 2500,
        },
        {
          type: 'account',
          action: 'created',
          description: 'Created new account: Emergency Fund',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        },
        {
          type: 'budget',
          action: 'updated',
          description: 'Updated budget: Monthly Groceries',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          amount: 15000,
        },
        {
          type: 'transaction',
          action: 'created',
          description: 'Added income: Salary Payment',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          amount: 50000,
        },
        {
          type: 'category',
          action: 'created',
          description: 'Created new category: Entertainment',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        },
        {
          type: 'bill',
          action: 'created',
          description: 'Added recurring bill: Internet',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
          amount: 1200,
        },
      ],
      topAccounts: [
        { name: 'Savings Account - ABC Bank', balance: 85000, type: 'bank' },
        { name: 'Salary Account - XYZ Bank', balance: 45000, type: 'bank' },
        { name: 'Cash Wallet', balance: 15000, type: 'wallet' },
        { name: 'Emergency Fund', balance: 5000, type: 'cash' },
      ],
    };
  },
};
