import axios from 'axios';
import apiClient, { API_BASE_URL } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username?: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
  tenant_name?: string; // For creating organization
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  workspace_name?: string;
  address?: string;
  email?: string;
  business_type: string;
  is_active: boolean;
  plan_type: string;
  active_modules: string[];
  created_by?: number | null;
}

export interface UserPermissions {
  is_admin: boolean;
  is_manager: boolean;
  is_supervisor: boolean;
  is_accountant: boolean;
  is_viewer: boolean;
  can_approve_purchases: boolean;
  can_manage_users: boolean;
  can_view_financials: boolean;
  can_edit_data: boolean;
    modules: {
    sales: boolean;
    purchase: boolean;
    inventory: boolean;
    construction: boolean;
    accounting: boolean;
    reports: boolean;
    pos: boolean;
    hr: boolean;
    hardware: boolean;
    settings: boolean;
    dashboard: boolean;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  avatar?: string;
  tenant: Tenant | null;
  permissions?: UserPermissions;
  is_super_admin?: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  session_id?: string;
}

export interface GoogleOAuthConfig {
  enabled: boolean;
  client_id: string;
}

export const authApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login/', credentials);
    return response.data;
  },

  getGoogleConfig: async (): Promise<GoogleOAuthConfig> => {
    // Use plain axios (no JWT interceptor). Stale Electron tokens make DRF
    // return 401 on this public route, which hides the Google button.
    const response = await axios.get<GoogleOAuthConfig>(
      `${API_BASE_URL}/auth/google/config/`
    );
    return response.data;
  },

  loginWithGoogle: async (payload: string | { credential?: string; code?: string }): Promise<AuthResponse> => {
    const body =
      typeof payload === 'string'
        ? { credential: payload }
        : {
            credential: payload.credential || undefined,
            code: payload.code || undefined,
          };
    const response = await apiClient.post('/auth/google/', body);
    return response.data;
  },

  // Register
  register: async (data: RegisterData): Promise<User> => {
    const response = await apiClient.post('/auth/register/', data);
    return response.data;
  },

  // Get user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/profile/');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/auth/profile/', data);
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  // Get users list (with optional role filter)
  getUsers: async (params?: { role?: string }): Promise<User[]> => {
    const response = await apiClient.get('/auth/users/', { params });
    return response.data.results || response.data;
  },
};


// Permissions API
export interface PermissionsMatrix {
  Admin?: Record<string, boolean>;
  Manager?: Record<string, boolean>;
  Supervisor?: Record<string, boolean>;
  Accountant?: Record<string, boolean>;
  Cashier?: Record<string, boolean>;
  Viewer?: Record<string, boolean>;
}

export interface EmployeeInviteOption {
  id: string;
  name: string;
  email: string;
  designation: string;
}

export const usersApi = {
  getEmployeeInviteOptions: async (): Promise<{ results: EmployeeInviteOption[] }> => {
    const response = await apiClient.get('/auth/users/employee-invite-options/');
    return response.data;
  },
};

export const permissionsApi = {
  // Get full permissions matrix (admin/manager settings only)
  getPermissions: async (): Promise<PermissionsMatrix> => {
    const response = await apiClient.get('/auth/permissions/');
    return response.data;
  },

  // Get current user's role permissions (all authenticated users)
  getMyPermissions: async (): Promise<PermissionsMatrix> => {
    const response = await apiClient.get('/auth/permissions/me/');
    return response.data;
  },

  // Update permissions matrix
  updatePermissions: async (permissions: PermissionsMatrix): Promise<{ message: string; updated_count: number }> => {
    const response = await apiClient.post('/auth/permissions/update/', permissions);
    return response.data;
  },
};
