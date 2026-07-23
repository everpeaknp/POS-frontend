"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import {
  DashboardPageShell,
  dashboardCardClass,
  dashboardFilterPillActive,
  dashboardFilterPillInactive,
} from "@/components/dashboard/DashboardPageShell";
import { ModuleOverviewGrid } from "@/components/dashboard/ModuleOverviewGrid";
import { ModuleOverviewSection } from "@/components/dashboard/ModuleOverviewSection";
import { reportsAPI } from "@/lib/api/reports";
import { useAppearance } from "@/lib/context/AppearanceContext";
import { useAuth } from "@/lib/context/AuthContext";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  createEmptyUnifiedDashboard,
  type DashboardPeriod,
} from "@/lib/dashboard/default-data";
import type { UnifiedDashboardData } from "@/lib/dashboard/types";
import { ORG_MODULE_CATALOG } from "@/lib/modules/catalog";

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [data, setData] = useState<UnifiedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { isDark } = useAppearance();
  const { user } = useAuth();
  const { canView } = usePermissions();

  const workspaceName =
    user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Organization overview`;

  const catalogById = useMemo(
    () => new Map(ORG_MODULE_CATALOG.map((module) => [module.id, module])),
    []
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const dashboardData = await reportsAPI.mainDashboard({ period });
      setData(dashboardData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setLoadError("Could not load dashboard data. Please try again.");
      setData(createEmptyUnifiedDashboard(period));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Hide Reports & Analytics from the home overview (stats/tiles stay in /dashboard/reports)
  const visibleModules = (data?.modules ?? []).filter(
    (module) => canView(module.id) && module.id !== "reports"
  );

  const periodToggle = (
    <div
      data-page-tour="period"
      className="flex items-center bg-gray-100 dark:bg-muted rounded-lg p-0.5 gap-0.5 h-8"
    >
      {(["today", "week", "month", "year"] as DashboardPeriod[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setPeriod(p)}
          className={`px-2.5 h-7 rounded-md text-xs font-medium capitalize transition-all ${
            period === p ? dashboardFilterPillActive : dashboardFilterPillInactive
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );

  return (
    <DashboardPageShell
      title="Dashboard"
      subtitle={subtitle}
      headerActions={periodToggle}
      loading={loading || !data}
    >
      {data && (
        <div className="space-y-6">
          {loadError && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => loadDashboard()}
                className="text-xs font-medium text-[#22C55E] hover:text-[#16A34A] shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {visibleModules.length === 0 ? (
            <div className={`${dashboardCardClass} p-10 text-center`}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
                {data.modules.length > 0 ? "No module access" : "No modules enabled"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-muted-foreground mt-2 max-w-md mx-auto">
                {data.modules.length > 0
                  ? "Your role does not include view access to any enabled modules. Contact your organization administrator."
                  : "Enable modules in settings to see your organization overview here."}
              </p>
              {data.modules.length === 0 ? (
                <Link
                  href="/dashboard/settings/modules"
                  className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg bg-[#22C55E] text-white text-sm font-medium hover:bg-[#16A34A] transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Manage modules
                </Link>
              ) : null}
            </div>
          ) : (
            <>
              <div data-page-tour="module-grid">
                <ModuleOverviewGrid modules={visibleModules} catalogById={catalogById} />
              </div>

              <div className="space-y-6">
                {visibleModules.map((module) => (
                  <ModuleOverviewSection
                    key={module.id}
                    module={module}
                    catalog={catalogById.get(module.id)}
                    isDark={isDark}
                    showChart={module.id === "sales"}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}
