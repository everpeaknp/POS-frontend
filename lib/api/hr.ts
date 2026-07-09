import apiClient from './client';
import { HR_LIST_PARAMS, unwrapList } from './hr-helpers';

export interface Department {
  id: string;
  name: string;
  description?: string;
  head?: string;
  head_name?: string;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  department: string;
  department_name?: string;
  designation: string;
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Probation';
  join_date: string;
  basic_salary: number;
  pf_employee?: number;
  pf_employer?: number;
  total_pf?: number;
  gross_salary?: number;
  status: 'active' | 'inactive' | 'terminated';
  user?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
  name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  department: string;
  designation: string;
  employment_type: string;
  join_date: string;
  basic_salary: number | string;
  status?: string;
  user?: string;
}

export function buildEmployeePayload(data: EmployeeFormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: data.name.trim(),
    dob: data.dob,
    gender: data.gender,
    phone: data.phone.trim(),
    email: data.email.trim(),
    department: Number(data.department),
    designation: data.designation,
    employment_type: data.employment_type,
    join_date: data.join_date,
    basic_salary: Number(data.basic_salary),
    status: data.status ?? 'active',
  };
  if (data.user) {
    payload.user = data.user;
  }
  return payload;
}

export interface Attendance {
  id: string;
  employee: string;
  employee_name: string;
  department_name: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
  check_in?: string;
  check_out?: string;
  remarks?: string;
  hours_worked?: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  employee: string;
  status: string;
  check_in?: string;
  check_out?: string;
  remarks?: string;
}

export interface BulkAttendanceData {
  date: string;
  records: AttendanceRecord[];
}

export interface LeaveType {
  id: string;
  name: string;
  days_allowed: number;
  description?: string;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  days_requested: number;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// Departments
export const getDepartments = async (): Promise<Department[]> => {
  const response = await apiClient.get('/hr/departments/', { params: HR_LIST_PARAMS });
  return unwrapList(response.data);
};

export const getDepartment = async (id: string): Promise<Department> => {
  const response = await apiClient.get(`/hr/departments/${id}/`);
  return response.data;
};

export const createDepartment = async (data: Partial<Department>): Promise<Department> => {
  const response = await apiClient.post('/hr/departments/', data);
  return response.data;
};

export const updateDepartment = async (id: string, data: Partial<Department>): Promise<Department> => {
  const response = await apiClient.put(`/hr/departments/${id}/`, data);
  return response.data;
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await apiClient.delete(`/hr/departments/${id}/`);
};

// Employees
export const getEmployees = async (params?: Record<string, unknown>): Promise<{ results: Employee[]; count: number }> => {
  const response = await apiClient.get('/hr/employees/', { params: { ...HR_LIST_PARAMS, ...params } });
  return response.data;
};

export const getEmployee = async (id: string): Promise<Employee> => {
  const response = await apiClient.get(`/hr/employees/${id}/`);
  return response.data;
};

export const createEmployee = async (data: EmployeeFormData): Promise<Employee> => {
  const response = await apiClient.post('/hr/employees/', buildEmployeePayload(data));
  return response.data;
};

export const updateEmployee = async (id: string, data: Partial<EmployeeFormData>): Promise<Employee> => {
  const response = await apiClient.put(`/hr/employees/${id}/`, buildEmployeePayload(data as EmployeeFormData));
  return response.data;
};

/** Soft-deactivate employee (preserves payroll/attendance history). */
export const deactivateEmployee = async (id: string): Promise<void> => {
  await apiClient.delete(`/hr/employees/${id}/`);
};

/** @deprecated Use deactivateEmployee — backend performs soft deactivation. */
export const deleteEmployee = deactivateEmployee;

// Dashboard
export const getHRDashboard = async (): Promise<any> => {
  const response = await apiClient.get('/hr/employees/dashboard/');
  return response.data;
};

// Get managers/approvers
export const getManagers = async (): Promise<Array<{
  id: string;
  name: string;
  designation: string;
  department: string | null;
  email: string;
}>> => {
  const response = await apiClient.get('/hr/employees/managers/');
  return response.data;
};


// Attendance
export const getAttendance = async (params?: Record<string, unknown>): Promise<{ results: Attendance[]; count: number }> => {
  const response = await apiClient.get('/hr/attendance/', { params: { ...HR_LIST_PARAMS, ...params } });
  return response.data;
};

export const getAttendanceRecord = async (id: string): Promise<Attendance> => {
  const response = await apiClient.get(`/hr/attendance/${id}/`);
  return response.data;
};

export const createAttendance = async (data: Partial<Attendance>): Promise<Attendance> => {
  const response = await apiClient.post('/hr/attendance/', data);
  return response.data;
};

export const updateAttendance = async (id: string, data: Partial<Attendance>): Promise<Attendance> => {
  const response = await apiClient.put(`/hr/attendance/${id}/`, data);
  return response.data;
};

export const deleteAttendance = async (id: string): Promise<void> => {
  await apiClient.delete(`/hr/attendance/${id}/`);
};

export const bulkMarkAttendance = async (data: BulkAttendanceData): Promise<any> => {
  const response = await apiClient.post('/hr/attendance/bulk-mark/', data);
  return response.data;
};

export const getAttendanceStats = async (month?: string): Promise<any> => {
  const params = month ? { month } : {};
  const response = await apiClient.get('/hr/attendance/stats/', { params });
  return response.data;
};


// Leave Types
export const getLeaveTypes = async (params?: Record<string, unknown>): Promise<LeaveType[]> => {
  const response = await apiClient.get('/hr/leave-types/', { params: { ...HR_LIST_PARAMS, ...params } });
  return unwrapList(response.data);
};

export const setupDefaultLeaveTypes = async (): Promise<LeaveType[]> => {
  const response = await apiClient.post('/hr/leave-types/setup-defaults/');
  return unwrapList(response.data);
};

export const getLeaveType = async (id: string): Promise<LeaveType> => {
  const response = await apiClient.get(`/hr/leave-types/${id}/`);
  return response.data;
};

export const createLeaveType = async (data: Partial<LeaveType>): Promise<LeaveType> => {
  const response = await apiClient.post('/hr/leave-types/', data);
  return response.data;
};

export const updateLeaveType = async (id: string, data: Partial<LeaveType>): Promise<LeaveType> => {
  const response = await apiClient.put(`/hr/leave-types/${id}/`, data);
  return response.data;
};

export const deleteLeaveType = async (id: string): Promise<void> => {
  await apiClient.delete(`/hr/leave-types/${id}/`);
};


// Leave Requests
export const getLeaveRequests = async (params?: Record<string, unknown>): Promise<{ results: LeaveRequest[]; count: number }> => {
  const response = await apiClient.get('/hr/leave-requests/', { params: { ...HR_LIST_PARAMS, ...params } });
  return response.data;
};

export const getLeaveRequest = async (id: string): Promise<LeaveRequest> => {
  const response = await apiClient.get(`/hr/leave-requests/${id}/`);
  return response.data;
};

export const createLeaveRequest = async (data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
  const response = await apiClient.post('/hr/leave-requests/', data);
  return response.data;
};

export const updateLeaveRequest = async (id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
  const response = await apiClient.put(`/hr/leave-requests/${id}/`, data);
  return response.data;
};

export const deleteLeaveRequest = async (id: string): Promise<void> => {
  await apiClient.delete(`/hr/leave-requests/${id}/`);
};

export const approveLeaveRequest = async (id: string): Promise<LeaveRequest> => {
  const response = await apiClient.post(`/hr/leave-requests/${id}/approve/`);
  return response.data;
};

export const rejectLeaveRequest = async (id: string, rejection_reason?: string): Promise<LeaveRequest> => {
  const response = await apiClient.post(`/hr/leave-requests/${id}/reject/`, { rejection_reason });
  return response.data;
};


export interface Payroll {
  id: string;
  employee: string;
  employee_name: string;
  department_name: string;
  month: string;
  year: number;
  basic_salary: number;
  allowances: number;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  status: 'draft' | 'processed' | 'paid';
  processed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollCalculation {
  month: string;
  year: number;
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  payroll_data: Array<{
    employee: string;
    employee_name: string;
    department_name: string;
    month: string;
    year: number;
    basic_salary: number;
    allowances: number;
    gross_salary: number;
    deductions: number;
    net_salary: number;
  }>;
}

// Payroll
export const getPayrolls = async (params?: Record<string, unknown>): Promise<{ results: Payroll[]; count: number }> => {
  const response = await apiClient.get('/hr/payroll/', { params: { ...HR_LIST_PARAMS, ...params } });
  return response.data;
};

export const getPayroll = async (id: string): Promise<Payroll> => {
  const response = await apiClient.get(`/hr/payroll/${id}/`);
  return response.data;
};

export const calculatePayroll = async (month: string, year?: number): Promise<PayrollCalculation> => {
  const response = await apiClient.post('/hr/payroll/calculate/', { month, year });
  return response.data;
};

export const processPayroll = async (data: { month: string; year: number; payroll_data: any[] }): Promise<any> => {
  const response = await apiClient.post('/hr/payroll/process/', data);
  return response.data;
};

export const deletePayroll = async (id: string): Promise<void> => {
  await apiClient.delete(`/hr/payroll/${id}/`);
};


export interface HRReports {
  summary: {
    total_employees: number;
    active_employees: number;
    on_leave: number;
    avg_salary: number;
  };
  department_data: Array<{
    name: string;
    employee_count: number;
  }>;
  attendance_trend: Array<{
    date: string;
    rate: number;
  }>;
  employment_type_data: Array<{
    employment_type: string;
    count: number;
    percentage: number;
  }>;
}

// Reports
export const getHRReports = async (): Promise<HRReports> => {
  const response = await apiClient.get('/hr/reports/');
  return response.data;
};
