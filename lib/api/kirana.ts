import apiClient from './client';
import { salesDashboardAPI } from './sales';
import { inventoryDashboardAPI } from './inventory';
import { bankAccountsAPI, accountsAPI } from './accounting';

export interface KiranaDashboardSummary {
  today_sales: number;
  cash_in_hand: number;
  bank_balance: number;
  total_stock_value: number;
  low_stock_count: number;
}

export interface KiranaDashboardData {
  summary: KiranaDashboardSummary;
  salesTrend: Array<{ date: string; sales: number }>;
  recentActivities: Array<{
    id: string;
    action: string;
    timestamp: string;
  }>;
  alerts: Array<{
    id: string;
    message: string;
    type: 'warning' | 'info' | 'error';
  }>;
  topSellingItems: Array<{
    name: string;
    quantity: number;
    sales: number;
  }>;
}

export const kiranaDashboardAPI = {
  get: async (): Promise<KiranaDashboardData> => {
    try {
      // Fetch all required data in parallel
      const [salesRes, inventoryRes, bankAccountsRes, chartAccountRes] =
        await Promise.all([
          salesDashboardAPI.get('today').catch(() => ({
            summary: { total_sales: 0 },
            sales_trend: [],
          })),
          inventoryDashboardAPI.get().catch(() => ({
            summary: { total_stock_value: 0 },
            lowStockItems: [],
          })),
          bankAccountsAPI.list().catch(() => []),
          accountsAPI.list({ account_type: 'asset' }).catch(() => []),
        ]);

      // Extract cash in hand from chart of accounts (1000 = Cash in Hand)
      const cashAccount = chartAccountRes.find((acc) => acc.code === '1000');
      const cashInHand = cashAccount?.balance || 0;

      // Calculate bank balance from bank accounts
      const bankBalance = bankAccountsRes.reduce(
        (sum, account) => sum + (account.balance || 0),
        0
      );

      // Extract inventory data
      const totalStockValue = inventoryRes.valuation?.total_stock_value || 0;
      const lowStockCount = inventoryRes.lowStockItems?.length || 0;

      // Extract today's sales
      const todaySales = salesRes.summary?.total_sales || 0;

      // Generate sales trend for the week (mock data for now)
      const today = new Date();
      const salesTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          sales: Math.floor(Math.random() * 5000),
        };
      });

      // Mock recent activities and alerts for now
      const recentActivities = [
        {
          id: '1',
          action: 'Sold 5x Wai Wai',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          action: 'Stocked 20x Rice 10kg',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          action: 'Purchased from Supplier',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const alerts = [
        {
          id: '1',
          message: 'Rice stock running low',
          type: 'warning' as const,
        },
        {
          id: '2',
          message: 'Udhaaro from Raja pending',
          type: 'info' as const,
        },
      ];

      const topSellingItems = [
        { name: 'Wai Wai Noodles', quantity: 45, sales: 2700 },
        { name: 'Rice (1kg)', quantity: 32, sales: 1920 },
        { name: 'Dal (1kg)', quantity: 28, sales: 1960 },
      ];

      return {
        summary: {
          today_sales: todaySales,
          cash_in_hand: cashInHand,
          bank_balance: bankBalance,
          total_stock_value: totalStockValue,
          low_stock_count: lowStockCount,
        },
        salesTrend,
        recentActivities,
        alerts,
        topSellingItems,
      };
    } catch (error) {
      console.error('Error fetching kirana dashboard data:', error);
      // Return default data on error
      return {
        summary: {
          today_sales: 0,
          cash_in_hand: 0,
          bank_balance: 0,
          total_stock_value: 0,
          low_stock_count: 0,
        },
        salesTrend: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(new Date().setDate(new Date().getDate() - (6 - i)))
            .toISOString()
            .split('T')[0],
          sales: 0,
        })),
        recentActivities: [],
        alerts: [],
        topSellingItems: [],
      };
    }
  },
};
