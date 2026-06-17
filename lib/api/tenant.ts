import apiClient from './client';

export interface TenantData {
  name: string;
  business_type: string;
  address?: string;
  accounting_start_date?: string;
  vat_registered?: boolean;
  workspace_name?: string;
  owner_name?: string;
  email?: string;
  phone?: string;
  active_modules?: string[];
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  business_type: string;
  address: string;
  accounting_start_date?: string;
  vat_registered: boolean;
  workspace_name: string;
  owner_name: string;
  email: string;
  phone: string;
  logo?: string | null;
  is_active: boolean;
  plan_type: string;
  active_modules: string[];
  created_at: string;
  updated_at: string;
  created_by: number | null;
  user_role?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const tenantApi = {
  // Get all tenants (handles pagination)
  getAll: async (): Promise<Tenant[]> => {
    const response = await apiClient.get('/tenants/');
    // Handle paginated response
    if (response.data.results) {
      return response.data.results;
    }
    // Handle non-paginated response (just in case)
    return Array.isArray(response.data) ? response.data : [];
  },

  // Create a new tenant
  create: async (data: TenantData): Promise<Tenant> => {
    const response = await apiClient.post('/tenants/', data);
    return response.data;
  },

  // Get tenant by slug
  getBySlug: async (slug: string): Promise<Tenant> => {
    const response = await apiClient.get(`/tenants/${slug}/`);
    return response.data;
  },

  // Get tenant profile
  getProfile: async (slug: string): Promise<Tenant> => {
    const response = await apiClient.get('/tenants/profile/', {
      params: { slug }
    });
    return response.data;
  },

  // Activate module
  activateModule: async (slug: string, moduleName: string): Promise<Tenant> => {
    const response = await apiClient.post(`/tenants/${slug}/activate_module/`, {
      module_name: moduleName
    });
    return response.data;
  },

  // Deactivate module
  deactivateModule: async (slug: string, moduleName: string): Promise<Tenant> => {
    const response = await apiClient.post(`/tenants/${slug}/deactivate_module/`, {
      module_name: moduleName
    });
    return response.data;
  },

  // Get current tenant settings
  getCurrent: async (): Promise<Tenant> => {
    const response = await apiClient.get('/tenants/current/');
    return response.data;
  },

  // Update current tenant settings
  updateCurrent: async (data: Partial<TenantData>): Promise<Tenant> => {
    const response = await apiClient.patch('/tenants/update_current/', data);
    return response.data;
  },

  // Update tenant by slug
  update: async (slug: string, data: Partial<TenantData>): Promise<Tenant> => {
    const response = await apiClient.patch(`/tenants/${slug}/`, data);
    return response.data;
  },

  // Delete tenant by slug
  delete: async (slug: string): Promise<void> => {
    await apiClient.delete(`/tenants/${slug}/`);
  },
};


// Invitation types
export interface Invitation {
  id: number;
  tenant: number;
  tenant_name: string;
  invited_user: number;
  invited_user_name: string;
  invited_by: number;
  invited_by_name: string;
  role: 'admin' | 'manager' | 'supervisor' | 'accountant' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  message: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  responded_at?: string;
  is_expired: boolean;
}

export interface InvitationCreate {
  invited_user_email: string;
  role: string;
  message?: string;
}

// Invitation API
export const invitationApi = {
  // Get all invitations (sent and received)
  getAll: () => apiClient.get<Invitation[]>('/tenants/invitations/'),
  
  // Get invitations received by current user
  getReceived: () => apiClient.get<Invitation[]>('/tenants/invitations/received/'),
  
  // Get invitations sent by current user's organization
  getSent: () => apiClient.get<Invitation[]>('/tenants/invitations/sent/'),
  
  // Create new invitation
  create: (data: InvitationCreate) => apiClient.post<Invitation>('/tenants/invitations/', data),
  
  // Respond to invitation (accept/decline)
  respond: (id: number, action: 'accept' | 'decline') => 
    apiClient.post<{ message: string; invitation: Invitation }>(`/tenants/invitations/${id}/respond/`, { action }),
  
  // Cancel invitation
  cancel: (id: number) => 
    apiClient.post<{ message: string; invitation: Invitation }>(`/tenants/invitations/${id}/cancel/`),
  
  // Delete invitation
  delete: (id: number) => apiClient.delete(`/tenants/invitations/${id}/`),
};
