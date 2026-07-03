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
  list: async (params?: { is_read?: boolean }) => {
    const response = await apiClient.get<{ results?: AppNotification[] } | AppNotification[]>(
      '/auth/notifications/',
      { params },
    );
    const data = response.data;
    return Array.isArray(data) ? data : data.results || [];
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
