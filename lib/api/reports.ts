import apiClient from './client';
import type { UnifiedDashboardData } from '@/lib/dashboard/types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DashboardFinancials {
  total_receivables: number;
  total_payables: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin_percentage: number;
  breakdown: {
    sales_revenue: number;
    invoice_revenue: number;
    purchase_expenses: number;
    material_expenses: number;
    labor_expenses: number;
  };
}

export interface LowStockItem {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  reorder_level: number;
  unit: string;
  stock_deficit: number;
  warehouses: Array<{
    warehouse__name: string;
    quantity: number;
  }>;
  urgency: 'critical' | 'low';
}

export interface DashboardInventory {
  low_stock_items: LowStockItem[];
  total_low_stock_items: number;
  critical_items: number;
}

export interface BudgetAlertSite {
  site_id: string;
  site_name: string;
  location: string;
  status: string;
  allocated_budget: number;
  actual_spend: number;
  budget_utilization_percentage: number;
  remaining_budget: number;
  alert_level: 'warning' | 'high' | 'critical';
  breakdown: {
    material_cost: number;
    labor_cost: number;
    other_expenses: number;
  };
}

export interface DashboardConstruction {
  budget_alert_sites: BudgetAlertSite[];
  total_alert_sites: number;
  critical_sites: number;
  total_active_sites: number;
}

export interface DashboardSummary {
  financials: DashboardFinancials;
  inventory: DashboardInventory;
  construction: DashboardConstruction;
  generated_at: string;
}

export interface ProfitAndLossPeriod {
  start_date: string;
  end_date: string;
  days: number;
}

export interface ProfitAndLossRevenue {
  sales_revenue: {
    amount: number;
    count: number;
  };
  invoice_revenue: {
    amount: number;
    count: number;
  };
  payments_received: {
    amount: number;
    count: number;
  };
  total_revenue: number;
}

export interface ProfitAndLossExpenses {
  purchase_expenses: {
    amount: number;
    count: number;
  };
  material_expenses: {
    amount: number;
    count: number;
  };
  labor_expenses: {
    amount: number;
    count: number;
  };
  other_expenses: {
    amount: number;
  };
  total_expenses: number;
}

export interface ProfitAndLossProfit {
  gross_profit: number;
  gross_profit_margin_percentage: number;
  ebitda: number;
  ebitda_margin_percentage: number;
  net_profit: number;
  net_profit_margin_percentage: number;
}

export interface ProfitAndLossMetrics {
  days_in_period: number;
  average_daily_revenue: number;
  average_daily_expenses: number;
  expense_ratio: number;
}

export interface ProfitAndLossReport {
  period: ProfitAndLossPeriod;
  revenue: ProfitAndLossRevenue;
  expenses: ProfitAndLossExpenses;
  profit: ProfitAndLossProfit;
  metrics: ProfitAndLossMetrics;
  generated_at: string;
}

export interface ExecutiveSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  cash_on_hand: number;
  total_sales_orders: number;
  total_invoices: number;
  total_customers: number;
  active_construction_sites: number;
  period: {
    start_date?: string;
    end_date?: string;
  };
}

export interface SiteProfitability {
  site_id: string;
  site_name: string;
  location: string;
  status: string;
  allocated_budget: number;
  material_cost: number;
  labor_cost: number;
  other_expenses: number;
  total_cost: number;
  budget_utilized_percentage: number;
  remaining_budget: number;
  budget_health: 'green' | 'yellow' | 'red';
}

export interface ConstructionProfitabilityReport {
  sites: SiteProfitability[];
  total_sites: number;
  total_budget: number;
  total_spent: number;
}

export interface ProductValuation {
  product_id: string;
  product_name: string;
  sku: string;
  total_quantity: number;
  cost_price: number;
  total_value: number;
}

export interface InventoryValuationReport {
  total_inventory_value: number;
  products: ProductValuation[];
  total_products: number;
}

export interface TopDebtor {
  customer_id: string;
  customer_name: string;
  phone: string;
  outstanding_balance: number;
  credit_limit: number;
  is_over_limit: boolean;
  available_credit: number;
}

export interface CreditSummaryReport {
  total_outstanding: number;
  total_customers_with_credit: number;
  top_debtors: TopDebtor[];
}

export interface MonthlyData {
  month: string;
  month_date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface RevenueExpenseTrend {
  monthly_data: MonthlyData[];
}

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  total_orders: number;
  total_amount: number;
}

export interface SalesPerformanceReport {
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  top_customers: TopCustomer[];
  period: {
    start_date?: string;
    end_date?: string;
  };
}

// Main Dashboard Types
export interface MainDashboardStats {
  revenue: string;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  customers: number;
  customersChange: number;
  products: number;
  productsChange: number;
}

export interface RevenueDataPoint {
  time: string;
  value: number;
}

export interface RecentOrder {
  id: string;
  customer: string;
  amount: string;
  status: string;
}

export interface TopProduct {
  name: string;
  sales: number;
  max: number;
}

export interface RecentCustomer {
  name: string;
  email: string;
  initials: string;
  joined: string;
}

export interface InventorySummary {
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalSKUs: number;
}

export interface MainDashboardData {
  activeModules: string[];
  period: 'today' | 'week' | 'month' | 'year';
  modules: Array<{
    id: string;
    title: string;
    href: string;
    stats: Array<{ label: string; value: string; change?: number }>;
    chart?: { data: Array<{ time: string; value: number }> };
    lists?: Array<{
      title: string;
      items: Array<{
        primary: string;
        secondary?: string;
        meta?: string;
        status?: string;
      }>;
    }>;
    tiles?: Array<{ label: string; value: string; tone?: 'success' | 'warning' | 'danger' | 'info' }>;
  }>;
}

// ============================================================================
// REPORTS API
// ============================================================================

export const reportsAPI = {
  /**
   * Get complete dashboard summary
   * Includes financials, inventory alerts, and construction budget alerts
   */
  dashboardSummary: async () => {
    const response = await apiClient.get<DashboardSummary>('/reports/dashboard-summary/');
    return response.data;
  },

  /**
   * Get profit and loss statement
   * Detailed P&L report with date range filtering
   */
  profitAndLoss: async (params: {
    start_date: string;
    end_date: string;
  }) => {
    const response = await apiClient.get<ProfitAndLossReport>('/reports/profit-and-loss/', { params });
    return response.data;
  },

  /**
   * Get executive dashboard summary
   * High-level financial metrics across all modules
   */
  summary: async (params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await apiClient.get<ExecutiveSummary>('/reports/summary/', { params });
    return response.data;
  },

  /**
   * Get construction profitability report
   * Multi-site P&L analysis
   */
  constructionProfitability: async (params?: {
    status?: string;
  }) => {
    const response = await apiClient.get<ConstructionProfitabilityReport>(
      '/reports/construction-profitability/',
      { params }
    );
    return response.data;
  },

  /**
   * Get inventory valuation report
   * Current inventory value based on weighted average cost
   */
  inventoryValuation: async (params?: {
    warehouse?: string;
  }) => {
    const response = await apiClient.get<InventoryValuationReport>(
      '/reports/inventory-valuation/',
      { params }
    );
    return response.data;
  },

  /**
   * Get credit summary report
   * Total outstanding credit and top debtors
   */
  creditSummary: async (params?: {
    limit?: number;
  }) => {
    const response = await apiClient.get<CreditSummaryReport>(
      '/reports/credit-summary/',
      { params }
    );
    return response.data;
  },

  /**
   * Get revenue vs expense trend
   * Monthly breakdown for chart visualization
   */
  revenueExpenseTrend: async (params?: {
    months?: number;
  }) => {
    const response = await apiClient.get<RevenueExpenseTrend>(
      '/reports/revenue-expense-trend/',
      { params }
    );
    return response.data;
  },

  /**
   * Get sales performance report
   * Top products, customers, and sales trends
   */
  salesPerformance: async (params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await apiClient.get<SalesPerformanceReport>(
      '/reports/sales-performance/',
      { params }
    );
    return response.data;
  },

  /**
   * Get main dashboard data
   * Complete dashboard data for /dashboard page
   */
  mainDashboard: async (params?: {
    period?: 'today' | 'week' | 'month' | 'year';
  }): Promise<UnifiedDashboardData> => {
    const period = params?.period ?? 'month';
    const response = await apiClient.get<MainDashboardData>(
      '/reports/main-dashboard/',
      { params: { period } }
    );
    const payload = response.data;
    return {
      period: payload.period ?? period,
      activeModules: payload.activeModules ?? [],
      modules: payload.modules ?? [],
    };
  },

  /**
   * Get purchase reports
   * Comprehensive purchase analytics including summary, by supplier, by product, and tax reports
   */
  purchaseReports: async (params?: {
    date_range?: 'week' | 'month' | 'quarter' | 'year';
  }) => {
    const response = await apiClient.get('/reports/purchase-reports/', { params });
    return response.data;
  },

  /**
   * Get financial reports
   * Comprehensive financial reports including P&L, Balance Sheet, Trial Balance, and Cash Flow
   */
  financialReports: async (params?: {
    from_date?: string;
    to_date?: string;
    as_of_date?: string;
  }) => {
    const response = await apiClient.get<FinancialReportsData>('/reports/financial-reports/', { params });
    return response.data;
  },

  /**
   * Get tax reports
   * Comprehensive tax reports including VAT, TDS, and Income Tax summaries
   */
  taxReports: async (params?: {
    from_date?: string;
    to_date?: string;
  }) => {
    const response = await apiClient.get<TaxReportsData>('/reports/tax-reports/', { params });
    return response.data;
  },
};

// ============================================================================
// PURCHASE REPORTS TYPES
// ============================================================================

export interface PurchaseReportSummary {
  total_purchases: number;
  total_orders: number;
  avg_order_value: number;
  total_paid: number;
  payment_rate_percentage: number;
}

export interface PurchaseBySupplier {
  supplier_id: string;
  supplier_name: string;
  orders: number;
  amount: number;
  outstanding: number;
  status: string;
}

export interface PurchaseByProduct {
  product_id: string;
  product_name: string;
  unit: string;
  qty: number;
  amount: number;
  avg_price: number;
}

export interface PurchaseTaxMonthly {
  month: string;
  taxable: number;
  vat: number;
}

export interface PurchaseTaxReport {
  total_taxable: number;
  total_vat: number;
  monthly_data: PurchaseTaxMonthly[];
}

export interface PurchaseMonthlyTrend {
  month: string;
  purchases: number;
}

export interface PurchaseReportsData {
  summary: PurchaseReportSummary;
  by_supplier: PurchaseBySupplier[];
  by_product: PurchaseByProduct[];
  tax_report: PurchaseTaxReport;
  monthly_trend: PurchaseMonthlyTrend[];
  period: {
    start_date: string;
    end_date: string;
    range: string;
  };
}

// ============================================================================
// INVENTORY REPORTS TYPES
// ============================================================================

export interface InventoryReportSummary {
  total_products: number;
  total_units: number;
  low_stock: number;
  out_of_stock: number;
}

export interface InventoryStockData {
  name: string;
  stock: number;
}

export interface InventoryReportsData {
  summary: InventoryReportSummary;
  stock_data: InventoryStockData[];
}

// Alias for consistency with other API modules
export const reportsApi = reportsAPI;

// ============================================================================
// HELPER FUNCTIONS FOR CHART DATA
// ============================================================================

/**
 * Format monthly data for Recharts
 * Converts API response to format expected by Recharts components
 */
export const formatMonthlyDataForChart = (data: MonthlyData[]) => {
  return data.map(item => ({
    name: item.month,
    revenue: item.revenue,
    expenses: item.expenses,
    profit: item.profit,
  }));
};

/**
 * Format site profitability for chart
 */
export const formatSiteProfitabilityForChart = (sites: SiteProfitability[]) => {
  return sites.map(site => ({
    name: site.site_name,
    budget: site.allocated_budget,
    spent: site.total_cost,
    remaining: site.remaining_budget,
  }));
};

/**
 * Format top debtors for chart
 */
export const formatTopDebtorsForChart = (debtors: TopDebtor[]) => {
  return debtors.map(debtor => ({
    name: debtor.customer_name,
    value: debtor.outstanding_balance,
    limit: debtor.credit_limit,
  }));
};

/**
 * Calculate profit margin percentage
 */
export const calculateProfitMargin = (revenue: number, expenses: number): number => {
  if (revenue === 0) return 0;
  return ((revenue - expenses) / revenue) * 100;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Get budget health color
 */
export const getBudgetHealthColor = (health: 'green' | 'yellow' | 'red'): string => {
  const colors = {
    green: '#22C55E',
    yellow: '#F59E0B',
    red: '#EF4444',
  };
  return colors[health];
};

// ============================================================================
// FINANCIAL REPORTS TYPES
// ============================================================================

export interface FinancialReportAccount {
  account: string;
  amount: number;
}

export interface FinancialReportPnLAccount extends FinancialReportAccount {
  type: 'Income' | 'Expense';
}

export interface FinancialReportProfitAndLoss {
  period: {
    from_date: string;
    to_date: string;
  };
  income: FinancialReportPnLAccount[];
  expenses: FinancialReportPnLAccount[];
  total_income: number;
  total_expenses: number;
  net_profit: number;
}

export interface FinancialReportBalanceSheet {
  as_of_date: string;
  assets: FinancialReportAccount[];
  liabilities: FinancialReportAccount[];
  equity: FinancialReportAccount[];
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
}

export interface FinancialReportTrialBalanceAccount {
  account: string;
  debit: number;
  credit: number;
}

export interface FinancialReportTrialBalance {
  as_of_date: string;
  accounts: FinancialReportTrialBalanceAccount[];
  total_debit: number;
  total_credit: number;
}

export interface FinancialReportCashFlow {
  period: {
    from_date: string;
    to_date: string;
  };
  operating_activities: number;
  investing_activities: number;
  financing_activities: number;
  net_cash_change: number;
  opening_cash: number;
  closing_cash: number;
}

export interface FinancialReportsData {
  profit_and_loss: FinancialReportProfitAndLoss;
  balance_sheet: FinancialReportBalanceSheet;
  trial_balance: FinancialReportTrialBalance;
  cash_flow: FinancialReportCashFlow;
}

// ============================================================================
// TAX REPORTS TYPES
// ============================================================================

export interface TaxReportVATMonthly {
  month: string;
  sales_ex_vat: number;
  output_vat: number;
  purchases_ex_vat: number;
  input_vat: number;
  net_vat: number;
  status: 'filed' | 'unfiled';
}

export interface TaxReportVAT {
  output_vat: number;
  input_vat: number;
  net_payable: number;
  returns_filed: number;
  monthly: TaxReportVATMonthly[];
}

export interface TaxReportTDSDetail {
  supplier: string;
  pan: string;
  type: string;
  gross: number;
  rate: number;
  tds: number;
  date: string;
  submitted: boolean;
}

export interface TaxReportTDS {
  total_deducted: number;
  on_services: number;
  on_rent: number;
  on_goods: number;
  details: TaxReportTDSDetail[];
}

export interface TaxReportIncomeTaxEmployee {
  employee: string;
  pan: string;
  gross_salary_ytd: number;
  taxable_income: number;
  tax_slab: string;
  tax_amount: number;
  tax_deducted: number;
  balance: number;
}

export interface TaxReportIncomeTax {
  employees: TaxReportIncomeTaxEmployee[];
}

export interface TaxReportsData {
  period: {
    from_date: string;
    to_date: string;
  };
  vat: TaxReportVAT;
  tds: TaxReportTDS;
  income_tax: TaxReportIncomeTax;
}


// ============================================================================
// CUSTOM REPORTS TYPES
// ============================================================================

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  report_type: 'table' | 'chart' | 'both';
  module: 'sales' | 'purchase' | 'inventory' | 'accounting' | 'hr' | 'pos';
  fields: string[];
  filters: any[];
  grouping: any;
  sorting: any;
  chart_config: any;
  schedule: 'none' | 'daily' | 'weekly' | 'monthly';
  last_run: string | null;
  last_run_display: string | null;
  created_by: string;
  created_by_name: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomReportListResponse {
  count: number;
  results: CustomReport[];
}

export interface CustomReportRunResult {
  report_name: string;
  module: string;
  executed_at: string;
  parameters: {
    from_date?: string;
    to_date?: string;
  };
  data: {
    columns: string[];
    rows: any[];
    summary: any;
  };
  chart_data: any;
}

export interface CustomReportCreateData {
  name: string;
  description?: string;
  report_type: 'table' | 'chart' | 'both';
  module: 'sales' | 'purchase' | 'inventory' | 'accounting' | 'hr' | 'pos';
  fields?: string[];
  filters?: any[];
  grouping?: any;
  sorting?: any;
  chart_config?: any;
  schedule?: 'none' | 'daily' | 'weekly' | 'monthly';
  is_shared?: boolean;
}

// ============================================================================
// CUSTOM REPORTS API
// ============================================================================

export const customReportsAPI = {
  /**
   * List all custom reports
   */
  list: async (params?: {
    module?: string;
    only_mine?: boolean;
  }) => {
    const response = await apiClient.get<CustomReportListResponse>('/reports/custom-reports/', { params });
    return response.data;
  },

  /**
   * Get custom report details
   */
  get: async (reportId: string) => {
    const response = await apiClient.get<CustomReport>(`/reports/custom-reports/${reportId}/`);
    return response.data;
  },

  /**
   * Create a new custom report
   */
  create: async (data: CustomReportCreateData) => {
    const response = await apiClient.post<{ message: string; report: CustomReport }>('/reports/custom-reports/create/', data);
    return response.data;
  },

  /**
   * Update a custom report
   */
  update: async (reportId: string, data: Partial<CustomReportCreateData>) => {
    const response = await apiClient.put<{ message: string; report: CustomReport }>(`/reports/custom-reports/${reportId}/update/`, data);
    return response.data;
  },

  /**
   * Delete a custom report
   */
  delete: async (reportId: string) => {
    const response = await apiClient.delete<{ message: string }>(`/reports/custom-reports/${reportId}/delete/`);
    return response.data;
  },

  /**
   * Run a custom report
   */
  run: async (reportId: string, params?: {
    from_date?: string;
    to_date?: string;
  }) => {
    const response = await apiClient.post<CustomReportRunResult>(`/reports/custom-reports/${reportId}/run/`, params);
    return response.data;
  },

  /**
   * Duplicate a custom report
   */
  duplicate: async (reportId: string) => {
    const response = await apiClient.post<{ message: string; report: CustomReport }>(`/reports/custom-reports/${reportId}/duplicate/`);
    return response.data;
  },
};
