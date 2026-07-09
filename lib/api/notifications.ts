import apiClient from './client';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  level: string;
  reference_type?: string;
  reference_id?: number | null;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string | null;
  action_url?: string;
  created_at: string;
}

export const notificationsAPI = {
  list: async (params?: { is_read?: boolean; page_size?: number }) => {
    const response = await apiClient.get<{ results?: AppNotification[] } | AppNotification[]>(
      '/auth/notifications/',
      { params: { page_size: params?.page_size ?? 100, ...params } },
    );
    const data = response.data;
    return Array.isArray(data) ? data : data.results || [];
  },

  listRecent: async (limit = 5) => {
    const { fetchAllPages } = await import('./settings-helpers');
    const all = await fetchAllPages<AppNotification>('/auth/notifications/');
    return all.slice(0, limit);
  },

  markRead: async (id: number) => {
    const response = await apiClient.post<AppNotification>(`/auth/notifications/${id}/mark-read/`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await apiClient.post<{ updated: number }>('/auth/notifications/mark-all-read/');
    return response.data;
  },
};
