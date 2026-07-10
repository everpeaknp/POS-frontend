import apiClient from './client';
import { CONSTRUCTION_LIST_PARAMS, unwrapList } from './construction-helpers';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Site {
  id: string;
  name: string;
  location: string;
  client_name?: string;
  allocated_budget: number;
  start_date: string;
  estimated_end_date?: string;
  actual_end_date?: string;
  manager: string;
  manager_name?: string;
  status: 'planned' | 'active' | 'on_hold' | 'completed';
  warehouse: string;
  warehouse_name?: string;
  description?: string;
  // Calculated fields
  material_cost?: number;
  labor_cost?: number;
  equipment_cost?: number;
  other_expenses?: number;
  actual_spend?: number;
  remaining_budget?: number;
  budget_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  category: 'mason' | 'laborer' | 'carpenter' | 'electrician' | 'plumber' | 'engineer' | 'supervisor' | 'helper' | 'painter' | 'welder' | 'driver' | 'operator' | 'other';
  daily_wage: number;
  assigned_site?: string;
  assigned_site_name?: string;
  status: 'active' | 'inactive';
  id_number?: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  worker: string;
  worker_name?: string;
  worker_category?: string;
  site: string;
  site_name?: string;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'overtime';
  check_in?: string;
  check_out?: string;
  wage_amount: number;
  notes?: string;
  marked_by?: string;
  marked_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialConsumption {
  id: string;
  daily_log?: string;
  site: string;
  site_name?: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  product_unit?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  site: string;
  site_name?: string;
  date: string;
  work_description: string;
  progress_notes?: string;
  progress_photos?: string[];
  weather?: string;
  other_expenses: number;
  other_expenses_description?: string;
  submitted_by?: string;
  submitted_by_name?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  manager_comments?: string;
  material_consumptions?: MaterialConsumption[];
  is_editable?: boolean;
  hours_until_immutable?: number;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  ownership_type: 'owned' | 'rented';
  purchase_cost?: number;
  rental_cost_per_day?: number;
  assigned_site?: string;
  assigned_site_name?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  registration_number?: string;
  purchase_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentUsageLog {
  id: string;
  equipment: string;
  equipment_name?: string;
  site: string;
  site_name?: string;
  daily_log?: string;
  date: string;
  hours_used: number;
  cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SiteReport {
  site_id: string;
  site_name: string;
  location: string;
  client_name?: string;
  manager: string;
  status: string;
  allocated_budget: number;
  material_cost: number;
  labor_cost: number;
  equipment_cost: number;
  other_expenses: number;
  total_actual_spend: number;
  remaining_budget: number;
  budget_percentage: number;
  budget_health: 'green' | 'yellow' | 'red';
  start_date: string;
  estimated_end_date?: string;
  actual_end_date?: string;
}

export interface PayrollWorkerBreakdown {
  worker_id: string;
  worker_name: string;
  category: string;
  daily_wage?: number;
  days_present: number;
  days_half_day: number;
  days_overtime: number;
  days_absent?: number;
  total_wage: number;
}

export interface SitePayrollSummary {
  site_id: string;
  site_name: string;
  month: number;
  year: number;
  total_payroll: number;
  worker_count: number;
  worker_breakdown: PayrollWorkerBreakdown[];
}

// ============================================================================
// SITES API
// ============================================================================

export const sitesAPI = {
  // List all sites
  list: async (params?: {
    status?: string;
    manager?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get<{ results: Site[]; count: number; next: string | null; previous: string | null }>('/construction/sites/', {
      params: { ...CONSTRUCTION_LIST_PARAMS, ...params },
    });
    return unwrapList(response.data);
  },

  // Get site by ID
  get: async (id: string) => {
    const response = await apiClient.get<Site>(`/construction/sites/${id}/`);
    return response.data;
  },

  // Create new site
  create: async (data: Partial<Site>) => {
    const response = await apiClient.post<Site>('/construction/sites/', data);
    return response.data;
  },

  // Update site
  update: async (id: string, data: Partial<Site>) => {
    const response = await apiClient.put<Site>(`/construction/sites/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<Site>) => {
    const response = await apiClient.patch<Site>(`/construction/sites/${id}/`, data);
    return response.data;
  },

  // Delete site
  delete: async (id: string) => {
    await apiClient.delete(`/construction/sites/${id}/`);
  },

  // Generate site report
  generateReport: async (id: string) => {
    const response = await apiClient.get<SiteReport>(`/construction/sites/${id}/generate_site_report/`);
    return response.data;
  },

  // Get site dashboard
  dashboard: async (id: string) => {
    const response = await apiClient.get(`/construction/sites/${id}/dashboard/`);
    return response.data;
  },
};

// ============================================================================
// WORKERS API
// ============================================================================

export const workersAPI = {
  // List all workers
  list: async (params?: {
    category?: string;
    status?: string;
    assigned_site?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get<{ results: Worker[]; count: number; next: string | null; previous: string | null }>('/construction/workers/', {
      params: { ...CONSTRUCTION_LIST_PARAMS, ...params },
    });
    return unwrapList(response.data);
  },

  // Get worker by ID
  get: async (id: string) => {
    const response = await apiClient.get<Worker>(`/construction/workers/${id}/`);
    return response.data;
  },

  // Create new worker
  create: async (data: Partial<Worker>) => {
    const response = await apiClient.post<Worker>('/construction/workers/', data);
    return response.data;
  },

  // Update worker
  update: async (id: string, data: Partial<Worker>) => {
    const response = await apiClient.put<Worker>(`/construction/workers/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<Worker>) => {
    const response = await apiClient.patch<Worker>(`/construction/workers/${id}/`, data);
    return response.data;
  },

  // Delete worker
  delete: async (id: string) => {
    await apiClient.delete(`/construction/workers/${id}/`);
  },
};

// ============================================================================
// ATTENDANCE API
// ============================================================================

export const attendanceAPI = {
  // List all attendance records
  list: async (params?: {
    worker?: string;
    site?: string;
    date?: string;
    date__gte?: string;
    date__lte?: string;
    status?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get<{ results: Attendance[]; count: number; next: string | null; previous: string | null } | Attendance[]>(
      '/construction/attendance/',
      { params: { ...CONSTRUCTION_LIST_PARAMS, ...params } },
    );
    return unwrapList(response.data);
  },

  // Get attendance by ID
  get: async (id: string) => {
    const response = await apiClient.get<Attendance>(`/construction/attendance/${id}/`);
    return response.data;
  },

  // Mark attendance
  create: async (data: Partial<Attendance>) => {
    const response = await apiClient.post<Attendance>('/construction/attendance/', data);
    return response.data;
  },

  // Update attendance
  update: async (id: string, data: Partial<Attendance>) => {
    const response = await apiClient.put<Attendance>(`/construction/attendance/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<Attendance>) => {
    const response = await apiClient.patch<Attendance>(`/construction/attendance/${id}/`, data);
    return response.data;
  },

  // Delete attendance
  delete: async (id: string) => {
    await apiClient.delete(`/construction/attendance/${id}/`);
  },

  // Bulk mark attendance
  bulkMark: async (data: {
    site: string;
    date: string;
    attendances: Array<{
      worker: string;
      status: string;
      check_in?: string;
      check_out?: string;
    }>;
  }) => {
    const response = await apiClient.post('/construction/attendance/bulk_mark/', data);
    return response.data;
  },

  payrollSummaryBySite: async (params: { site: string; month: number; year: number }) => {
    const response = await apiClient.get<SitePayrollSummary>(
      '/construction/attendance/payroll_summary_by_site/',
      { params },
    );
    return response.data;
  },

  payrollSummaryByWorker: async (params: { worker: string; month: number; year: number }) => {
    const response = await apiClient.get('/construction/attendance/payroll_summary_by_worker/', { params });
    return response.data;
  },
};

// ============================================================================
// DAILY LOGS API
// ============================================================================

export const dailyLogsAPI = {
  // List all daily logs
  list: async (params?: {
    site?: string;
    date?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get<{ results: DailyLog[]; count: number; next: string | null; previous: string | null } | DailyLog[]>(
      '/construction/daily-logs/',
      { params: { ...CONSTRUCTION_LIST_PARAMS, ...params } },
    );
    return unwrapList(response.data);
  },

  // Get daily log by ID
  get: async (id: string) => {
    const response = await apiClient.get<DailyLog>(`/construction/daily-logs/${id}/`);
    return response.data;
  },

  // Create daily log (with material consumption)
  create: async (data: Partial<DailyLog> & { material_consumptions?: Partial<MaterialConsumption>[] }) => {
    const response = await apiClient.post<DailyLog>('/construction/daily-logs/', data);
    return response.data;
  },

  // Update daily log
  update: async (id: string, data: Partial<DailyLog>) => {
    const response = await apiClient.put<DailyLog>(`/construction/daily-logs/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<DailyLog>) => {
    const response = await apiClient.patch<DailyLog>(`/construction/daily-logs/${id}/`, data);
    return response.data;
  },

  // Delete daily log
  delete: async (id: string) => {
    await apiClient.delete(`/construction/daily-logs/${id}/`);
  },

  // Review daily log
  review: async (id: string, comments: string) => {
    const response = await apiClient.post<DailyLog>(`/construction/daily-logs/${id}/review/`, { comments });
    return response.data;
  },
};

// ============================================================================
// MATERIAL CONSUMPTION API
// ============================================================================

export const materialConsumptionAPI = {
  // List all material consumption
  list: async (params?: {
    site?: string;
    daily_log?: string;
    product?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get<{ results: MaterialConsumption[]; count: number; next: string | null; previous: string | null } | MaterialConsumption[]>(
      '/construction/material-consumption/',
      { params: { ...CONSTRUCTION_LIST_PARAMS, ...params } },
    );
    return unwrapList(response.data);
  },

  // Get material consumption by ID
  get: async (id: string) => {
    const response = await apiClient.get<MaterialConsumption>(`/construction/material-consumption/${id}/`);
    return response.data;
  },

  // Log material consumption
  create: async (data: Partial<MaterialConsumption>) => {
    const response = await apiClient.post<MaterialConsumption>('/construction/material-consumption/', data);
    return response.data;
  },

  // Update material consumption
  update: async (id: string, data: Partial<MaterialConsumption>) => {
    const response = await apiClient.put<MaterialConsumption>(`/construction/material-consumption/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<MaterialConsumption>) => {
    const response = await apiClient.patch<MaterialConsumption>(`/construction/material-consumption/${id}/`, data);
    return response.data;
  },

  // Delete material consumption
  delete: async (id: string) => {
    await apiClient.delete(`/construction/material-consumption/${id}/`);
  },
};

// ============================================================================
// EQUIPMENT API
// ============================================================================

export const equipmentAPI = {
  // List all equipment
  list: async (params?: {
    ownership_type?: string;
    status?: string;
    assigned_site?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get<{ results: Equipment[]; count: number; next: string | null; previous: string | null } | Equipment[]>(
      '/construction/equipment/',
      { params: { ...CONSTRUCTION_LIST_PARAMS, ...params } },
    );
    return unwrapList(response.data);
  },

  // Get equipment by ID
  get: async (id: string) => {
    const response = await apiClient.get<Equipment>(`/construction/equipment/${id}/`);
    return response.data;
  },

  // Create new equipment
  create: async (data: Partial<Equipment>) => {
    const response = await apiClient.post<Equipment>('/construction/equipment/', data);
    return response.data;
  },

  // Update equipment
  update: async (id: string, data: Partial<Equipment>) => {
    const response = await apiClient.put<Equipment>(`/construction/equipment/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<Equipment>) => {
    const response = await apiClient.patch<Equipment>(`/construction/equipment/${id}/`, data);
    return response.data;
  },

  // Delete equipment
  delete: async (id: string) => {
    await apiClient.delete(`/construction/equipment/${id}/`);
  },
};

// ============================================================================
// EQUIPMENT USAGE API
// ============================================================================

export const equipmentUsageAPI = {
  // List all equipment usage logs
  list: async (params?: {
    equipment?: string;
    site?: string;
    date?: string;
    search?: string;
    ordering?: string;
  }) => {
    const response = await apiClient.get<{ results: EquipmentUsageLog[]; count: number; next: string | null; previous: string | null } | EquipmentUsageLog[]>(
      '/construction/equipment-usage/',
      { params: { ...CONSTRUCTION_LIST_PARAMS, ...params } },
    );
    return unwrapList(response.data);
  },

  // Get equipment usage log by ID
  get: async (id: string) => {
    const response = await apiClient.get<EquipmentUsageLog>(`/construction/equipment-usage/${id}/`);
    return response.data;
  },

  // Log equipment usage
  create: async (data: Partial<EquipmentUsageLog>) => {
    const response = await apiClient.post<EquipmentUsageLog>('/construction/equipment-usage/', data);
    return response.data;
  },

  // Update equipment usage log
  update: async (id: string, data: Partial<EquipmentUsageLog>) => {
    const response = await apiClient.put<EquipmentUsageLog>(`/construction/equipment-usage/${id}/`, data);
    return response.data;
  },

  // Partial update
  patch: async (id: string, data: Partial<EquipmentUsageLog>) => {
    const response = await apiClient.patch<EquipmentUsageLog>(`/construction/equipment-usage/${id}/`, data);
    return response.data;
  },

  // Delete equipment usage log
  delete: async (id: string) => {
    await apiClient.delete(`/construction/equipment-usage/${id}/`);
  },
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

export const constructionApi = {
  sites: sitesAPI,
  workers: workersAPI,
  attendance: attendanceAPI,
  dailyLogs: dailyLogsAPI,
  materialConsumption: materialConsumptionAPI,
  equipment: equipmentAPI,
  equipmentUsage: equipmentUsageAPI,
};

export default constructionApi;
