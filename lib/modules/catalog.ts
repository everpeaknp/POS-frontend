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
  Wallet,
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

// Mirrors backend's `TenantViewSet.CORE_MODULES` — these three can never be
// deactivated (the backend rejects it), so the frontend must treat them as
// required everywhere too, instead of silently omitting them from pickers.
export const REQUIRED_MODULE_IDS = ["dashboard", "settings", "accounting"] as const;

/** Modules a Personal account gets — no business/org modules, ever. */
export const PERSONAL_ACCOUNT_MODULE_IDS = [
  "settings",
  "personal_finance",
] as const;


/**
 * Personal Finance is only ever assigned to Personal accounts, never offered
 * in the organization module picker — kept out of ORG_MODULE_CATALOG so it
 * can't appear in getModuleCatalogSections(), but still resolvable by id.
 */
export const PERSONAL_MODULE: OrgModuleDefinition = {
  id: "personal_finance",
  name: "Personal Finance",
  description: "Track your income, expenses, budgets, and bills in one place",
  icon: Wallet,
  defaultEnabled: true,
  required: true,
};

/** Construction module - only for Construction accounts */
export const CONSTRUCTION_MODULE: OrgModuleDefinition = {
  id: "construction",
  name: "Construction Management",
  description: "Site management, worker tracking, equipment, and material consumption",
  icon: HardHat,
  defaultEnabled: true,
  required: true,
};

/** Hardware module - only for Hardware accounts */
export const HARDWARE_MODULE: OrgModuleDefinition = {
  id: "hardware",
  name: "Hardware Business",
  description: "Specialized features for hardware stores including bulk pricing and credit management",
  icon: Wrench,
  defaultEnabled: true,
  required: true,
};

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
    recommended: true,
  },
  {
    id: "accounting",
    name: "Accounting",
    description:
      "Core accounting features including chart of accounts, journal entries, and financial reports",
    icon: BarChart3,
    defaultEnabled: true,
    recommended: true,
  },
  {
    id: "customers",
    name: "Customers",
    description: "Customer relationship management, contact details, and customer tracking",
    icon: Users,
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
    description:
      "Organization settings, user management, permissions, and system configuration",
    icon: Settings,
    defaultEnabled: true,
    recommended: true,
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
    return ORG_MODULE_CATALOG.map((module) => module.id);
  }
  return [...FREE_PLAN_MODULE_IDS];
}

export function getModuleById(moduleId: string): OrgModuleDefinition | undefined {
  const normalized = moduleId.toLowerCase();
  if (normalized === PERSONAL_MODULE.id) return PERSONAL_MODULE;
  if (normalized === CONSTRUCTION_MODULE.id) return CONSTRUCTION_MODULE;
  if (normalized === HARDWARE_MODULE.id) return HARDWARE_MODULE;
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

/**
 * Get default modules based on account/workplace type
 */
export function getDefaultModulesByAccountType(accountType?: string): string[] {
  const type = accountType?.toLowerCase();
  
  switch (type) {
    case "personal":
      // Personal Finance only
      return ["settings", "personal_finance"];
    
    case "retail":
    case "kirana":
      return [
        "dashboard", "accounting", "settings",
        "pos", "customers", "purchase", "inventory", "sales", "reports", "hr",
      ];

    case "construction":
      return ["dashboard", "accounting", "settings", "construction", "inventory", "reports"];

    case "hardware":
      return [
        "dashboard", "accounting", "settings",
        "hardware", "pos", "sales", "purchase", "inventory", "customers", "hr", "reports",
      ];

    case "organization":
    default:
      // Full suite for general organization
      return ["dashboard", "accounting", "settings", "customers", "inventory", "sales", "purchase", "reports"];
  }
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

export type ModuleCatalogSectionKey = "core" | "primary" | "optional";

export interface ModuleCatalogSection {
  key: ModuleCatalogSectionKey;
  label: string;
  modules: OrgModuleDefinition[];
}

/** Sorts modules to match the given id sequence, not the master catalog's fixed order — lets each workplace type present its own dedicated module order. */
function sortByIdOrder(modules: OrgModuleDefinition[], idOrder: string[]): OrgModuleDefinition[] {
  const order = new Map(idOrder.map((id, index) => [id, index]));
  return [...modules].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export function isRecommendedModule(module: OrgModuleDefinition): boolean {
  return Boolean(module.recommended) && !module.required && !isRequiredModule(module.id);
}

/**
 * Get module sections organized by workplace relevance
 * Returns modules grouped as: Core (always on), Primary (workplace-specific), Optional (additional)
 */
export function getModuleCatalogSections(accountType?: string): ModuleCatalogSection[] {
  const type = (accountType || 'organization').toLowerCase();
  
  // Core modules (always required, always on)
  const coreModules = ORG_MODULE_CATALOG.filter(
    (module) => module.required || isRequiredModule(module.id)
  );
  
  // Define primary and optional modules based on workspace type. Each type
  // lists only the modules relevant to it (a dedicated, curated set) rather
  // than every catalog module with irrelevant ones marked "optional" —
  // Retail/Construction/Hardware get a focused list; Organization sees
  // everything, with the niche vertical modules kept as optional add-ons.
  let primaryModuleIds: string[] = [];
  let optionalModuleIds: string[] = [];

  switch (type) {
    case 'retail':
    case 'kirana':
      primaryModuleIds = ['pos', 'customers', 'purchase', 'inventory', 'sales', 'reports', 'hr'];
      optionalModuleIds = [];
      break;

    case 'construction':
      primaryModuleIds = ['construction', 'inventory', 'reports'];
      optionalModuleIds = [];
      break;

    case 'hardware':
      primaryModuleIds = ['hardware', 'pos', 'sales', 'purchase', 'inventory', 'customers', 'hr', 'reports'];
      optionalModuleIds = [];
      break;

    case 'organization':
    default:
      primaryModuleIds = ['customers', 'inventory', 'sales', 'purchase', 'reports', 'pos', 'hr'];
      optionalModuleIds = ['construction', 'hardware'];
      break;
  }

  const primaryModules = sortByIdOrder(
    ORG_MODULE_CATALOG.filter(
      (module) => primaryModuleIds.includes(module.id) && !coreModules.includes(module)
    ),
    primaryModuleIds
  );

  const optionalModules = sortByIdOrder(
    ORG_MODULE_CATALOG.filter(
      (module) =>
        optionalModuleIds.includes(module.id) &&
        !coreModules.includes(module) &&
        !primaryModules.includes(module)
    ),
    optionalModuleIds
  );
  
  const sections: ModuleCatalogSection[] = [
    { 
      key: "core" as const, 
      label: "Core Modules", 
      modules: coreModules 
    },
  ];
  
  if (primaryModules.length > 0) {
    sections.push({
      key: "primary" as const,
      label: getWorkplaceSpecificLabel(type),
      modules: primaryModules
    });
  }
  
  if (optionalModules.length > 0) {
    sections.push({
      key: "optional" as const,
      label: "Additional Modules",
      modules: optionalModules
    });
  }
  
  return sections.filter((section) => section.modules.length > 0);
}

/**
 * Get workplace-specific label for primary modules section
 */
function getWorkplaceSpecificLabel(accountType: string): string {
  switch (accountType) {
    case 'retail':
    case 'kirana':
      return 'Retail & Store Operations';
    case 'construction':
      return 'Construction Management';
    case 'hardware':
      return 'Hardware Store Operations';
    case 'organization':
    default:
      return 'Business Operations';
  }
}
