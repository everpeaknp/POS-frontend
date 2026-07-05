"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ModuleOverviewGrid } from "@/components/dashboard/ModuleOverviewGrid";
import { ModuleOverviewSection } from "@/components/dashboard/ModuleOverviewSection";
import { reportsAPI } from "@/lib/api/reports";
import { useAppearance } from "@/lib/context/AppearanceContext";
import { useAuth } from "@/lib/context/AuthContext";
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

  if (loading || !data) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Dashboard" subtitle={subtitle} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const salesModule = data.modules.find((module) => module.id === "sales");

  const periodToggle = salesModule?.chart ? (
    <div className="flex items-center bg-gray-100 dark:bg-muted rounded-lg p-1 gap-0.5">
      {(["today", "week", "month", "year"] as DashboardPeriod[]).map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
            period === p
              ? "bg-white dark:bg-card text-gray-900 dark:text-foreground shadow-sm"
              : "text-gray-500 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Dashboard" subtitle={subtitle} />
      <div className="flex-1 p-6 space-y-8">
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
        {data.modules.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
              No modules enabled
            </h2>
            <p className="text-sm text-gray-500 dark:text-muted-foreground mt-2 max-w-md mx-auto">
              Enable modules in settings to see your organization overview here.
            </p>
            <Link
              href="/dashboard/settings/modules"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg bg-[#22C55E] text-white text-sm font-medium hover:bg-[#16A34A] transition-colors"
            >
              <Settings className="h-4 w-4" />
              Manage modules
            </Link>
          </div>
        ) : (
          <>
            <ModuleOverviewGrid modules={data.modules} catalogById={catalogById} />

            <div className="space-y-6">
              {data.modules.map((module) => (
                <ModuleOverviewSection
                  key={module.id}
                  module={module}
                  catalog={catalogById.get(module.id)}
                  isDark={isDark}
                  showChart={module.id === "sales"}
                  headerExtra={module.id === "sales" ? periodToggle : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
