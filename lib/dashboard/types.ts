export type DashboardPeriod = "today" | "week" | "month" | "year";

export interface DashboardModuleStat {
  label: string;
  value: string;
  change?: number;
}

export interface DashboardModuleListItem {
  primary: string;
  secondary?: string;
  meta?: string;
  status?: string;
  href?: string;
}

export interface DashboardModuleTile {
  label: string;
  value: string;
  tone?: "success" | "warning" | "danger" | "info";
}

export interface DashboardModuleSection {
  id: string;
  title: string;
  href: string;
  stats: DashboardModuleStat[];
  chart?: { data: Array<{ time: string; value: number }> };
  lists?: Array<{ title: string; items: DashboardModuleListItem[] }>;
  tiles?: DashboardModuleTile[];
}

export interface UnifiedDashboardData {
  period: DashboardPeriod;
  activeModules: string[];
  modules: DashboardModuleSection[];
}
