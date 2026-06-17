"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  BarChart3,
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  HardHat,
  Wrench,
  Monitor,
  Settings,
  type LucideIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  recommended?: boolean;
  defaultEnabled?: boolean;
}

const availableModules: Module[] = [
  {
    id: "accounting",
    name: "Accounting",
    description: "Core accounting features including chart of accounts, journal entries, and financial reports",
    icon: BarChart3,
    defaultEnabled: true,
    recommended: true,
  },
  {
    id: "inventory",
    name: "Inventory Management",
    description: "Track products, stock levels, warehouses, and inventory movements",
    icon: Package,
    defaultEnabled: true,
    recommended: true,
  },
  {
    id: "sales",
    name: "Sales & Billing",
    description: "Manage quotations, sales orders, invoices, and customer payments",
    icon: DollarSign,
    defaultEnabled: true,
    recommended: true,
  },
  {
    id: "purchase",
    name: "Purchase Management",
    description: "Handle purchase orders, supplier management, and procurement",
    icon: ShoppingCart,
    defaultEnabled: true,
    recommended: true,
  },
  {
    id: "reports",
    name: "Reports & Analytics",
    description: "Generate business insights with comprehensive reporting tools",
    icon: TrendingUp,
    defaultEnabled: true,
  },
  {
    id: "settings",
    name: "Settings",
    description: "Organization settings, user management, permissions, and system configuration",
    icon: Settings,
    defaultEnabled: true,
  },
  {
    id: "pos",
    name: "Point of Sale (POS)",
    description: "Fast billing, transaction management, discounts, and daily sales reports",
    icon: Monitor,
    defaultEnabled: false,
  },
  {
    id: "hr",
    name: "HR & Payroll",
    description: "Employee management, attendance tracking, leave requests, and payroll processing",
    icon: Users,
    defaultEnabled: false,
  },
  {
    id: "construction",
    name: "Construction Management",
    description: "Site management, worker tracking, equipment, and material consumption",
    icon: HardHat,
    defaultEnabled: false,
  },
  {
    id: "hardware",
    name: "Hardware Business",
    description: "Specialized features for hardware stores including bulk pricing and credit management",
    icon: Wrench,
    defaultEnabled: false,
  },
];

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
  const [selectedModules, setSelectedModules] = useState<string[]>(
    availableModules.filter(m => m.defaultEnabled).map(m => m.id)
  );

  const toggleModule = (moduleId: string) => {
    // Prevent deselecting accounting - it's a core module
    if (moduleId === 'accounting') {
      toast.error("Accounting is a core module and cannot be deselected");
      return;
    }
    
    setSelectedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleNext = () => {
    if (selectedModules.length === 0) {
      toast.error("Please select at least one module");
      return;
    }
    
    // Ensure accounting is always included
    const modulesToSend = selectedModules.includes('accounting') 
      ? selectedModules 
      : [...selectedModules, 'accounting'];
    
    // Ensure settings is always included for admin access
    const finalModules = modulesToSend.includes('settings')
      ? modulesToSend
      : [...modulesToSend, 'settings'];
    
    onNext(finalModules);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Accounting Features</h2>
        <p className="text-sm text-gray-600 max-w-2xl mx-auto">
          Enjoy additional features with Khata.app alongside basic accounting by selecting modules that fit your business needs.
        </p>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableModules.map((module) => {
          const isSelected = selectedModules.includes(module.id);
          const IconComponent = module.icon;
          
          return (
            <div
              key={module.id}
              onClick={() => toggleModule(module.id)}
              className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#22C55E] bg-green-50/50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Required Badge for Accounting */}
              {module.id === 'accounting' && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                    ✓ Required
                  </span>
                </div>
              )}
              
              {/* Recommended Badge */}
              {module.recommended && module.id !== 'accounting' && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                    ⭐ Recommended
                  </span>
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleModule(module.id)}
                    className="data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E] h-5 w-5"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`h-5 w-5 ${
                        isSelected ? 'text-[#22C55E]' : 'text-gray-600'
                      }`} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{module.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {module.description}
                  </p>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Count */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {selectedModules.length} {selectedModules.length === 1 ? 'module' : 'modules'} selected
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Accounting and Settings modules are always included as core features. You can modify other module selections later from organization settings.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-4">
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
          className="flex-1 h-11 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold disabled:opacity-40 gap-1.5 rounded-lg text-base"
        >
          Next: Review <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
