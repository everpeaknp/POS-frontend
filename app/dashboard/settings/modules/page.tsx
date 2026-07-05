"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LayoutGrid } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { OrganizationModulePicker } from "@/components/settings/OrganizationModulePicker";
import { tenantApi, type Tenant } from "@/lib/api/tenant";
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

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Modules" subtitle="Choose which Khata modules your organization uses" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!tenantMeta?.slug) {
    return null;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader
        title="Modules"
        subtitle="Enable or disable modules for your organization — same options as when creating a new Khata"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm p-6 lg:p-8 space-y-6 w-full min-h-full">
          <div className="flex items-start gap-3 pb-2 border-b border-gray-100 dark:border-border">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 text-[#22C55E]">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-foreground">
                Choose your modules
              </h2>
              <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                Toggle modules on or off for <span className="font-medium">{user?.tenant?.workspace_name || user?.tenant?.name}</span>.
                {!canEdit && " Contact an admin to make changes."}
              </p>
            </div>
          </div>

          <OrganizationModulePicker
            tenantSlug={tenantMeta.slug}
            activeModules={activeModules}
            canEdit={canEdit}
            onUpdated={handleModulesUpdated}
          />
        </div>
      </div>
    </div>
  );
}
