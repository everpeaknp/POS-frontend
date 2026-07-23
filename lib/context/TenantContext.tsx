"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import apiClient from "@/lib/api/client";
import { NotFoundView } from "@/components/shared/NotFoundView";
import { PageLoading } from "@/components/shared/PageLoading";

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
  plan_type: "free" | "basic" | "premium" | "enterprise";
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

/** Paths that must never be treated as workspace slugs */
const RESERVED_SLUGS = new Set([
  "404",
  "auth",
  "dashboard",
  "erp",
  "settings",
  "invite",
  "onboarding",
  "workspace",
  "api",
  "debug-pos",
  "_next",
]);

export function TenantProvider({
  children,
  slug,
}: {
  children: React.ReactNode;
  slug: string;
}) {
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const loadTenant = async (tenantSlug: string) => {
    if (RESERVED_SLUGS.has(tenantSlug.toLowerCase())) {
      setTenant(null);
      setError("Tenant not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/tenants/profile/?slug=${tenantSlug}`);
      const tenantData = response.data;

      if (user && user.tenant && user.tenant.slug !== tenantSlug) {
        router.replace(`/${user.tenant.slug}`);
        return;
      }

      setTenant(tenantData);
    } catch (err: unknown) {
      console.error("Failed to load tenant:", err);
      const status = (err as { response?: { status?: number } })?.response?.status;

      if (status === 404) {
        setError("Tenant not found");
      } else if (status === 401) {
        setError("Unauthorized");
        router.replace("/auth/login");
      } else {
        setError("Failed to load tenant data");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user]);

  if (loading) {
    return <PageLoading fullScreen message="Loading workspace…" />;
  }

  if (error === "Tenant not found" || (!tenant && error)) {
    return (
      <NotFoundView
        variant="full"
        title="Workspace not found"
        description="The workspace you are looking for does not exist or you do not have access to it."
        primaryHref="/erp"
        primaryLabel="Your organizations"
        secondaryHref="/dashboard"
        secondaryLabel="Dashboard"
      />
    );
  }

  return (
    <TenantContext.Provider value={{ tenant, loading, error, loadTenant, hasModule }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
