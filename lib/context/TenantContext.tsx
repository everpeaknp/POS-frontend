"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import apiClient from '@/lib/api/client';

export interface TenantProfile {
  id: number;
  name: string;
  slug: string;
  business_type: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  plan_type: 'free' | 'basic' | 'premium' | 'enterprise';
  active_modules: string[];
  created_at: string;
  updated_at: string;
}

interface TenantContextType {
  tenant: TenantProfile | null;
  loading: boolean;
  error: string | null;
  loadTenant: (slug: string) => Promise<void>;
  hasModule: (moduleName: string) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children, slug }: { children: React.ReactNode; slug: string }) {
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const loadTenant = async (tenantSlug: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tenant profile by slug
      const response = await apiClient.get(`/tenants/profile/?slug=${tenantSlug}`);
      const tenantData = response.data;

      // Verify user has access to this tenant
      if (user && user.tenant && user.tenant.slug !== tenantSlug) {
        // User trying to access wrong tenant - redirect to their tenant
        router.push(`/${user.tenant.slug}`);
        return;
      }

      setTenant(tenantData);
    } catch (err: any) {
      console.error('Failed to load tenant:', err);
      
      if (err.response?.status === 404) {
        setError('Tenant not found');
        router.push('/404');
      } else if (err.response?.status === 401) {
        setError('Unauthorized');
        router.push('/auth/login');
      } else {
        setError('Failed to load tenant data');
      }
    } finally {
      setLoading(false);
    }
  };

  const hasModule = (moduleName: string): boolean => {
    return tenant?.active_modules?.includes(moduleName) ?? false;
  };

  useEffect(() => {
    if (slug) {
      loadTenant(slug);
    }
  }, [slug, user]);

  return (
    <TenantContext.Provider value={{ tenant, loading, error, loadTenant, hasModule }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
