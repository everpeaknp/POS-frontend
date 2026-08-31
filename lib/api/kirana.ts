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
      const [salesRes, inventoryRes, bankAccountsRes, chartAccountRes, posTransactionsRes] =
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
          // Fetch recent POS transactions
          apiClient.get('/pos/transactions/', { params: { limit: 10, ordering: '-created_at' } }).catch(() => ({ data: { results: [] } })),
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
      const lowStockItems = inventoryRes.lowStockItems || [];
      const lowStockCount = lowStockItems.length;

      // Extract today's sales
      const todaySales = salesRes.summary?.total_sales || 0;

      // Generate sales trend for the week (mock data for now - TODO: implement real trend data)
      const today = new Date();
      const salesTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          sales: Math.floor(Math.random() * 5000),
        };
      });

      // Build real recent activities from POS transactions
      const transactions = posTransactionsRes.data?.results || [];
      const recentActivities = transactions.slice(0, 5).map((txn: any, idx: number) => ({
        id: txn.id || `${idx}`,
        action: `Sale #${txn.transaction_number || 'N/A'} - Rs. ${Number(txn.total || 0).toFixed(2)}`,
        timestamp: txn.created_at || new Date().toISOString(),
      }));

      // Build real alerts from low stock items
      const alerts: Array<{ id: string; message: string; type: 'warning' | 'info' | 'error' }> = [];
      
      // Add low stock alerts
      lowStockItems.slice(0, 3).forEach((item: any, idx: number) => {
        alerts.push({
          id: `low-stock-${idx}`,
          message: `${item.name || 'Product'} stock is low (${item.current_stock || 0} remaining)`,
          type: 'warning',
        });
      });

      // If no alerts, add a success message
      if (alerts.length === 0) {
        alerts.push({
          id: 'all-good',
          message: 'All systems running smoothly',
          type: 'info',
        });
      }

      // Calculate top selling items from transactions
      const itemSales: Record<string, { name: string; quantity: number; sales: number }> = {};
      
      transactions.forEach((txn: any) => {
        if (txn.items && Array.isArray(txn.items)) {
          txn.items.forEach((item: any) => {
            const productName = item.product_name || item.product?.name || 'Unknown Product';
            const quantity = item.quantity || 0;
            const total = item.total || 0;
            
            if (!itemSales[productName]) {
              itemSales[productName] = { name: productName, quantity: 0, sales: 0 };
            }
            
            itemSales[productName].quantity += quantity;
            itemSales[productName].sales += total;
          });
        }
      });

      // Convert to array and sort by sales
      const topSellingItems = Object.values(itemSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

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
