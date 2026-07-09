import apiClient from './client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Supplier {
  id: string;
  name: string;
  type?: string;
  contact_person?: string;
  email?: string;
  phone: string;
  website?: string;
  address?: string;
  pan?: string;
  bank_name?: string;
  bank_account?: string;
  payment_terms?: string;
  credit_limit?: number;
  lead_time_days?: number;
  status: 'active' | 'inactive';
  total_orders?: number;
  total_purchased?: number;
  outstanding_amount?: number;
  /** @deprecated use total_purchased */
  total_purchases?: number;
  /** @deprecated use outstanding_amount */
  outstanding_balance?: number;
  created_at: string;
  updated_at: string;
}

export function normalizeSupplier(supplier: Supplier): Supplier {
  return {
    ...supplier,
    total_purchases: supplier.total_purchased ?? supplier.total_purchases ?? 0,
    outstanding_balance: supplier.outstanding_amount ?? supplier.outstanding_balance ?? 0,
    total_orders: supplier.total_orders ?? 0,
  };
}

export interface PurchaseRequestLine {
  id?: string;
  product: string;
  product_name?: string;
  product_code?: string;
  quantity: number;
  estimated_unit_price: number;
  estimated_amount?: number;
  description?: string;
}

export interface PurchaseRequest {
  id: string;
  request_number: string;
  date: string;
  requested_by?: string;
  requested_by_name?: string;
  supplier?: string;
  supplier_name?: string;
  warehouse?: string;
  warehouse_name?: string;
  department: string;
  required_by: string;
  estimated_amount: number;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Converted to PO';
  notes?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  linked_po_id?: number | string | null;
  linked_po_number?: string | null;
  lines: PurchaseRequestLine[];
  items_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderLine {
  id?: string;
  product: string;
  product_name?: string;
  product_code?: string;
  quantity: number;
  received_quantity?: number;
  unit_price: number;
  tax_percent: number;
  amount?: number; // Read-only, calculated by backend
  description?: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  date: string;
  supplier: string;
  supplier_name?: string;
  expected_delivery_date: string;
  reference?: string;
  payment_terms: string;
  status: 'Draft' | 'Sent' | 'Partially Received' | 'Received' | 'Cancelled';
  subtotal: string;
  tax: string;
  total: string;
  purchase_request?: string;
  notes?: string;
  items_count?: number;
  lines: PurchaseOrderLine[];
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  date: string;
  supplier: string;
  supplier_name?: string;
  purchase_order?: string;
  purchase_order_number?: string;
  amount: number;
  paid_amount: number;
  balance: number;
  status: 'Received' | 'Partially Paid' | 'Paid' | 'Overdue';
  due_date?: string;
  notes?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DebitNote {
  id: string;
  debit_note_number: string;
  note_number?: string;
  date: string;
  supplier: string;
  supplier_name?: string;
  invoice: string;
  purchase_invoice?: string;
  invoice_number?: string;
  purchase_invoice_number?: string;
  amount: number;
  reason: 'Return' | 'Overcharge' | 'Damage' | 'Other';
  description?: string;
  status: 'Draft' | 'Issued' | 'Applied';
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SUPPLIERS API
// ============================================================================

export const suppliersAPI = {
  // List all suppliers
  list: async (params?: {
    status?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get('/purchase/suppliers/', { params });
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data.map(normalizeSupplier) : data;
  },

  // Get supplier by ID
  get: async (id: string) => {
    const response = await apiClient.get<Supplier>(`/purchase/suppliers/${id}/`);
    return normalizeSupplier(response.data);
  },

  // Create new supplier
  create: async (data: Partial<Supplier>) => {
    const response = await apiClient.post<Supplier>('/purchase/suppliers/', data);
    return response.data;
  },

  // Update supplier
  update: async (id: string, data: Partial<Supplier>) => {
    const response = await apiClient.put<Supplier>(`/purchase/suppliers/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<Supplier>) => {
    const response = await apiClient.patch<Supplier>(`/purchase/suppliers/${id}/`, data);
    return response.data;
  },

  // Delete supplier
  delete: async (id: string) => {
    await apiClient.delete(`/purchase/suppliers/${id}/`);
  },
};

// ============================================================================
// PURCHASE REQUESTS API
// ============================================================================

export const purchaseRequestsAPI = {
  // List all purchase requests
  list: async (params?: {
    status?: string;
    supplier?: string;
    warehouse?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get('/purchase/requests/', { params });
    // Handle paginated response
    return response.data.results || response.data;
  },

  // Get purchase request by ID
  get: async (id: string) => {
    const response = await apiClient.get<PurchaseRequest>(`/purchase/requests/${id}/`);
    return response.data;
  },

  // Create new purchase request
  create: async (data: Partial<PurchaseRequest>) => {
    const response = await apiClient.post<PurchaseRequest>('/purchase/requests/', data);
    return response.data;
  },

  // Update purchase request
  update: async (id: string, data: Partial<PurchaseRequest>) => {
    const response = await apiClient.put<PurchaseRequest>(`/purchase/requests/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<PurchaseRequest>) => {
    const response = await apiClient.patch<PurchaseRequest>(`/purchase/requests/${id}/`, data);
    return response.data;
  },

  // Delete purchase request
  delete: async (id: string) => {
    await apiClient.delete(`/purchase/requests/${id}/`);
  },

  // Approve purchase request
  approve: async (id: string) => {
    const response = await apiClient.post<PurchaseRequest>(`/purchase/requests/${id}/approve/`);
    return response.data;
  },

  // Reject purchase request
  reject: async (id: string, reason: string) => {
    const response = await apiClient.post<PurchaseRequest>(`/purchase/requests/${id}/reject/`, { reason });
    return response.data;
  },

  // Submit for approval
  submit: async (id: string) => {
    const response = await apiClient.post<PurchaseRequest>(`/purchase/requests/${id}/submit/`);
    return response.data;
  },

  // Convert to purchase order
  convertToPO: async (
    id: string,
    data: { supplier: string; expected_delivery_date: string }
  ) => {
    const response = await apiClient.post<PurchaseOrder>(
      `/purchase/requests/${id}/convert_to_po/`,
      data
    );
    return response.data;
  },
};

// ============================================================================
// PURCHASE ORDERS API
// ============================================================================

export const purchaseOrdersAPI = {
  // List all purchase orders
  list: async (params?: {
    status?: string;
    supplier?: string;
    warehouse?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get('/purchase/orders/', { params });
    // Handle paginated response
    return response.data.results || response.data;
  },

  // Get purchase order by ID
  get: async (id: string) => {
    const response = await apiClient.get<PurchaseOrder>(`/purchase/orders/${id}/`);
    return response.data;
  },

  // Create new purchase order
  create: async (data: Partial<PurchaseOrder>) => {
    const response = await apiClient.post<PurchaseOrder>('/purchase/orders/', data);
    return response.data;
  },

  // Update purchase order
  update: async (id: string, data: Partial<PurchaseOrder>) => {
    const response = await apiClient.put<PurchaseOrder>(`/purchase/orders/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<PurchaseOrder>) => {
    const response = await apiClient.patch<PurchaseOrder>(`/purchase/orders/${id}/`, data);
    return response.data;
  },

  // Delete purchase order
  delete: async (id: string) => {
    await apiClient.delete(`/purchase/orders/${id}/`);
  },

  // Update status
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch<PurchaseOrder>(`/purchase/orders/${id}/update_status/`, { status });
    return response.data;
  },

  // Receive items
  receiveItems: async (
    id: string,
    items: Array<{ line_id: string; quantity: number }>,
    warehouseId?: string | number,
  ) => {
    const response = await apiClient.post<PurchaseOrder>(`/purchase/orders/${id}/receive/`, {
      items,
      warehouse_id: warehouseId,
    });
    return response.data;
  },
};

// ============================================================================
// PURCHASE INVOICES API
// ============================================================================

export const purchaseInvoicesAPI = {
  // List all purchase invoices
  list: async (params?: {
    status?: string;
    supplier?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get('/purchase/invoices/', { params });
    // Handle paginated response
    return response.data.results || response.data;
  },

  // Get purchase invoice by ID
  get: async (id: string) => {
    const response = await apiClient.get<PurchaseInvoice>(`/purchase/invoices/${id}/`);
    return response.data;
  },

  // Create new purchase invoice
  create: async (data: Partial<PurchaseInvoice>) => {
    const response = await apiClient.post<PurchaseInvoice>('/purchase/invoices/', data);
    return response.data;
  },

  // Update purchase invoice
  update: async (id: string, data: Partial<PurchaseInvoice>) => {
    const response = await apiClient.put<PurchaseInvoice>(`/purchase/invoices/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<PurchaseInvoice>) => {
    const response = await apiClient.patch<PurchaseInvoice>(`/purchase/invoices/${id}/`, data);
    return response.data;
  },

  // Delete purchase invoice
  delete: async (id: string) => {
    await apiClient.delete(`/purchase/invoices/${id}/`);
  },

  // Record payment
  recordPayment: async (id: string, amount: number, payment_date: string, payment_method: string, reference?: string) => {
    const response = await apiClient.post<PurchaseInvoice>(`/purchase/invoices/${id}/record_payment/`, {
      amount,
      payment_date,
      payment_method,
      reference
    });
    return response.data;
  },
};

// ============================================================================
// DEBIT NOTES API
// ============================================================================

export const debitNotesAPI = {
  // List all debit notes
  list: async (params?: {
    status?: string;
    supplier?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get('/purchase/debit-notes/', { params });
    // Handle paginated response
    return response.data.results || response.data;
  },

  // Get debit note by ID
  get: async (id: string) => {
    const response = await apiClient.get<DebitNote>(`/purchase/debit-notes/${id}/`);
    return response.data;
  },

  // Create new debit note
  create: async (data: Partial<DebitNote>) => {
    const response = await apiClient.post<DebitNote>('/purchase/debit-notes/', data);
    return response.data;
  },

  // Update debit note
  update: async (id: string, data: Partial<DebitNote>) => {
    const response = await apiClient.put<DebitNote>(`/purchase/debit-notes/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<DebitNote>) => {
    const response = await apiClient.patch<DebitNote>(`/purchase/debit-notes/${id}/`, data);
    return response.data;
  },

  // Delete debit note
  delete: async (id: string) => {
    await apiClient.delete(`/purchase/debit-notes/${id}/`);
  },
};
