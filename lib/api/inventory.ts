import apiClient from './client';

// Types
export interface Category {
  id: number;
  name: string;
  parent: number | null;
  parent_name: string | null;
  description: string;
  children_count: number;
  created_at: string;
  updated_at: string;
}

export interface UnitOfMeasure {
  id: number;
  name: string;
  abbreviation: string;
  type: 'count' | 'weight' | 'length' | 'volume' | 'area';
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  manager: number | null;
  manager_name: string | null;
  is_active: boolean;
  total_products: number;
  total_value?: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string | null;
  category_name: string | null;
  unit: string;
  unit_name: string;
  cost_price: number | string;  // Can be string from API
  selling_price: number | string;  // Can be string from API
  reorder_level: number;
  expiry_date?: string | null;
  status: 'active' | 'inactive' | 'discontinued';
  total_stock?: number;
  stock_by_warehouse?: Array<{
    warehouse_id: string;
    warehouse_name: string;
    quantity: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: string;
  product: string;
  product_name: string;
  product_sku: string;
  warehouse: string;
  warehouse_name: string;
  quantity: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product: number;
  product_name: string;
  warehouse: number;
  warehouse_name: string;
  movement_type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: string;
  from_warehouse: number | null;
  from_warehouse_name: string | null;
  to_warehouse: number | null;
  to_warehouse_name: string | null;
  reference_type: string;
  reference_id: number | null;
  reason: string;
  notes: string;
  performed_by: number | null;
  performed_by_name: string | null;
  created_at: string;
}

export interface ProductLinkedPurchaseOrder {
  id: number;
  po_number: string;
  date: string;
  status: string;
  quantity: string | number;
  received_quantity: string | number;
}

export interface ProductLinkedSalesOrder {
  id: number;
  order_number: string;
  date: string;
  status: string;
  quantity: string | number;
}

export interface ProductActivity {
  movements: StockMovement[];
  purchase_orders: ProductLinkedPurchaseOrder[];
  sales_orders: ProductLinkedSalesOrder[];
}

export interface CustomerSpecificPrice {
  id: number;
  customer: number;
  customer_name?: string;
  product: number;
  product_name?: string;
  product_sku?: string;
  unit_price: number | string;
  min_quantity: number | string;
  valid_from: string;
  valid_until?: string | null;
  is_active: boolean;
  notes?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface BulkPricing {
  id: number;
  product: number;
  product_name?: string;
  product_sku?: string;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Functions
export const inventoryApi = {
  // Categories
  categories: {
    list: (params?: any) => 
      apiClient.get<PaginatedResponse<Category>>('/inventory/categories/', { params }),
    get: (id: number) => 
      apiClient.get<Category>(`/inventory/categories/${id}/`),
    create: (data: Partial<Category>) => 
      apiClient.post<Category>('/inventory/categories/', data),
    update: (id: number, data: Partial<Category>) => 
      apiClient.put<Category>(`/inventory/categories/${id}/`, data),
    delete: (id: number) => 
      apiClient.delete(`/inventory/categories/${id}/`),
    tree: () => 
      apiClient.get<Category[]>('/inventory/categories/tree/'),
  },

  // Units
  units: {
    list: (params?: any) => 
      apiClient.get<PaginatedResponse<UnitOfMeasure>>('/inventory/units/', { params }),
    get: (id: number) => 
      apiClient.get<UnitOfMeasure>(`/inventory/units/${id}/`),
    create: (data: Partial<UnitOfMeasure>) => 
      apiClient.post<UnitOfMeasure>('/inventory/units/', data),
    update: (id: number, data: Partial<UnitOfMeasure>) => 
      apiClient.put<UnitOfMeasure>(`/inventory/units/${id}/`, data),
    delete: (id: number) => 
      apiClient.delete(`/inventory/units/${id}/`),
  },

  // Warehouses
  warehouses: {
    list: (params?: any) => 
      apiClient.get<PaginatedResponse<Warehouse>>('/inventory/warehouses/', { params }),
    get: (id: number) => 
      apiClient.get<Warehouse>(`/inventory/warehouses/${id}/`),
    create: (data: Partial<Warehouse>) => 
      apiClient.post<Warehouse>('/inventory/warehouses/', data),
    update: (id: number, data: Partial<Warehouse>) => 
      apiClient.put<Warehouse>(`/inventory/warehouses/${id}/`, data),
    delete: (id: number) => 
      apiClient.delete(`/inventory/warehouses/${id}/`),
    stockSummary: (id: number) => 
      apiClient.get<Stock[]>(`/inventory/warehouses/${id}/stock_summary/`),
  },

  // Products
  products: {
    list: (params?: any) => 
      apiClient.get<PaginatedResponse<Product>>('/inventory/products/', { params }),
    get: (id: number) => 
      apiClient.get<Product>(`/inventory/products/${id}/`),
    create: (data: Partial<Product>) => 
      apiClient.post<Product>('/inventory/products/', data),
    update: (id: number, data: Partial<Product>) => 
      apiClient.put<Product>(`/inventory/products/${id}/`, data),
    delete: (id: number) => 
      apiClient.delete(`/inventory/products/${id}/`),
    lowStock: () => 
      apiClient.get<Product[]>('/inventory/products/low_stock/'),
    stockHistory: (id: number) => 
      apiClient.get<StockMovement[]>(`/inventory/products/${id}/stock_history/`),
    activity: (id: number) =>
      apiClient.get<ProductActivity>(`/inventory/products/${id}/activity/`),
  },

  // Stocks
  stocks: {
    list: (params?: any) => 
      apiClient.get<PaginatedResponse<Stock>>('/inventory/stocks/', { params }),
    get: (id: number) => 
      apiClient.get<Stock>(`/inventory/stocks/${id}/`),
  },

  // Stock Movements
  movements: {
    list: (params?: any) => 
      apiClient.get<PaginatedResponse<StockMovement>>('/inventory/movements/', { params }),
    get: (id: number) => 
      apiClient.get<StockMovement>(`/inventory/movements/${id}/`),
  },

  // Stock Operations
  operations: {
    stockIn: (data: {
      product: number;
      warehouse: number;
      quantity: string;
      reason: string;
      notes?: string;
    }) => apiClient.post('/inventory/operations/stock_in/', data),
    
    stockOut: (data: {
      product: number;
      warehouse: number;
      quantity: string;
      reason: string;
      notes?: string;
    }) => apiClient.post('/inventory/operations/stock_out/', data),
    
    transfer: (data: {
      product: number;
      from_warehouse: number;
      to_warehouse: number;
      quantity: string;
      notes?: string;
    }) => apiClient.post('/inventory/operations/transfer/', data),
    
    adjustment: (data: {
      product: number;
      warehouse: number;
      quantity: string;
      reason: string;
      notes?: string;
    }) => apiClient.post('/inventory/operations/adjustment/', data),
  },

  // Reports
  reports: {
    stockSummary: () => 
      apiClient.get<{
        summary: {
          total_products: number;
          total_units: number;
          low_stock: number;
          out_of_stock: number;
        };
        stock_data: Array<{ name: string; stock: number }>;
      }>('/inventory/reports/stock-summary/'),
    
    lowStock: () => 
      apiClient.get<{
        items: Array<{
          id: number;
          name: string;
          sku: string;
          current_stock: number;
          reorder_level: number;
          shortage: number;
          status: string;
          category: string | null;
          unit: string;
        }>;
        total_count: number;
      }>('/inventory/reports/low-stock/'),
    
    valuation: () => 
      apiClient.get<{
        summary: {
          total_cost_value: number;
          total_sale_value: number;
          potential_profit: number;
        };
        items: Array<{
          id: number;
          name: string;
          sku: string;
          stock: number;
          cost_price: number;
          selling_price: number;
          total_cost_value: number;
          total_sale_value: number;
          unit: string;
        }>;
        valuation_data: Array<{ name: string; value: number }>;
      }>('/inventory/reports/valuation/'),
    
    movement: (params?: { start_date?: string; end_date?: string }) => 
      apiClient.get<{
        items: Array<{
          id: number;
          name: string;
          sku: string;
          category: string | null;
          opening: number;
          in: number;
          out: number;
          closing: number;
          unit: string;
        }>;
        period: {
          start_date: string | null;
          end_date: string | null;
        };
      }>('/inventory/reports/movement/', { params }),
  },

  // Bulk Pricing
  bulkPricing: {
    list: (params?: any) => 
      apiClient.get<PaginatedResponse<BulkPricing>>('/inventory/bulk-pricing/', { params }),
    
    get: (id: number) => 
      apiClient.get<BulkPricing>(`/inventory/bulk-pricing/${id}/`),
    
    create: (data: Partial<BulkPricing>) => 
      apiClient.post<BulkPricing>('/inventory/bulk-pricing/', data),
    
    update: (id: number, data: Partial<BulkPricing>) => 
      apiClient.put<BulkPricing>(`/inventory/bulk-pricing/${id}/`, data),
    
    delete: (id: number) => 
      apiClient.delete(`/inventory/bulk-pricing/${id}/`),
    
    byProduct: (productId: number) => 
      apiClient.get<BulkPricing[]>(`/inventory/bulk-pricing/by-product/${productId}/`),
    
    getPrice: (productId: number, quantity: number) =>
      apiClient.get<{
        product_id: number;
        product_name: string;
        quantity: number;
        unit_price: number;
        bulk_pricing_applied: boolean;
        tier: { id: number; min_quantity: number; max_quantity: number | null; discount_percent: number } | null;
      }>(
        `/inventory/bulk-pricing/get-price/`,
        { params: { product_id: productId, quantity } }
      ),

    resolveUnitPrice: async (productId: number, quantity: number, fallbackPrice = 0): Promise<number> => {
      try {
        const response = await apiClient.get<{ unit_price: number }>(
          `/inventory/bulk-pricing/get-price/`,
          { params: { product_id: productId, quantity } }
        );
        return Number(response.data.unit_price ?? fallbackPrice);
      } catch {
        return fallbackPrice;
      }
    },
  },

  customerPrices: {
    list: (params?: { customer?: string; product?: string }) =>
      apiClient.get<PaginatedResponse<CustomerSpecificPrice>>('/inventory/customer-prices/', { params }),

    get: (id: number) =>
      apiClient.get<CustomerSpecificPrice>(`/inventory/customer-prices/${id}/`),

    byCustomer: (customerId: string) =>
      apiClient.get<CustomerSpecificPrice[]>(`/inventory/customer-prices/by_customer/${customerId}/`),

    create: (data: Partial<CustomerSpecificPrice>) =>
      apiClient.post<CustomerSpecificPrice>('/inventory/customer-prices/', data),

    update: (id: number, data: Partial<CustomerSpecificPrice>) =>
      apiClient.patch<CustomerSpecificPrice>(`/inventory/customer-prices/${id}/`, data),

    delete: (id: number) =>
      apiClient.delete(`/inventory/customer-prices/${id}/`),
  },
};

// ============================================================================
// INVENTORY DASHBOARD API (Overview page)
// ============================================================================

export interface InventoryDashboardData {
  summary: {
    total_products: number;
    total_units: number;
    low_stock: number;
    out_of_stock: number;
  };
  valuation: {
    total_cost_value: number;
    total_sale_value: number;
    potential_profit: number;
  };
  stockData: Array<{ name: string; stock: number }>;
  lowStockItems: Array<{
    id: number;
    name: string;
    sku: string;
    current_stock: number;
    reorder_level: number;
    shortage: number;
    status: string;
    category: string | null;
    unit: string;
  }>;
  topByValue: Array<{
    name: string;
    sku: string;
    total_cost_value: number;
    stock: number;
  }>;
  warehouseCount: number;
  categoryCount: number;
}

export const inventoryDashboardAPI = {
  get: async (): Promise<InventoryDashboardData> => {
    const [stockRes, lowStockRes, valuationRes, warehousesRes, categoriesRes] =
      await Promise.all([
        apiClient.get<{
          summary: InventoryDashboardData['summary'];
          stock_data: Array<{ name: string; stock: number }>;
        }>('/inventory/reports/stock-summary/'),
        apiClient.get<{
          items: InventoryDashboardData['lowStockItems'];
        }>('/inventory/reports/low-stock/'),
        apiClient.get<{
          summary: InventoryDashboardData['valuation'];
          items: Array<{
            name: string;
            sku: string;
            stock: number;
            total_cost_value: number;
          }>;
        }>('/inventory/reports/valuation/'),
        apiClient.get<{ results?: Warehouse[] }>('/inventory/warehouses/'),
        apiClient.get<{ results?: Category[] }>('/inventory/categories/'),
      ]);

    const stock = stockRes.data;
    const valuation = valuationRes.data;
    const warehouses = warehousesRes.data?.results ?? [];
    const categories = categoriesRes.data?.results ?? [];

    const topByValue = [...(valuation.items ?? [])]
      .sort((a, b) => b.total_cost_value - a.total_cost_value)
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        sku: item.sku,
        total_cost_value: item.total_cost_value,
        stock: item.stock,
      }));

    return {
      summary: stock.summary,
      valuation: valuation.summary,
      stockData: (stock.stock_data ?? []).slice(0, 10),
      lowStockItems: (lowStockRes.data.items ?? []).slice(0, 5),
      topByValue,
      warehouseCount: warehouses.filter((w) => w.is_active).length,
      categoryCount: categories.length,
    };
  },
};
