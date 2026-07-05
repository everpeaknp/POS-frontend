"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getDefaultSelectedModuleIds,
  getModuleCatalogSections,
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

export function ModuleSelection({ organizationData, onBack, onNext }: ModuleSelectionProps) {
  const [selectedModules, setSelectedModules] = useState<string[]>(getDefaultSelectedModuleIds());

  const toggleModule = (moduleId: string) => {
    if (isRequiredModule(moduleId)) {
      const label =
        moduleId === "accounting"
          ? "Accounting"
          : moduleId === "settings"
            ? "Settings"
            : "Dashboard";
      toast.error(`${label} is a core module and cannot be deselected`);
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
    const IconComponent = module.icon;

    return (
      <div
        key={module.id}
        onClick={() => toggleModule(module.id)}
        className={`relative border rounded-xl p-5 cursor-pointer transition-all flex flex-col ${
          isSelected
            ? "border-[#22C55E] bg-green-50/60 shadow-sm"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        }`}
      >
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0 mt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleModule(module.id)}
              className="data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E] h-5 w-5"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${isSelected ? "bg-green-100" : "bg-gray-100"}`}>
                <IconComponent
                  className={`h-5 w-5 ${isSelected ? "text-[#22C55E]" : "text-gray-600"}`}
                />
              </div>
              <h3 className="text-base font-semibold text-gray-900">{module.name}</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{module.description}</p>
          </div>

          {isSelected && (
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {(module.required || module.recommended) && (
          <div className="flex justify-end mt-auto pt-3">
            {module.required ? (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                Required
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-green-100 text-[#16A34A] text-xs font-semibold px-2 py-1 rounded-full">
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
            <h3 className="text-sm font-semibold text-gray-700">{section.label}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.modules.map((module) => renderModuleCard(module))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          {selectedModules.length} {selectedModules.length === 1 ? "module" : "modules"} selected
        </p>
      </div>

      <div className="rounded-lg border border-green-100 bg-green-50/80 px-4 py-3">
        <p className="text-sm text-green-900">
          <strong className="font-semibold">Note:</strong> Dashboard, Accounting, and Settings are always included.
          You can change other modules later from Settings → Modules.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="px-5 h-11 border-gray-300 text-gray-700 hover:bg-gray-50 gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={selectedModules.length === 0}
          className="flex-1 h-11 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold disabled:opacity-40 gap-1.5 rounded-lg shadow-sm shadow-green-200/50"
        >
          Next: Review <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
