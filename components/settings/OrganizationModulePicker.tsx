"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Loader2, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
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
  planName?: string;
  canEdit: boolean;
  onUpdated: (modules: string[]) => void | Promise<void>;
}

export function OrganizationModulePicker({
  tenantSlug,
  activeModules,
  allowedModules,
  planName = "Free",
  canEdit,
  onUpdated,
}: OrganizationModulePickerProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const lockedCount = useMemo(
    () =>
      ORG_MODULE_CATALOG.filter(
        (module) =>
          !isRequiredModule(module.id) && !isModuleAllowed(module.id, allowedModules)
      ).length,
    [allowedModules]
  );

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
    const isAllowed = isModuleAllowed(moduleId, allowedModules);

    if (isRequired) {
      toast.error("Core modules are always included");
      return;
    }

    if (!isAllowed && !enabled) {
      toast.error(`Upgrade from ${planName} in Settings → Billing to enable this module`);
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

      const tenant = await tenantApi.getCurrent();
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
    const isAllowed = isModuleAllowed(module.id, allowedModules);
    const isLocked = !isRequired && !isAllowed;
    const canToggle = canEdit && !isRequired && !isLoading && (!isLocked || isSelected);
    const showLock = isLocked && !isSelected;

    return (
      <div
        key={module.id}
        onClick={() => canToggle && toggleModule(module.id)}
        className={`group relative flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all ${
          showLock
            ? "border-gray-100 dark:border-border bg-gray-50/90 dark:bg-muted/30 cursor-not-allowed"
            : isSelected
              ? "border-[#22C55E]/40 bg-[#22C55E]/[0.06] dark:bg-green-500/10"
              : "border-gray-100 dark:border-border bg-white dark:bg-card hover:border-gray-200 dark:hover:border-border/80"
        } ${canToggle ? "cursor-pointer" : "cursor-default"} ${isLoading ? "opacity-70" : ""}`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
            showLock
              ? "bg-gray-100 dark:bg-muted text-gray-400"
              : isSelected
                ? "bg-[#22C55E]/15 text-[#22C55E]"
                : "bg-gray-100 dark:bg-muted text-gray-500 dark:text-muted-foreground"
          }`}
        >
          {showLock ? <Lock className="h-[18px] w-[18px]" /> : <IconComponent className="h-[18px] w-[18px]" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-sm font-medium ${
                showLock ? "text-gray-500" : "text-gray-900 dark:text-foreground"
              }`}
            >
              {module.name}
            </h3>
            {isRequired && (
              <span className="rounded-full bg-gray-100 dark:bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
                Always on
              </span>
            )}
            {!isRequired && module.recommended && !showLock && (
              <span className="rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#16A34A]">
                Recommended
              </span>
            )}
            {showLock && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                {planName} plan
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-muted-foreground line-clamp-1">
            {showLock ? "Upgrade your subscription to unlock this module" : module.description}
          </p>
        </div>

        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#22C55E]" />
          ) : isRequired ? (
            <div
              className="flex h-5 w-5 items-center justify-center rounded-md bg-[#22C55E] text-white"
              aria-label={`${module.name} enabled`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
          ) : showLock ? (
            <Lock className="h-4 w-4 text-amber-600" aria-hidden />
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
    <div className="space-y-8">
      {lockedCount > 0 && (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 dark:bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <strong className="font-semibold">{planName} plan:</strong> {lockedCount} module
          {lockedCount === 1 ? "" : "s"} require an upgrade.{" "}
          <Link href="/dashboard/settings/billing" className="font-medium text-[#16A34A] underline">
            View billing plans
          </Link>
        </div>
      )}

      {getModuleCatalogSections().map((section) => (
        <section key={section.key} className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 border-b border-gray-100 dark:border-border pb-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
              {section.label}
            </h3>
            <span className="text-xs text-gray-400 dark:text-muted-foreground tabular-nums">
              {section.modules.filter((m) => isModuleActive(activeModules, m.id)).length}/
              {section.modules.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {section.modules.map((module) => renderModuleCard(module))}
          </div>
        </section>
      ))}

      <p className="text-xs text-gray-500 dark:text-muted-foreground text-center pt-2">
        {selectedCount} of {ORG_MODULE_CATALOG.length} modules enabled · Disabled modules are hidden
        from the sidebar
      </p>
    </div>
  );
}
