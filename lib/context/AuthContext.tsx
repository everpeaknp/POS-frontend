"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, User, LoginCredentials, RegisterData } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      console.log('[AuthContext] Loading user...');
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Add cache-busting parameter to ensure fresh data
          const userData = await authApi.getProfile();
          console.log('[AuthContext] User loaded:', userData);
          console.log('[AuthContext] User has tenant:', userData.tenant !== null);
          if (userData.tenant) {
            console.log('[AuthContext] Tenant details:', userData.tenant);
          }
          setUser(userData);
        } catch (error: any) {
          console.error('[AuthContext] Failed to load user:', error);
          
          // If 403 or 401, token is invalid/expired - clear it
          if (error?.response?.status === 403 || error?.response?.status === 401) {
            console.log('[AuthContext] Token is invalid or expired, clearing auth data');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            document.cookie = 'access_token=; path=/; max-age=0';
            document.cookie = 'refresh_token=; path=/; max-age=0';
          }
        }
      } else {
        console.log('[AuthContext] No token found');
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('[AuthContext] Starting login...');
      const { access, refresh } = await authApi.login(credentials);
      
      // Store in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Store in cookies for middleware (client-side cookie)
      document.cookie = `access_token=${access}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      document.cookie = `refresh_token=${refresh}; path=/; max-age=${60 * 60 * 24 * 30}`; // 30 days

      console.log('[AuthContext] Fetching user profile...');
      const userData = await authApi.getProfile();
      setUser(userData);
      
      console.log('[AuthContext] Redirecting to /erp...');
      // Redirect to ERP workspace page to show tenant info
      router.push('/erp');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await authApi.register(data);
      // Don't auto-login - let user go to login page
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Clear cookies
    document.cookie = 'access_token=; path=/; max-age=0';
    document.cookie = 'refresh_token=; path=/; max-age=0';
    
    setUser(null);
    router.push('/auth/login');
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      // Import userApi here to avoid circular dependency
      const { userApi } = await import('@/lib/api/user');
      const updatedUser = await userApi.updateProfile(data as any);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      console.log('[AuthContext] Refreshing user data...');
      const userData = await authApi.getProfile();
      console.log('[AuthContext] Fresh user data received:', userData);
      console.log('[AuthContext] User has tenant:', userData.tenant !== null);
      if (userData.tenant) {
        console.log('[AuthContext] Tenant:', userData.tenant);
      }
      setUser(userData);
      console.log('[AuthContext] User state updated');
    } catch (error) {
      console.error('[AuthContext] Refresh user failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
