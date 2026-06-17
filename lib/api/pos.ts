/**
 * POS API Client
 * Handles all API calls for the Point of Sale module
 */

import apiClient from './client';

export interface POSSession {
  id: string;
  session_number: string;
  cashier: string;
  cashier_name: string;
  warehouse?: string | null;
  warehouse_name?: string;
  opened_at: string;
  closed_at?: string | null;
  opening_cash: number;
  closing_cash?: number | null;
  expected_cash: number;
  cash_variance: number;
  total_transactions: number;
  total_sales: number;
  cash_sales: number;
  card_sales: number;
  upi_sales: number;
  credit_sales: number;
  status: 'open' | 'closed';
  notes?: string;
  created_at: string;
}

export interface POSDiscount {
  id: string;
  name: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  apply_to: 'item' | 'bill' | 'category';
  category?: string;
  product?: string;
  start_date?: string;
  end_date?: string;
  min_quantity: number;
  min_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface POSTransactionLine {
  id?: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total?: number;
}

export interface POSTransaction {
  id?: string;
  transaction_number?: string;
  date?: string;
  customer?: string | null;
  customer_name?: string;
  customer_display?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  payment_method: 'cash' | 'card' | 'upi' | 'credit';
  amount_paid: number;
  change_given?: number;
  status?: 'completed' | 'cancelled' | 'refunded';
  cashier?: string;
  cashier_name?: string;
  warehouse?: string | null;
  notes?: string;
  lines: POSTransactionLine[];
  created_at?: string;
}

export interface POSDailySalesReport {
  id: string;
  date: string;
  cashier?: string;
  cashier_name?: string;
  warehouse?: string;
  warehouse_name?: string;
  total_transactions: number;
  total_items_sold: number;
  gross_sales: number;
  total_discounts: number;
  total_tax: number;
  net_sales: number;
  cash_sales: number;
  card_sales: number;
  upi_sales: number;
  credit_sales: number;
  cancelled_transactions: number;
  refunded_amount: number;
  generated_at: string;
  generated_by?: string;
}

export interface POSProduct {
  id: string;
  name: string;
  sku: string;
  selling_price: number;
  stock_quantity: number;
  category_name?: string;
  unit_name?: string;
  status: string;
}

const posApi = {
  // Discounts
  getDiscounts: async (): Promise<POSDiscount[]> => {
    const response = await apiClient.get('/pos/discounts/');
    return response.data.results || response.data;
  },

  getActiveDiscounts: async (): Promise<POSDiscount[]> => {
    const response = await apiClient.get('/pos/discounts/active/');
    return response.data;
  },

  createDiscount: async (data: Partial<POSDiscount>): Promise<POSDiscount> => {
    const response = await apiClient.post('/pos/discounts/', data);
    return response.data;
  },

  updateDiscount: async (id: string, data: Partial<POSDiscount>): Promise<POSDiscount> => {
    const response = await apiClient.patch(`/pos/discounts/${id}/`, data);
    return response.data;
  },

  deleteDiscount: async (id: string): Promise<void> => {
    await apiClient.delete(`/pos/discounts/${id}/`);
  },

  // Transactions
  getTransactions: async (params?: {
    status?: string;
    payment_method?: string;
    search?: string;
    page?: number;
  }): Promise<{ results: POSTransaction[]; count: number }> => {
    const response = await apiClient.get('/pos/transactions/', { params });
    return response.data;
  },

  getTransaction: async (id: string): Promise<POSTransaction> => {
    const response = await apiClient.get(`/pos/transactions/${id}/`);
    return response.data;
  },

  createTransaction: async (data: POSTransaction): Promise<POSTransaction> => {
    const response = await apiClient.post('/pos/transactions/', data);
    return response.data;
  },

  cancelTransaction: async (id: string): Promise<POSTransaction> => {
    const response = await apiClient.post(`/pos/transactions/${id}/cancel/`);
    return response.data;
  },

  getTodayTransactions: async (): Promise<POSTransaction[]> => {
    const response = await apiClient.get('/pos/transactions/today/');
    return response.data;
  },

  // Products
  searchProducts: async (search: string): Promise<POSProduct[]> => {
    const response = await apiClient.get('/pos/products/', {
      params: { search }
    });
    return response.data.results || response.data;
  },

  searchByBarcode: async (barcode: string): Promise<POSProduct> => {
    const response = await apiClient.get('/pos/products/barcode/', {
      params: { barcode }
    });
    return response.data;
  },

  // Reports
  getDailySalesReports: async (params?: {
    date?: string;
    cashier?: string;
    warehouse?: string;
  }): Promise<{ results: POSDailySalesReport[]; count: number }> => {
    const response = await apiClient.get('/pos/reports/', { params });
    return response.data;
  },

  generateDailySalesReport: async (data: {
    date: string;
    cashier_id?: number;
    warehouse_id?: number;
  }): Promise<POSDailySalesReport> => {
    const response = await apiClient.post('/pos/reports/generate/', data);
    return response.data;
  },

  // Sessions
  getSessions: async (params?: {
    status?: string;
    cashier?: string;
    page?: number;
  }): Promise<{ results: POSSession[]; count: number }> => {
    const response = await apiClient.get('/pos/sessions/', { params });
    return response.data;
  },

  getSession: async (id: string): Promise<POSSession> => {
    const response = await apiClient.get(`/pos/sessions/${id}/`);
    return response.data;
  },

  createSession: async (data: {
    opening_cash: number;
    warehouse?: string | null;
    notes?: string;
  }): Promise<POSSession> => {
    const response = await apiClient.post('/pos/sessions/', data);
    return response.data;
  },

  closeSession: async (id: string, closing_cash: number): Promise<POSSession> => {
    const response = await apiClient.post(`/pos/sessions/${id}/close/`, {
      closing_cash
    });
    return response.data;
  },
};

export default posApi;
