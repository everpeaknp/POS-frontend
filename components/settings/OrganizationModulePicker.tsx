"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getModuleCatalogSections,
  isModuleActive,
  isModuleAllowed,
  isModuleInActiveList,
  isRequiredModule,
  ORG_MODULE_CATALOG,
  type OrgModuleDefinition,
} from "@/lib/modules/catalog";
import { tenantApi } from "@/lib/api/tenant";

interface OrganizationModulePickerProps {
  tenantSlug: string;
  activeModules: string[];
  allowedModules: string[];
  accountType?: string;
  planName?: string;
  canEdit: boolean;
  onUpdated: (modules: string[]) => void | Promise<void>;
}

export function OrganizationModulePicker({
  tenantSlug,
  activeModules,
  allowedModules,
  accountType,
  planName = "Unlimited",
  canEdit,
  onUpdated,
}: OrganizationModulePickerProps) {
  const { refreshUser } = useAuth();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const lockedCount = 0; // No restrictions

  const selectedCount = useMemo(
    () => ORG_MODULE_CATALOG.filter((m) => isModuleActive(activeModules, m.id)).length,
    [activeModules]
  );

  const toggleModule = async (moduleId: string) => {
    if (!canEdit) {
      toast.error("Only organization admins can change modules");
      return;
    }

    const enabled = isModuleInActiveList(activeModules, moduleId);
    const isRequired = isRequiredModule(moduleId);

    if (isRequired) {
      toast.error("Core modules are always included");
      return;
    }

    setTogglingId(moduleId);

    try {
      if (enabled) {
        await tenantApi.deactivateModule(tenantSlug, moduleId);
        toast.success("Module disabled");
      } else {
        await tenantApi.activateModule(tenantSlug, moduleId);
        toast.success("Module enabled");
      }

      // Refresh tenant data
      const tenant = await tenantApi.getCurrent();
      
      // Refresh user auth context to update sidebar
      await refreshUser();
      
      await onUpdated(tenant.active_modules || []);
    } catch (error: unknown) {
      const data = (error as { response?: { data?: { error?: string; detail?: string } } })
        ?.response?.data;
      const message =
        data?.error ||
        (typeof data?.detail === "string" ? data.detail : undefined) ||
        "Failed to update module";
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  };

  const renderModuleCard = (module: OrgModuleDefinition) => {
    const isSelected = isModuleActive(activeModules, module.id);
    const isLoading = togglingId === module.id;
    const IconComponent = module.icon;
    const isRequired = isRequiredModule(module.id) || module.required;
    const canToggle = canEdit && !isRequired && !isLoading;

    return (
      <div
        key={module.id}
        onClick={() => {
          if (canToggle) toggleModule(module.id);
        }}
        className={`group relative flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all ${
          isSelected
            ? "border-[#22C55E]/40 bg-[#22C55E]/[0.06] dark:bg-green-500/10"
            : "border-gray-100 dark:border-border bg-white dark:bg-card hover:border-gray-200 dark:hover:border-border/80"
        } ${canToggle ? "cursor-pointer" : "cursor-default"} ${isLoading ? "opacity-70" : ""}`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isSelected
              ? "bg-[#22C55E]/15 text-[#22C55E]"
              : "bg-gray-100 dark:bg-muted text-gray-500 dark:text-muted-foreground"
          }`}
        >
          <IconComponent className="h-[18px] w-[18px]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">
              {module.name}
            </h3>
            {isRequired && (
              <span className="rounded-full bg-gray-100 dark:bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
                Always on
              </span>
            )}
            {!isRequired && module.recommended && (
              <span className="rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#16A34A]">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-muted-foreground line-clamp-1">
            {module.description}
          </p>
        </div>

        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {isLoading ? null : isRequired ? (
            <div
              className="flex h-5 w-5 items-center justify-center rounded-md bg-[#22C55E] text-white"
              aria-label={`${module.name} enabled`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
          ) : (
            <Checkbox
              checked={isSelected}
              disabled={!canEdit}
              onCheckedChange={() => toggleModule(module.id)}
              className="h-5 w-5 data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E]"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Render all modules without section grouping */}
      {getModuleCatalogSections(accountType).flatMap((section) =>
        section.modules.map((module) => renderModuleCard(module))
      )}

      <p className="text-xs text-gray-500 dark:text-muted-foreground text-center pt-4">
        {selectedCount} of {ORG_MODULE_CATALOG.length} modules enabled · Disabled modules are hidden
        from the sidebar
      </p>
    </div>
  );
}
