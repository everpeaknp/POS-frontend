import type { IconType } from "react-icons";
import {
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
  LayoutDashboard,
} from "lucide-react";

export interface OrgModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  recommended?: boolean;
  defaultEnabled?: boolean;
  required?: boolean;
}

export const REQUIRED_MODULE_IDS = ["accounting", "settings", "dashboard"] as const;

/** Mirrors backend billing free-plan module list + core modules */
export const FREE_PLAN_MODULE_IDS = [
  "dashboard",
  "accounting",
  "settings",
  "inventory",
  "sales",
  "purchase",
  "reports",
] as const;

export const ORG_MODULE_CATALOG: OrgModuleDefinition[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Organization overview with snapshots from all enabled modules",
    icon: LayoutDashboard,
    defaultEnabled: true,
    required: true,
  },
  {
    id: "accounting",
    name: "Accounting",
    description:
      "Core accounting features including chart of accounts, journal entries, and financial reports",
    icon: BarChart3,
    defaultEnabled: true,
    recommended: true,
    required: true,
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
    description:
      "Organization settings, user management, permissions, and system configuration",
    icon: Settings,
    defaultEnabled: true,
    required: true,
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
    description:
      "Employee management, attendance tracking, leave requests, and payroll processing",
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
    description:
      "Specialized features for hardware stores including bulk pricing and credit management",
    icon: Wrench,
    defaultEnabled: false,
  },
];

export function getAllowedModulesForPlanType(planType: string): string[] {
  const key = (planType || "free").toLowerCase();
  if (key === "enterprise") {
    return ORG_MODULE_CATALOG.map((module) => module.id);
  }
  if (key === "premium") {
    return [...FREE_PLAN_MODULE_IDS, "pos", "hr"];
  }
  return [...FREE_PLAN_MODULE_IDS];
}

export function getModuleById(moduleId: string): OrgModuleDefinition | undefined {
  const normalized = moduleId.toLowerCase();
  return ORG_MODULE_CATALOG.find((module) => module.id === normalized);
}

export function isModuleAllowed(moduleId: string, allowedModuleIds: string[]): boolean {
  const normalized = moduleId.toLowerCase();
  return allowedModuleIds.some((id) => id.toLowerCase() === normalized);
}

export function filterModuleIds(moduleIds: string[], allowedModuleIds: string[]): string[] {
  return moduleIds.filter((id) => isModuleAllowed(id, allowedModuleIds));
}

export function getDefaultSelectedModuleIds(): string[] {
  return ORG_MODULE_CATALOG.filter((m) => m.defaultEnabled).map((m) => m.id);
}

export function normalizeModuleList(modules: string[]): string[] {
  const withRequired = new Set(modules.map((m) => m.toLowerCase()));
  REQUIRED_MODULE_IDS.forEach((id) => withRequired.add(id));
  return Array.from(withRequired);
}

export function isRequiredModule(moduleId: string): boolean {
  return (REQUIRED_MODULE_IDS as readonly string[]).includes(moduleId);
}

export function isModuleInActiveList(
  activeModules: string[] | undefined,
  moduleId: string
): boolean {
  const normalized = moduleId.toLowerCase();
  return (activeModules || []).some((m) => m.toLowerCase() === normalized);
}

/** Whether a module is effectively enabled (core modules are always on). */
export function isModuleActive(activeModules: string[] | undefined, moduleId: string): boolean {
  if (isRequiredModule(moduleId)) {
    return true;
  }
  return isModuleInActiveList(activeModules, moduleId);
}

export type ModuleCatalogSectionKey = "required" | "recommended" | "other";

export interface ModuleCatalogSection {
  key: ModuleCatalogSectionKey;
  label: string;
  modules: OrgModuleDefinition[];
}

function sortByCatalogOrder(modules: OrgModuleDefinition[]): OrgModuleDefinition[] {
  const order = new Map(ORG_MODULE_CATALOG.map((module, index) => [module.id, index]));
  return [...modules].sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  );
}

export function isRecommendedModule(module: OrgModuleDefinition): boolean {
  return Boolean(module.recommended) && !module.required && !isRequiredModule(module.id);
}

export function getModuleCatalogSections(): ModuleCatalogSection[] {
  const required = sortByCatalogOrder(
    ORG_MODULE_CATALOG.filter((module) => module.required || isRequiredModule(module.id))
  );
  const recommended = sortByCatalogOrder(
    ORG_MODULE_CATALOG.filter((module) => isRecommendedModule(module))
  );
  const other = sortByCatalogOrder(
    ORG_MODULE_CATALOG.filter(
      (module) =>
        !(module.required || isRequiredModule(module.id)) && !isRecommendedModule(module)
    )
  );

  return [
    { key: "required" as const, label: "Required", modules: required },
    { key: "recommended" as const, label: "Recommended", modules: recommended },
    { key: "other" as const, label: "Other modules", modules: other },
  ].filter((section) => section.modules.length > 0);
}
