import type { ComponentType } from "react";
import { getModuleById } from "@/lib/modules/catalog";

export type PermissionAction =
  | "View"
  | "Create"
  | "Edit"
  | "Delete"
  | "Export"
  | "Approve";

export interface PermissionModuleDefinition {
  /** Backend module id (lowercase) */
  id: string;
  /** Display name used in permission keys (e.g. Sales-View) */
  name: string;
  actions: PermissionAction[];
}

/** Mirrors backend RolePermission modules and default action sets */
export const PERMISSION_MODULES: PermissionModuleDefinition[] = [
  { id: "dashboard", name: "Dashboard", actions: ["View"] },
  { id: "accounting", name: "Accounting", actions: ["View", "Create", "Edit", "Delete", "Export"] },
  { id: "inventory", name: "Inventory", actions: ["View", "Create", "Edit", "Delete", "Export"] },
  { id: "sales", name: "Sales", actions: ["View", "Create", "Edit", "Delete", "Export"] },
  {
    id: "purchase",
    name: "Purchase",
    actions: ["View", "Create", "Edit", "Delete", "Export", "Approve"],
  },
  { id: "reports", name: "Reports", actions: ["View", "Export"] },
  { id: "settings", name: "Settings", actions: ["View", "Edit"] },
  { id: "pos", name: "POS", actions: ["View", "Create", "Edit", "Delete"] },
  { id: "hr", name: "HR", actions: ["View", "Create", "Edit", "Delete"] },
  {
    id: "construction",
    name: "Construction",
    actions: ["View", "Create", "Edit", "Delete", "Export"],
  },
  {
    id: "hardware",
    name: "Hardware",
    actions: ["View", "Create", "Edit", "Delete", "Export"],
  },
];

export function permissionKey(moduleName: string, action: PermissionAction): string {
  return `${moduleName}-${action}`;
}

export function getAllPermissionKeys(): string[] {
  return PERMISSION_MODULES.flatMap((mod) =>
    mod.actions.map((action) => permissionKey(mod.name, action))
  );
}

export function buildFullRolePermissions(
  partial: Record<string, boolean> = {}
): Record<string, boolean> {
  const full: Record<string, boolean> = {};
  for (const key of getAllPermissionKeys()) {
    full[key] = partial[key] === true;
  }
  return full;
}

export function getPermissionModuleIcon(
  moduleId: string
): ComponentType<{ className?: string }> | undefined {
  return getModuleById(moduleId)?.icon;
}
