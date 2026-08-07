/**
 * POS API Client
 * Handles all API calls for the Point of Sale module
 */

import apiClient from './client';
import { POS_LIST_PARAMS, unwrapList } from './pos-helpers';

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
  esewa_sales: number;
  khalti_sales: number;
  fonepay_sales: number;
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
  payment_method: 'cash' | 'card' | 'esewa' | 'khalti' | 'fonepay' | 'credit';
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
  esewa_sales: number;
  khalti_sales: number;
  fonepay_sales: number;
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
  category_id?: number;
  category_name?: string;
  unit_name?: string;
  status: string;
}

export interface POSHeldOrder {
  id: string;
  session: string;
  session_number?: string;
  customer?: string | null;
  customer_name?: string;
  items: any[];
  held_at: string;
  notes?: string;
}

export interface POSCashMovement {
  id: string;
  session: string;
  session_number?: string;
  movement_type: 'in' | 'out';
  amount: number;
  reason: string;
  notes?: string;
  created_at: string;
  created_by?: string;
  created_by_name?: string;
}

export interface POSLoyaltyProgram {
  id: string;
  name: string;
  points_per_rupee: number;
  rupees_per_point: number;
  is_active: boolean;
}

export interface POSCustomerLoyalty {
  id: string;
  customer: string;
  customer_name?: string;
  points_balance: number;
  total_earned: number;
  total_redeemed: number;
  last_transaction_date?: string;
}

export interface POSRefund {
  id: string;
  refund_number: string;
  original_transaction: string;
  original_transaction_number?: string;
  refund_transaction?: string;
  refund_transaction_number?: string;
  reason: string;
  refund_method: string;
  total_refund_amount: number;
  status: string;
  created_at: string;
  created_by?: string;
  created_by_name?: string;
  lines: POSRefundLine[];
}

export interface POSRefundLine {
  id: string;
  original_line: string;
  product_name?: string;
  quantity: number;
  refund_amount: number;
}

export interface POSPaymentEntry {
  payment_method: 'cash' | 'card' | 'esewa' | 'khalti' | 'fonepay' | 'credit';
  amount: number;
}

export const POS_PAGE_SIZE = 25;

const posApi = {
  // Discounts
  getDiscounts: async (): Promise<POSDiscount[]> => {
    const response = await apiClient.get('/pos/discounts/', { params: POS_LIST_PARAMS });
    return unwrapList(response.data);
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
    page_size?: number;
  }): Promise<{ results: POSTransaction[]; count: number }> => {
    const response = await apiClient.get('/pos/transactions/', {
      params: { page_size: POS_PAGE_SIZE, ...params },
    });
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

  getTransactionByNumber: async (transactionNumber: string): Promise<POSTransaction> => {
    const response = await apiClient.get(`/pos/transactions/by-number/${transactionNumber}/`);
    return response.data;
  },

  // Products
  searchProducts: async (search: string, warehouse?: string): Promise<POSProduct[]> => {
    const response = await apiClient.get('/pos/products/', {
      params: { search, ...(warehouse ? { warehouse } : {}), ...POS_LIST_PARAMS },
    });
    return unwrapList(response.data);
  },

  searchByBarcode: async (barcode: string, warehouse?: string): Promise<POSProduct> => {
    const response = await apiClient.get('/pos/products/barcode/', {
      params: { barcode, ...(warehouse ? { warehouse } : {}) },
    });
    return response.data;
  },

  // Reports
  getDailySalesReports: async (params?: {
    date?: string;
    cashier?: string;
    warehouse?: string;
  }): Promise<{ results: POSDailySalesReport[]; count: number }> => {
    const response = await apiClient.get('/pos/reports/', {
      params: { ...POS_LIST_PARAMS, ...params },
    });
    const results = unwrapList<POSDailySalesReport>(response.data);
    const count = Array.isArray(response.data) ? results.length : response.data.count ?? results.length;
    return { results, count };
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
    page_size?: number;
  }): Promise<{ results: POSSession[]; count: number }> => {
    const response = await apiClient.get('/pos/sessions/', {
      params: { ...POS_LIST_PARAMS, ...params },
    });
    const results = unwrapList<POSSession>(response.data);
    const count = Array.isArray(response.data) ? results.length : response.data.count ?? results.length;
    return { results, count };
  },

  getOpenSession: async (): Promise<POSSession | null> => {
    try {
      const response = await apiClient.get<POSSession>('/pos/sessions/my-open/');
      return response.data;
    } catch {
      return null;
    }
  },

  getSession: async (id: string): Promise<POSSession> => {
    const response = await apiClient.get<POSSession>(`/pos/sessions/${id}/`);
    return response.data;
  },

  createSession: async (data: {
    opening_cash: number;
    warehouse?: number | null;
    notes?: string;
  }): Promise<POSSession> => {
    const response = await apiClient.post('/pos/sessions/', data);
    return response.data;
  },

  closeSession: async (
    id: string,
    closing_cash: number,
    notes?: string,
  ): Promise<POSSession> => {
    const response = await apiClient.post(`/pos/sessions/${id}/close/`, {
      closing_cash,
      ...(notes ? { notes } : {}),
    });
    return response.data;
  },

  // Held Orders
  getHeldOrders: async (): Promise<POSHeldOrder[]> => {
    const response = await apiClient.get('/pos/held-orders/', { params: POS_LIST_PARAMS });
    return unwrapList(response.data);
  },

  createHeldOrder: async (data: {
    customer?: string | null;
    customer_name?: string;
    items: any[];
    notes?: string;
  }): Promise<POSHeldOrder> => {
    const response = await apiClient.post('/pos/held-orders/', data);
    return response.data;
  },

  deleteHeldOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/pos/held-orders/${id}/`);
  },

  // Cash Movements
  getCashMovements: async (session_id?: string): Promise<POSCashMovement[]> => {
    const response = await apiClient.get('/pos/cash-movements/', {
      params: { ...(session_id ? { session: session_id } : {}), ...POS_LIST_PARAMS },
    });
    return unwrapList(response.data);
  },

  createCashMovement: async (data: {
    movement_type: 'in' | 'out';
    amount: number;
    reason: string;
    notes?: string;
  }): Promise<POSCashMovement> => {
    const response = await apiClient.post('/pos/cash-movements/', data);
    return response.data;
  },

  // Loyalty
  getLoyaltyProgram: async (): Promise<POSLoyaltyProgram | null> => {
    try {
      const response = await apiClient.get('/pos/loyalty/program/');
      return response.data;
    } catch {
      return null;
    }
  },

  getCustomerLoyalty: async (customerId: string): Promise<POSCustomerLoyalty | null> => {
    try {
      const response = await apiClient.get(`/pos/loyalty/customers/${customerId}/`);
      return response.data;
    } catch {
      return null;
    }
  },

  // Refunds
  getRefunds: async (): Promise<POSRefund[]> => {
    const response = await apiClient.get('/pos/refunds/', { params: POS_LIST_PARAMS });
    return unwrapList(response.data);
  },

  createRefund: async (data: {
    original_transaction: string;
    reason: string;
    refund_method: string;
    lines: {
      original_line: string;
      quantity: number;
      refund_amount: number;
    }[];
  }): Promise<POSRefund> => {
    const response = await apiClient.post('/pos/refunds/', data);
    return response.data;
  },
};

export default posApi;
