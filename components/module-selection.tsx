"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";

import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { OrgWizardFooter } from "@/components/org-wizard-footer";
import { billingApi } from "@/lib/api/billing";
import {
  filterModuleIds,
  getDefaultSelectedModuleIds,
  getDefaultModulesByAccountType,
  getModuleCatalogSections,
  isModuleAllowed,
  isRequiredModule,
  normalizeModuleList,
  type OrgModuleDefinition,
} from "@/lib/modules/catalog";

interface ModuleSelectionProps {
  accountType?: string;
  organizationData: {
    name: string;
    business_type: string;
    address: string;
    accounting_start_date: string;
    vat_registered: boolean;
    pan_vat_number?: string;
    workspace_name: string;
    owner_name?: string;
    email?: string;
    phone?: string;
    logo?: File | null;
  };
  onBack: () => void;
  onNext: (modules: string[]) => void;
}

export function ModuleSelection({ accountType, onBack, onNext }: ModuleSelectionProps) {
  const [allowedModules, setAllowedModules] = useState<string[] | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>(
    getDefaultModulesByAccountType(accountType)
  );

  useEffect(() => {
    billingApi
      .getAccountLimits()
      .then((limits) => {
        const allowed = limits.new_org_allowed_modules;
        setAllowedModules(allowed);
        setSelectedModules((prev) =>
          normalizeModuleList(
            filterModuleIds(
              prev.length ? prev : getDefaultModulesByAccountType(accountType),
              allowed
            )
          )
        );
      })
      .catch(() => {
        setAllowedModules(getDefaultModulesByAccountType(accountType));
      });
  }, [accountType]);

  const toggleModule = (moduleId: string) => {
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

  const renderModuleCard = (module: OrgModuleDefinition) => {
    const isSelected = selectedModules.includes(module.id);
    const isRequired = isRequiredModule(module.id) || module.required;
    const IconComponent = module.icon;
    const interactive = !isRequired;

    return (
      <div
        key={module.id}
        onClick={() => {
          if (interactive) toggleModule(module.id);
        }}
        className={`group flex items-start gap-3 rounded-2xl border px-4 py-4 transition-all ${
          isSelected
            ? "border-2 border-[var(--color-accent-custom,#22C55E)] bg-green-50/80 cursor-pointer shadow-sm shadow-green-500/10"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        }`}
      >
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isSelected ? "bg-[var(--color-accent-custom,#22C55E)]/15 text-[#16A34A]" : "bg-gray-100 text-gray-500"
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
            {!isRequired && module.recommended && (
              <span className="rounded-full bg-[var(--color-accent-custom,#22C55E)]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#16A34A]">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-2">
            {module.description}
          </p>
        </div>

        <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
          {isRequired ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--color-accent-custom,#22C55E)] text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
          ) : (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleModule(module.id)}
              className="h-5 w-5 data-[state=checked]:bg-[var(--color-accent-custom,#22C55E)] data-[state=checked]:border-[var(--color-accent-custom,#22C55E)]"
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
            All modules available - no restrictions
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {getModuleCatalogSections(accountType).map((section) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {section.modules.map((module) => renderModuleCard(module))}
            </div>
          </section>
        ))}
      </div>

      <OrgWizardFooter
        onBack={onBack}
        onPrimary={handleNext}
        primaryLabel="Continue"
        primaryDisabled={selectedModules.length === 0}
      />
    </div>
  );
}
