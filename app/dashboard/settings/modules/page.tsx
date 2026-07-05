"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Shield, ChevronRight } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { OrganizationModulePicker } from "@/components/settings/OrganizationModulePicker";
import { tenantApi, type Tenant } from "@/lib/api/tenant";
import {
  ORG_MODULE_CATALOG,
  isModuleActive,
  isModuleInActiveList,
  isRequiredModule,
} from "@/lib/modules/catalog";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";

export default function OrganizationModulesPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tenantMeta, setTenantMeta] = useState<Pick<Tenant, "slug" | "plan_type" | "user_role"> | null>(
    null
  );
  const [activeModules, setActiveModules] = useState<string[]>([]);

  const canEdit = tenantMeta?.user_role === "admin" || user?.role === "admin";
  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";

  const enabledCount = useMemo(
    () => ORG_MODULE_CATALOG.filter((m) => isModuleActive(activeModules, m.id)).length,
    [activeModules]
  );

  const optionalEnabled = useMemo(
    () =>
      ORG_MODULE_CATALOG.filter(
        (m) => !isRequiredModule(m.id) && isModuleInActiveList(activeModules, m.id)
      ).length,
    [activeModules]
  );

  const loadTenantData = useCallback(async () => {
    try {
      const data = await tenantApi.getCurrent();
      setTenantMeta({
        slug: data.slug,
        plan_type: data.plan_type,
        user_role: data.user_role,
      });
      setActiveModules(data.active_modules || []);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        toast.error("No organization selected. Open a Khata from ERP first.");
        setTimeout(() => router.push("/erp"), 1500);
      } else {
        toast.error("Failed to load modules");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  const handleModulesUpdated = async (modules: string[]) => {
    setActiveModules(modules);
    await refreshUser();
  };

  const planLabel = tenantMeta?.plan_type
    ? tenantMeta.plan_type.charAt(0).toUpperCase() +
      tenantMeta.plan_type.slice(1).replace(/_/g, " ")
    : "Free";

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Modules" subtitle="Choose which Khata modules your organization uses" />
        <div className="flex-1 p-6">
          <div className="rounded-xl border border-gray-100 dark:border-border bg-white dark:bg-card p-8 animate-pulse">
            <div className="h-4 w-48 bg-gray-100 dark:bg-muted rounded mb-6" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-gray-50 dark:bg-muted/50 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tenantMeta?.slug) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader
        title="Modules"
        subtitle={`${workspaceName} · Toggle modules for your team`}
      />

      <div className="flex-1 p-6">
        <div className="rounded-xl border border-gray-100 dark:border-border bg-white dark:bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                {enabledCount} modules enabled
              </p>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
                {optionalEnabled} optional · {planLabel} plan
                {!canEdit && " · View only"}
              </p>
            </div>
            <Link
              href="/dashboard/settings/org"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#22C55E] hover:text-[#16A34A]"
            >
              Organization settings
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!canEdit && (
            <div className="mx-6 mt-5 flex items-start gap-2.5 rounded-lg border border-amber-200/70 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/5 px-3.5 py-3 text-xs text-amber-900 dark:text-amber-200">
              <Shield className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Only admins can change modules. Contact an organization admin to make updates.</p>
            </div>
          )}

          <div className="p-6">
            <OrganizationModulePicker
              tenantSlug={tenantMeta.slug}
              activeModules={activeModules}
              canEdit={canEdit}
              onUpdated={handleModulesUpdated}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
