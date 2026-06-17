import apiClient from './client';
import type { 
  User, 
  NotificationPreferences,
  AppearancePreferences,
  Session, 
  PasswordChangeData,
  ProfileUpdateData 
} from '@/lib/types/user';

export const userApi = {
  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/profile/');
    return response.data;
  },

  // Update user profile (name, phone, avatar)
  updateProfile: async (data: ProfileUpdateData): Promise<User> => {
    const formData = new FormData();
    
    if (data.first_name) formData.append('first_name', data.first_name);
    if (data.last_name) formData.append('last_name', data.last_name);
    if (data.phone) formData.append('phone', data.phone);
    if (data.avatar) formData.append('avatar', data.avatar);
    
    const response = await apiClient.patch('/auth/me/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Change password
  changePassword: async (data: PasswordChangeData): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/password/', data);
    return response.data;
  },

  // Get notification preferences
  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get('/auth/preferences/');
    return response.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (
    data: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const response = await apiClient.patch('/auth/preferences/update/', data);
    return response.data;
  },

  // Get active sessions
  getSessions: async (): Promise<Session[]> => {
    const response = await apiClient.get('/auth/sessions/');
    return response.data;
  },

  // Revoke a session
  revokeSession: async (sessionId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/auth/sessions/${sessionId}/`);
    return response.data;
  },

  // Get appearance preferences
  getAppearancePreferences: async (): Promise<AppearancePreferences> => {
    const response = await apiClient.get('/auth/appearance/');
    return response.data;
  },

  // Update appearance preferences
  updateAppearancePreferences: async (
    data: Partial<AppearancePreferences>
  ): Promise<AppearancePreferences> => {
    const response = await apiClient.patch('/auth/appearance/update/', data);
    return response.data;
  },
};
