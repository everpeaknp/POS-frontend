"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Lock } from "lucide-react";

import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { OrgWizardFooter } from "@/components/org-wizard-footer";
import { billingApi } from "@/lib/api/billing";
import {
  filterModuleIds,
  getDefaultSelectedModuleIds,
  getModuleCatalogSections,
  isModuleAllowed,
  isRequiredModule,
  normalizeModuleList,
  type OrgModuleDefinition,
} from "@/lib/modules/catalog";

interface ModuleSelectionProps {
  organizationData: {
    name: string;
    business_type: string;
    address: string;
    accounting_start_date: string;
    vat_registered: boolean;
    workspace_name: string;
    owner_name?: string;
    email?: string;
    phone?: string;
    logo?: File | null;
  };
  onBack: () => void;
  onNext: (modules: string[]) => void;
}

export function ModuleSelection({ onBack, onNext }: ModuleSelectionProps) {
  const [allowedModules, setAllowedModules] = useState<string[] | null>(null);
  const [planName, setPlanName] = useState("Free");
  const [selectedModules, setSelectedModules] = useState<string[]>(getDefaultSelectedModuleIds());

  useEffect(() => {
    billingApi
      .getAccountLimits()
      .then((limits) => {
        const allowed = limits.new_org_allowed_modules;
        setAllowedModules(allowed);
        setPlanName(limits.new_org_plan_name);
        setSelectedModules((prev) =>
          normalizeModuleList(
            filterModuleIds(prev.length ? prev : getDefaultSelectedModuleIds(), allowed)
          )
        );
      })
      .catch(() => {
        setAllowedModules(getDefaultSelectedModuleIds());
      });
  }, []);

  const toggleModule = (moduleId: string) => {
    if (allowedModules && !isModuleAllowed(moduleId, allowedModules)) {
      toast.error(`Upgrade from ${planName} to enable this module`);
      return;
    }

    if (isRequiredModule(moduleId)) {
      toast.error("Core modules are always included");
      return;
    }

    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleNext = () => {
    if (selectedModules.length === 0) {
      toast.error("Please select at least one module");
      return;
    }
    onNext(normalizeModuleList(selectedModules));
  };

  const lockedCount = useMemo(() => {
    if (!allowedModules) return 0;
    return getModuleCatalogSections()
      .flatMap((section) => section.modules)
      .filter((module) => !isModuleAllowed(module.id, allowedModules)).length;
  }, [allowedModules]);

  const renderModuleCard = (module: OrgModuleDefinition) => {
    const isSelected = selectedModules.includes(module.id);
    const isLocked = allowedModules ? !isModuleAllowed(module.id, allowedModules) : false;
    const isRequired = isRequiredModule(module.id) || module.required;
    const IconComponent = module.icon;
    const interactive = !isLocked && !isRequired;

    return (
      <div
        key={module.id}
        onClick={() => interactive && toggleModule(module.id)}
        className={`group flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-all ${
          isLocked
            ? "border-gray-100 bg-gray-50/80 opacity-70 cursor-not-allowed"
            : isSelected
              ? "border-[#22C55E]/50 bg-[#22C55E]/[0.06] cursor-pointer"
              : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm cursor-pointer"
        }`}
      >
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            isSelected ? "bg-[#22C55E]/15 text-[#22C55E]" : "bg-gray-100 text-gray-500"
          }`}
        >
          <IconComponent className="h-[18px] w-[18px]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{module.name}</h3>
            {isRequired && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Always on
              </span>
            )}
            {!isRequired && module.recommended && !isLocked && (
              <span className="rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#16A34A]">
                Recommended
              </span>
            )}
            {isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                <Lock className="h-3 w-3" />
                Upgrade
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-2">
            {module.description}
          </p>
        </div>

        <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
          {isLocked ? null : isRequired ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#22C55E] text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
          ) : (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleModule(module.id)}
              className="h-5 w-5 data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E]"
            />
          )}
        </div>
      </div>
    );
  };

  if (allowedModules === null) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p className="text-sm">Loading available modules…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-5 border-b border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {selectedModules.length} modules selected
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            New organizations start on the {planName} plan
          </p>
        </div>
        {lockedCount > 0 && (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900 max-w-md">
            {lockedCount} module{lockedCount === 1 ? "" : "s"} require a paid plan
          </div>
        )}
      </div>

      <div className="space-y-8">
        {getModuleCatalogSections().map((section) => (
          <section key={section.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {section.label}
              </h3>
              <span className="text-xs text-gray-400 tabular-nums">
                {section.modules.filter((m) => selectedModules.includes(m.id)).length}/
                {section.modules.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {section.modules.map((module) => renderModuleCard(module))}
            </div>
          </section>
        ))}
      </div>

      <OrgWizardFooter
        onBack={onBack}
        onPrimary={handleNext}
        primaryLabel="Next: Review"
        primaryDisabled={selectedModules.length === 0}
      />
    </div>
  );
}
