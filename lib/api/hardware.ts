import apiClient from './client';

export interface Vehicle {
  id: number;
  vehicle_number: string;
  vehicle_type: 'truck' | 'pickup' | 'tempo' | 'van' | 'other';
  capacity_kg?: number;
  status: 'available' | 'on_delivery' | 'maintenance' | 'inactive';
  last_service_date?: string;
  next_service_due?: string;
  is_owned: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryItem {
  id: number;
  product: number;
  product_name: string;
  product_sku?: string;
  product_unit?: string;
  ordered_quantity: number;
  delivered_quantity: number;
  damaged_quantity: number;
  pending_quantity: number;
  is_fully_delivered: boolean;
  unit_price: number;
  line_total: number;
  notes?: string;
}

export interface Delivery {
  id: number;
  delivery_number: string;
  challan_number?: string;
  invoice: number;
  invoice_number: string;
  invoice_amount?: number;
  customer: number;
  customer_name: string;
  customer_phone?: string;
  delivery_address: string;
  customer_contact_name?: string;
  customer_contact_phone?: string;
  scheduled_date: string;
  scheduled_time?: string;
  loading_started_at?: string;
  dispatch_time?: string;
  delivery_completed_at?: string;
  vehicle?: number;
  vehicle_number?: string;
  vehicle_details?: Vehicle;
  driver_name?: string;
  driver_phone?: string;
  status: 'pending' | 'scheduled' | 'loaded' | 'in_transit' | 'delivered' | 'partial' | 'failed' | 'cancelled';
  transport_charge: number;
  loading_charge: number;
  total_charges: number;
  delivery_notes?: string;
  driver_notes?: string;
  customer_signature?: string;
  delivery_photos?: string[];
  failure_reason?: string;
  items?: DeliveryItem[];
  items_count?: number;
  can_be_edited: boolean;
  can_be_cancelled: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryListParams {
  status?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface CreateDeliveryData {
  invoice: number;
  delivery_number?: string;
  challan_number?: string;
  customer?: number;
  delivery_address: string;
  customer_contact_name?: string;
  customer_contact_phone?: string;
  scheduled_date: string;
  scheduled_time?: string;
  vehicle?: number;
  driver_name?: string;
  driver_phone?: string;
  transport_charge?: number;
  loading_charge?: number;
  delivery_notes?: string;
  items?: Partial<DeliveryItem>[];
}

export interface UpdateDeliveryStatusData {
  status: Delivery['status'];
  driver_notes?: string;
  failure_reason?: string;
  customer_signature?: File;
  delivery_photos?: string[];
}

export interface DeliveryStats {
  total: number;
  pending: number;
  in_transit: number;
  delivered: number;
  failed: number;
  today: number;
  today_pending: number;
}

export interface MaterialRate {
  id: number;
  product: number;
  product_name: string;
  product_sku?: string;
  rate: string | number;
  unit_label?: string;
  unit_display: string;
  effective_date: string;
  notes?: string;
  created_by?: number;
  created_by_name?: string | null;
  previous_rate: string | number | null;
  change: string | number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMaterialRateData {
  product: number;
  rate: string | number;
  unit_label?: string;
  effective_date: string;
  notes?: string;
}

export const materialRateAPI = {
  current: () =>
    apiClient.get<MaterialRate[]>('/hardware/material-rates/current/'),

  history: (productId?: number) =>
    apiClient.get<{ results: MaterialRate[]; count: number }>('/hardware/material-rates/', {
      params: productId ? { product: productId } : undefined,
    }),

  create: (data: CreateMaterialRateData) =>
    apiClient.post<MaterialRate>('/hardware/material-rates/', data),

  delete: (id: number) =>
    apiClient.delete(`/hardware/material-rates/${id}/`),
};

export const vehicleAPI = {
  // The default ModelViewSet list action is paginated (DRF's global
  // PageNumberPagination), unlike the "available" action below which
  // bypasses pagination by serializing the queryset directly.
  list: (params?: { status?: string }) =>
    apiClient.get<{ results: Vehicle[]; count: number }>('/hardware/vehicles/', { params }),
  
  get: (id: number) => 
    apiClient.get<Vehicle>(`/hardware/vehicles/${id}/`),
  
  create: (data: Partial<Vehicle>) => 
    apiClient.post<Vehicle>('/hardware/vehicles/', data),
  
  update: (id: number, data: Partial<Vehicle>) => 
    apiClient.put<Vehicle>(`/hardware/vehicles/${id}/`, data),
  
  delete: (id: number) => 
    apiClient.delete(`/hardware/vehicles/${id}/`),
  
  getAvailable: () => 
    apiClient.get<Vehicle[]>('/hardware/vehicles/available/'),
};

export const deliveryAPI = {
  list: (params?: DeliveryListParams) => 
    apiClient.get<{ results: Delivery[]; count: number }>('/hardware/deliveries/', { params }),
  
  get: (id: number) => 
    apiClient.get<Delivery>(`/hardware/deliveries/${id}/`),
  
  create: (data: CreateDeliveryData) => 
    apiClient.post<Delivery>('/hardware/deliveries/', data),
  
  update: (id: number, data: Partial<CreateDeliveryData>) => 
    apiClient.put<Delivery>(`/hardware/deliveries/${id}/`, data),
  
  updateStatus: (id: number, data: UpdateDeliveryStatusData) => 
    apiClient.post<Delivery>(`/hardware/deliveries/${id}/update_status/`, data),
  
  markDelivered: (id: number) => 
    apiClient.post<Delivery>(`/hardware/deliveries/${id}/mark_delivered/`),
  
  cancel: (id: number) => 
    apiClient.post<Delivery>(`/hardware/deliveries/${id}/cancel/`),
  
  delete: (id: number) => 
    apiClient.delete(`/hardware/deliveries/${id}/`),
  
  getStats: () => 
    apiClient.get<DeliveryStats>('/hardware/deliveries/stats/'),
  
  getUpcoming: () => 
    apiClient.get<Delivery[]>('/hardware/deliveries/upcoming/'),
  
  printChallan: (id: number) =>
    apiClient.get<Delivery>(`/hardware/deliveries/${id}/print_challan/`),
};

export interface RentalEquipment {
  id: number;
  name: string;
  category: 'power_tool' | 'machinery' | 'scaffolding' | 'measuring' | 'other';
  category_display: string;
  total_units: number;
  daily_rate: string | number;
  deposit_amount: string | number;
  is_active: boolean;
  notes?: string;
  units_out: number;
  units_available: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRentalEquipmentData {
  name: string;
  category: RentalEquipment['category'];
  total_units: number;
  daily_rate: string | number;
  deposit_amount?: string | number;
  is_active?: boolean;
  notes?: string;
}

export interface Rental {
  id: number;
  equipment: number;
  equipment_name: string;
  customer: number;
  customer_name: string;
  customer_phone?: string;
  quantity: number;
  daily_rate: string | number;
  deposit_collected: string | number;
  checkout_date: string;
  due_date: string;
  return_date: string | null;
  status: 'active' | 'returned' | 'damaged' | 'lost';
  status_display: string;
  is_overdue: boolean;
  days_rented: number;
  total_charge: number;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRentalData {
  equipment: number;
  customer: number;
  quantity: number;
  checkout_date?: string;
  due_date?: string;
  daily_rate?: string | number;
  deposit_collected?: string | number;
  notes?: string;
}

export interface RentalStats {
  active: number;
  overdue: number;
  returned_this_month: number;
}

export const rentalEquipmentAPI = {
  list: (params?: { active_only?: boolean }) =>
    apiClient.get<{ results: RentalEquipment[]; count: number }>('/hardware/rental-equipment/', {
      params: params?.active_only ? { active_only: '1' } : undefined,
    }),

  create: (data: CreateRentalEquipmentData) =>
    apiClient.post<RentalEquipment>('/hardware/rental-equipment/', data),

  update: (id: number, data: Partial<CreateRentalEquipmentData>) =>
    apiClient.put<RentalEquipment>(`/hardware/rental-equipment/${id}/`, data),

  setActive: (id: number, isActive: boolean) =>
    apiClient.patch<RentalEquipment>(`/hardware/rental-equipment/${id}/`, { is_active: isActive }),

  delete: (id: number) =>
    apiClient.delete(`/hardware/rental-equipment/${id}/`),
};

export const rentalAPI = {
  list: (params?: { status?: string; customer?: number }) =>
    apiClient.get<{ results: Rental[]; count: number }>('/hardware/rentals/', { params }),

  get: (id: number) =>
    apiClient.get<Rental>(`/hardware/rentals/${id}/`),

  create: (data: CreateRentalData) =>
    apiClient.post<Rental>('/hardware/rentals/', data),

  update: (id: number, data: Partial<CreateRentalData>) =>
    apiClient.put<Rental>(`/hardware/rentals/${id}/`, data),

  delete: (id: number) =>
    apiClient.delete(`/hardware/rentals/${id}/`),

  markReturned: (id: number, data?: { return_date?: string; status?: 'returned' | 'damaged' | 'lost'; notes?: string }) =>
    apiClient.post<Rental>(`/hardware/rentals/${id}/mark_returned/`, data || {}),

  overdue: () =>
    apiClient.get<Rental[]>('/hardware/rentals/overdue/'),

  stats: () =>
    apiClient.get<RentalStats>('/hardware/rentals/stats/'),
};

export default deliveryAPI;
