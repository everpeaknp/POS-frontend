import type { CustomReportCreateData } from "@/lib/api/reports";

export type CustomReportModule = CustomReportCreateData["module"];

export interface CustomReportFieldMeta {
  key: string;
  label: string;
  type: "string" | "number" | "date";
}

export interface CustomReportFilter {
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "gte" | "lte";
  value: string;
}

export const FILTER_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "gt", label: "Greater than" },
  { value: "lt", label: "Less than" },
  { value: "gte", label: "Greater or equal" },
  { value: "lte", label: "Less or equal" },
] as const;

export const CHART_TYPES = ["bar", "line", "pie", "area"] as const;

export const SCHEDULE_OPTIONS = [
  { value: "none", label: "No schedule" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

export const MODULE_OPTIONS: { value: CustomReportModule; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "purchase", label: "Purchase" },
  { value: "inventory", label: "Inventory" },
  { value: "accounting", label: "Accounting" },
  { value: "hr", label: "HR" },
  { value: "pos", label: "POS" },
];

export function emptyCustomReportForm(): CustomReportCreateData {
  return {
    name: "",
    report_type: "table",
    description: "",
    module: "sales",
    fields: [],
    filters: [],
    grouping: {},
    sorting: {},
    chart_config: {},
    schedule: "none",
  };
}

export function defaultDateRange(): { from_date: string; to_date: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 90);
  return {
    from_date: from.toISOString().slice(0, 10),
    to_date: to.toISOString().slice(0, 10),
  };
}
