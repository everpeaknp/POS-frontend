import apiClient from './client';

// Types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  pan?: string;
  address?: string;
  type: 'Individual' | 'Business';
  credit_limit: number;
  current_balance: number;
  payment_terms: 'Immediate' | 'Net 15' | 'Net 30' | 'Net 60';
  status: 'active' | 'inactive';
  total_orders: number;
  total_spent: number;
  is_over_limit?: boolean;
  available_credit?: number;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderLine {
  id?: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  amount: number;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  date: string;
  customer: string;
  customer_name?: string;
  reference?: string;
  status: 'Draft' | 'Confirmed' | 'Delivered' | 'Cancelled';
  payment_type?: 'cash' | 'credit';
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  items_count?: number;
  lines?: SalesOrderLine[];
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}


export interface QuotationLine {
  id?: string;
  product: string | number;
  product_name?: string;
  product_sku?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  amount?: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  date: string;
  customer: string | number;
  customer_name?: string;
  valid_until: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Expired';
  notes?: string;
  items_count?: number;
  lines?: QuotationLine[];
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  due_date: string;
  customer: string;
  customer_name?: string;
  sales_order?: string;
  amount: number;
  paid_amount: number;
  balance: number;
  payment_type: 'cash' | 'credit';
  status: 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue';
  notes?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditNote {
  id: string;
  credit_note_number: string;
  date: string;
  customer: string;
  customer_name?: string;
  invoice: string;
  invoice_number?: string;
  amount: number;
  reason: string;
  status: 'Draft' | 'Issued' | 'Applied';
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// API Response types
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Customer API
export const customerAPI = {
  list: (params?: any) => 
    apiClient.get<PaginatedResponse<Customer>>('/sales/customers/', { params }),
  
  get: (id: string) => 
    apiClient.get<Customer>(`/sales/customers/${id}/`),
  
  create: (data: Partial<Customer>) => 
    apiClient.post<Customer>('/sales/customers/', data),
  
  update: (id: string, data: Partial<Customer>) => 
    apiClient.put<Customer>(`/sales/customers/${id}/`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/sales/customers/${id}/`),
};


// Sales Order API
export const salesOrderAPI = {
  list: (params?: any) => 
    apiClient.get<PaginatedResponse<SalesOrder>>('/sales/orders/', { params }),
  
  get: (id: string) => 
    apiClient.get<SalesOrder>(`/sales/orders/${id}/`),
  
  create: (data: Partial<SalesOrder> & { lines: SalesOrderLine[] }) => 
    apiClient.post<SalesOrder>('/sales/orders/', data),
  
  update: (id: string, data: Partial<SalesOrder> & { lines?: SalesOrderLine[] }) => 
    apiClient.put<SalesOrder>(`/sales/orders/${id}/`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/sales/orders/${id}/`),
  
  updateStatus: (id: string, status: string) => 
    apiClient.patch<SalesOrder>(`/sales/orders/${id}/update_status/`, { status }),
  
  finalizeOnCredit: (id: string) => 
    apiClient.post<{ invoice: Invoice; ledger_entry: CustomerLedger }>(`/sales/orders/${id}/finalize_on_credit/`),
};

// Quotation API
export const quotationAPI = {
  list: (params?: any) => 
    apiClient.get<PaginatedResponse<Quotation>>('/sales/quotations/', { params }),
  
  get: (id: string) => 
    apiClient.get<Quotation>(`/sales/quotations/${id}/`),
  
  create: (data: Partial<Quotation> & { lines: QuotationLine[] }) => 
    apiClient.post<Quotation>('/sales/quotations/', data),
  
  update: (id: string, data: Partial<Quotation> & { lines?: QuotationLine[] }) => 
    apiClient.patch<Quotation>(`/sales/quotations/${id}/`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/sales/quotations/${id}/`),
  
  convertToOrder: (id: string) => 
    apiClient.post<SalesOrder>(`/sales/quotations/${id}/convert_to_order/`),
};

// Invoice API
export const invoiceAPI = {
  list: (params?: any) => 
    apiClient.get<PaginatedResponse<Invoice>>('/sales/invoices/', { params }),
  
  get: (id: string) => 
    apiClient.get<Invoice>(`/sales/invoices/${id}/`),
  
  create: (data: Partial<Invoice>) => 
    apiClient.post<Invoice>('/sales/invoices/', data),
  
  update: (id: string, data: Partial<Invoice>) => 
    apiClient.put<Invoice>(`/sales/invoices/${id}/`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/sales/invoices/${id}/`),
  
  recordPayment: (id: string, data: {
    amount: number;
    date?: string;
    payment_method?: string;
    reference_number?: string;
    notes?: string;
  }) => 
    apiClient.post<Invoice>(`/sales/invoices/${id}/record_payment/`, data),
};

// Credit Note API
export const creditNoteAPI = {
  list: (params?: any) => 
    apiClient.get<PaginatedResponse<CreditNote>>('/sales/credit-notes/', { params }),
  
  get: (id: string) => 
    apiClient.get<CreditNote>(`/sales/credit-notes/${id}/`),
  
  create: (data: Partial<CreditNote>) => 
    apiClient.post<CreditNote>('/sales/credit-notes/', data),
  
  update: (id: string, data: Partial<CreditNote>) => 
    apiClient.put<CreditNote>(`/sales/credit-notes/${id}/`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/sales/credit-notes/${id}/`),
};


// ============================================================================
// CUSTOMER LEDGER & CREDIT SYSTEM
// ============================================================================

export interface CustomerLedger {
  id: string;
  customer: string;
  customer_name?: string;
  date: string;
  transaction_type: 'sale' | 'payment' | 'return' | 'adjustment';
  reference_type: string;
  reference_number: string;
  reference_id?: number;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
  description?: string;
  created_at: string;
}

export interface PaymentReceived {
  id: string;
  payment_number: string;
  date: string;
  customer: string;
  customer_name?: string;
  amount: number;
  payment_method: 'cash' | 'bank' | 'esewa' | 'khalti' | 'fonepay' | 'cheque' | 'other';
  reference_number?: string;
  bank_name?: string;
  invoice?: string;
  invoice_number?: string;
  notes?: string;
  received_by?: string;
  received_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AgingReport {
  customer_id: string;
  customer_name: string;
  total_outstanding: number;
  current: number;
  days_30_60: number;
  days_60_90: number;
  days_90_plus: number;
  overdue_invoices: Array<{
    invoice_number: string;
    date: string;
    due_date: string;
    amount: number;
    paid_amount: number;
    balance: number;
    days_overdue: number;
  }>;
  credit_limit: number;
  available_credit: number;
  is_over_limit: boolean;
}

// Customer Ledger API
export const customerLedgerAPI = {
  // List all ledger entries
  list: async (params?: {
    customer?: string;
    transaction_type?: string;
    date?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get<CustomerLedger[]>('/sales/ledger/', { params });
    return response.data;
  },

  // Get ledger entry by ID
  get: async (id: string) => {
    const response = await apiClient.get<CustomerLedger>(`/sales/ledger/${id}/`);
    return response.data;
  },
};

// Payment Received API
export const paymentReceivedAPI = {
  // List all payments
  list: async (params?: {
    customer?: string;
    payment_method?: string;
    date?: string;
    invoice?: string;
    search?: string;
    ordering?: string;
    page_size?: number;
  }) => {
    const response = await apiClient.get<{ results: PaymentReceived[] } | PaymentReceived[]>(
      '/sales/payments/',
      { params }
    );
    const data = response.data;
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  // Get payment by ID
  get: async (id: string) => {
    const response = await apiClient.get<PaymentReceived>(`/sales/payments/${id}/`);
    return response.data;
  },

  // Record new payment
  create: async (data: Partial<PaymentReceived>) => {
    const response = await apiClient.post<PaymentReceived>('/sales/payments/', data);
    return response.data;
  },

  // Update payment
  update: async (id: string, data: Partial<PaymentReceived>) => {
    const response = await apiClient.put<PaymentReceived>(`/sales/payments/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<PaymentReceived>) => {
    const response = await apiClient.patch<PaymentReceived>(`/sales/payments/${id}/`, data);
    return response.data;
  },

  // Delete payment
  delete: async (id: string) => {
    await apiClient.delete(`/sales/payments/${id}/`);
  },
};

// Extended Customer API functions
export const customerCreditAPI = {
  // Get customer ledger
  getLedger: async (customerId: string) => {
    const response = await apiClient.get<CustomerLedger[]>(`/sales/customers/${customerId}/ledger/`);
    return response.data;
  },

  // Get aging report
  getAgingReport: async (customerId: string) => {
    const response = await apiClient.get<AgingReport>(`/sales/customers/${customerId}/aging_report/`);
    return response.data;
  },

  // Get customer credit summary
  getCreditSummary: async (customerId: string) => {
    const response = await apiClient.get(`/sales/customers/${customerId}/credit_summary/`);
    return response.data;
  },

  // Get credit overview for all customers
  getCreditOverview: async () => {
    const response = await apiClient.get('/sales/customers/credit_overview/');
    return response.data;
  },
};

// ============================================================================
// SALES DASHBOARD API
// ============================================================================

export interface SalesDashboardData {
  stats: {
    revenue: string;
    revenueChange: number;
    orders: number;
    ordersChange: number;
    customers: number;
    customersChange: number;
    newCustomers?: number;
    products: number;
    productsChange: number;
  };
  revenueData: Array<{
    time: string;
    value: number;
  }>;
  recentOrders: Array<{
    id: string;
    order_number?: string;
    customer: string;
    amount: string;
    status: string;
  }>;
  topProducts: Array<{
    name: string;
    sales: number;
    max: number;
  }>;
  recentCustomers: Array<{
    name: string;
    email: string;
    initials: string;
    joined: string;
  }>;
  inventorySummary: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalSKUs: number;
  };
}

// Sales Dashboard API
export const salesDashboardAPI = {
  get: async (period: 'today' | 'week' | 'month' | 'year' = 'month') => {
    const response = await apiClient.get<SalesDashboardData>('/sales/orders/dashboard/', {
      params: { period }
    });
    return response.data;
  },
};

// ============================================================================
// CONSOLIDATED SALES API EXPORT
// ============================================================================

export const salesApi = {
  customers: customerAPI,
  salesOrders: salesOrderAPI,
  quotations: quotationAPI,
  invoices: invoiceAPI,
  creditNotes: creditNoteAPI,
  customerLedger: customerLedgerAPI,
  paymentsReceived: paymentReceivedAPI,
  customerCredit: customerCreditAPI,
  dashboard: salesDashboardAPI,
};

// ============================================================================
// SALES REPORTS API
// ============================================================================

export interface SalesSummaryReport {
  summary: {
    total_sales: number;
    total_orders: number;
    avg_order_value: number;
    cash_collected: number;
    collection_rate: number;
  };
  monthly_trend: Array<{
    month: string;
    sales: number;
    orders: number;
    collected: number;
    outstanding: number;
  }>;
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface CustomerReportData {
  customer_id: string;
  customer_name: string;
  orders: number;
  revenue: number;
  avg_order: number;
  status: string;
}

export interface ByCustomerReport {
  customers: CustomerReportData[];
  period: {
    start_date: string | null;
    end_date: string | null;
  };
}

export interface ProductReportData {
  product_id: string;
  product_name: string;
  unit: string;
  unit_price: number;
  qty_sold: number;
  revenue: number;
  percentage: number;
}

export interface ByProductReport {
  products: ProductReportData[];
  total_revenue: number;
  period: {
    start_date: string | null;
    end_date: string | null;
  };
}

export interface CategoryReportData {
  category_id: string | null;
  category_name: string;
  revenue: number;
  percentage: number;
  orders: number;
}

export interface ByCategoryReport {
  categories: CategoryReportData[];
  total_revenue: number;
  period: {
    start_date: string | null;
    end_date: string | null;
  };
}

export interface TaxReportData {
  month: string;
  year: number;
  taxable_sales: number;
  vat_collected: number;
  vat_rate: number;
  status: string;
}

export interface TaxReport {
  summary: {
    total_taxable_sales: number;
    total_vat_collected: number;
    net_vat_payable: number;
    vat_rate: number;
  };
  monthly_data: TaxReportData[];
  period: {
    start_date: string;
    end_date: string;
  };
}

// Sales Reports API
export const salesReportsAPI = {
  // Sales Summary Report
  getSalesSummary: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await apiClient.get<SalesSummaryReport>('/sales/reports/summary/', { params });
    return response.data;
  },

  // By Customer Report
  getByCustomer: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await apiClient.get<ByCustomerReport>('/sales/reports/by_customer/', { params });
    return response.data;
  },

  // By Product Report
  getByProduct: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await apiClient.get<ByProductReport>('/sales/reports/by_product/', { params });
    return response.data;
  },

  // By Category Report
  getByCategory: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await apiClient.get<ByCategoryReport>('/sales/reports/by_category/', { params });
    return response.data;
  },

  // Tax Report
  getTaxReport: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await apiClient.get<TaxReport>('/sales/reports/tax_report/', { params });
    return response.data;
  },
};

// Update consolidated export
export const salesApiWithReports = {
  ...salesApi,
  reports: salesReportsAPI,
};
