import { useMemo } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { ORG_MODULE_CATALOG, isRequiredModule, type OrgModuleDefinition } from "@/lib/modules/catalog";
import { getModulePrimaryHref } from "@/lib/dashboard/nav-items";

export interface EnabledModuleLink {
  id: string;
  href: string;
  label: string;
  sub: string;
  icon: OrgModuleDefinition["icon"];
  color: string;
}

const COLOR_PALETTE = [
  "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  "bg-green-50 text-[var(--color-accent-custom,#22C55E)] dark:bg-green-500/10 dark:text-green-400",
  "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  "bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400",
  "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
];

/**
 * Every module currently enabled for the tenant, resolved to a dashboard
 * link card (icon/label/href) — so each workplace-type dashboard's "explore
 * modules" section reflects whatever is actually turned on in Settings →
 * Modules, not a fixed subset baked in for that workplace type. `excludeIds`
 * lets a page leave out modules it already surfaces via dedicated widgets
 * (e.g. retail's own POS quick actions) so the list doesn't duplicate them.
 */
export function useEnabledModuleLinks(excludeIds: string[] = []): EnabledModuleLink[] {
  const { user } = useAuth();
  const activeModules = user?.tenant?.active_modules;
  const activeKey = (activeModules ?? []).join(",");
  const excludeKey = excludeIds.join(",");

  return useMemo(() => {
    const exclude = new Set(["dashboard", "settings", ...excludeKey.split(",").filter(Boolean)]);
    const active = new Set((activeKey ? activeKey.split(",") : []).map((m) => m.toLowerCase()));

    return ORG_MODULE_CATALOG.filter((module) => {
      if (exclude.has(module.id)) return false;
      if (isRequiredModule(module.id)) return false;
      return active.has(module.id.toLowerCase());
    }).map((module, index) => ({
      id: module.id,
      href: getModulePrimaryHref(module.id) ?? "/dashboard",
      label: module.name,
      sub: module.description,
      icon: module.icon,
      color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, excludeKey]);
}
