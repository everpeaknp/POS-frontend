import apiClient from './client';

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
      topAccounts: [
        { name: 'Savings Account - ABC Bank', balance: 85000, type: 'bank' },
        { name: 'Salary Account - XYZ Bank', balance: 45000, type: 'bank' },
        { name: 'Cash Wallet', balance: 15000, type: 'wallet' },
        { name: 'Emergency Fund', balance: 5000, type: 'cash' },
      ],
    };
  },
};
