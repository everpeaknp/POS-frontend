import type { DashboardPeriod, UnifiedDashboardData } from "./types";

export function createEmptyUnifiedDashboard(period: DashboardPeriod = "month"): UnifiedDashboardData {
  return {
    period,
    activeModules: [],
    modules: [],
  };
}

export type { DashboardPeriod };
