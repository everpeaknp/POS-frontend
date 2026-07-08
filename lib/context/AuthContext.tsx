"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { authApi, User, LoginCredentials, RegisterData } from '@/lib/api/auth';
import { tenantApi, type Tenant } from '@/lib/api/tenant';
import { notifyAppearanceRefresh } from '@/lib/theme';
import type { ProfileUpdateData } from '@/lib/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials, redirectTo?: string) => Promise<void>;
  loginWithGoogle: (credential: string, redirectTo?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: ProfileUpdateData) => Promise<void>;
  refreshUser: () => Promise<void>;
  switchOrganization: (slug: string, redirectTo?: string) => Promise<void>;
}

function toAuthTenant(tenant: Tenant): NonNullable<User['tenant']> {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    workspace_name: tenant.workspace_name,
    address: tenant.address,
    email: tenant.email,
    business_type: tenant.business_type,
    is_active: tenant.is_active,
    plan_type: tenant.plan_type,
    active_modules: tenant.active_modules,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authApi.getProfile();
          setUser(userData);
        } catch (error: any) {
          console.error('[AuthContext] Failed to load user:', error);
          
          if (error?.response?.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            document.cookie = 'access_token=; path=/; max-age=0';
            document.cookie = 'refresh_token=; path=/; max-age=0';
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const persistSession = async (
    access: string,
    refresh: string,
    session_id?: string,
    redirectTo = '/erp'
  ) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    if (session_id) {
      localStorage.setItem('session_id', session_id);
    }

    document.cookie = `access_token=${access}; path=/; max-age=${60 * 60 * 24 * 7}`;
    document.cookie = `refresh_token=${refresh}; path=/; max-age=${60 * 60 * 24 * 30}`;

    const userData = await authApi.getProfile();
    setUser(userData);
    notifyAppearanceRefresh();
    router.push(redirectTo);
  };

  const login = async (credentials: LoginCredentials, redirectTo = '/erp') => {
    try {
      const { access, refresh, session_id } = await authApi.login(credentials);
      await persistSession(access, refresh, session_id, redirectTo);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string, redirectTo = '/erp') => {
    try {
      const { access, refresh, session_id } = await authApi.loginWithGoogle(credential);
      await persistSession(access, refresh, session_id, redirectTo);
    } catch (error) {
      console.error('Google login failed:', error);
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
    localStorage.removeItem('session_id');
    
    // Clear cookies
    document.cookie = 'access_token=; path=/; max-age=0';
    document.cookie = 'refresh_token=; path=/; max-age=0';
    
    setUser(null);
    router.push('/auth/login');
  };

  const updateUser = async (data: ProfileUpdateData) => {
    try {
      const { userApi } = await import('@/lib/api/user');
      const updatedUser = await userApi.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('[AuthContext] Refresh user failed:', error);
      throw error;
    }
  };

  const switchOrganization = async (slug: string, redirectTo = '/dashboard') => {
    const switchedTenant = await tenantApi.switch(slug);
    const userData = await authApi.getProfile();
    const tenant = toAuthTenant(switchedTenant);
    const nextUser: User = {
      ...userData,
      tenant: userData.tenant?.slug === tenant.slug ? userData.tenant : tenant,
    };

    localStorage.setItem('active_tenant_slug', tenant.slug);
    flushSync(() => setUser(nextUser));
    router.push(redirectTo);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, updateUser, refreshUser, switchOrganization }}>
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
