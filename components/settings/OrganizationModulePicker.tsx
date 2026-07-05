"use client";

import { useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getModuleCatalogSections,
  isModuleActive,
  isRequiredModule,
  ORG_MODULE_CATALOG,
  type OrgModuleDefinition,
} from "@/lib/modules/catalog";
import { tenantApi } from "@/lib/api/tenant";

interface OrganizationModulePickerProps {
  tenantSlug: string;
  activeModules: string[];
  canEdit: boolean;
  onUpdated: (modules: string[]) => void | Promise<void>;
}

export function OrganizationModulePicker({
  tenantSlug,
  activeModules,
  canEdit,
  onUpdated,
}: OrganizationModulePickerProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const selectedCount = useMemo(
    () => ORG_MODULE_CATALOG.filter((m) => isModuleActive(activeModules, m.id)).length,
    [activeModules]
  );

  const toggleModule = async (moduleId: string) => {
    if (!canEdit) {
      toast.error("Only organization admins can change modules");
      return;
    }

    if (isRequiredModule(moduleId)) {
      const label =
        moduleId === "accounting"
          ? "Accounting"
          : moduleId === "settings"
            ? "Settings"
            : "Dashboard";
      toast.error(`${label} is a core module and cannot be disabled`);
      return;
    }

    const enabled = isModuleActive(activeModules, moduleId);
    setTogglingId(moduleId);

    try {
      if (enabled) {
        await tenantApi.deactivateModule(tenantSlug, moduleId);
        toast.success("Module disabled");
      } else {
        await tenantApi.activateModule(tenantSlug, moduleId);
        toast.success("Module enabled");
      }

      const tenant = await tenantApi.getCurrent();
      await onUpdated(tenant.active_modules || []);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string; detail?: string } } })?.response?.data
          ?.detail ||
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
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

    return (
      <div
        key={module.id}
        onClick={() => !isLoading && canEdit && toggleModule(module.id)}
        className={`relative border rounded-xl p-5 transition-all flex flex-col ${
          isSelected
            ? "border-[#22C55E] bg-green-50/60 dark:bg-green-950/20 shadow-sm"
            : "border-gray-200 dark:border-border bg-white dark:bg-card hover:border-gray-300 dark:hover:border-border/80 hover:shadow-sm"
        } ${canEdit && !isLoading ? "cursor-pointer" : "cursor-default"} ${isLoading ? "opacity-70" : ""}`}
      >
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0 mt-1">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#22C55E]" />
            ) : (
              <Checkbox
                checked={isSelected}
                disabled={!canEdit || isRequired}
                onCheckedChange={() => toggleModule(module.id)}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E] h-5 w-5"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-lg ${
                  isSelected ? "bg-green-100 dark:bg-green-900/40" : "bg-gray-100 dark:bg-muted"
                }`}
              >
                <IconComponent
                  className={`h-5 w-5 ${
                    isSelected ? "text-[#22C55E]" : "text-gray-600 dark:text-muted-foreground"
                  }`}
                />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-foreground">
                {module.name}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-muted-foreground leading-relaxed">
              {module.description}
            </p>
          </div>

          {isSelected && !isLoading && (
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {(isRequired || module.recommended) && (
          <div className="flex justify-end mt-auto pt-3">
            {isRequired ? (
              <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-2 py-1 rounded-full">
                Required
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-[#16A34A] dark:text-green-400 text-xs font-semibold px-2 py-1 rounded-full">
                Recommended
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-8">
        {getModuleCatalogSections().map((section) => (
          <div key={section.key} className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground">
              {section.label}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.modules.map((module) => renderModuleCard(module))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-muted-foreground">
          {selectedCount} {selectedCount === 1 ? "module" : "modules"} enabled
        </p>
      </div>

      <div className="rounded-lg border border-green-100 dark:border-green-900/40 bg-green-50/80 dark:bg-green-950/20 px-4 py-3">
        <p className="text-sm text-green-900 dark:text-green-100">
          <strong className="font-semibold">Note:</strong> Dashboard, Accounting, and Settings stay enabled for every
          organization. Disabled modules are hidden from the sidebar for your team.
        </p>
      </div>
    </div>
  );
}
