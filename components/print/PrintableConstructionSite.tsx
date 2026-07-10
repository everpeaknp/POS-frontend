"use client";

import React from "react";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { PrintCompanyHeader } from "@/components/print/PrintCompanyHeader";
import type { CompanyPrintInfo } from "@/lib/print/company-info";
import type { Site } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";

interface SiteDashboardSnapshot {
  workers?: { total_active?: number };
  attendance?: { present?: number; absent?: number; half_day?: number; overtime?: number };
  material_consumption?: { last_30_days?: number };
  daily_logs?: { total?: number };
}

interface PrintableConstructionSiteProps {
  site: Site;
  dashboard?: SiteDashboardSnapshot | null;
  companyInfo: CompanyPrintInfo;
}

function formatStatusLabel(status: string) {
  return status.replace("_", " ");
}

function getBudgetHealthLabel(percentage: number) {
  if (percentage < 80) return "Healthy";
  if (percentage < 100) return "Warning";
  return "Over Budget";
}

export const PrintableConstructionSite = React.forwardRef<
  HTMLDivElement,
  PrintableConstructionSiteProps
>(({ site, dashboard, companyInfo }, ref) => {
  const budgetPct = site.budget_percentage ?? 0;

  return (
    <div ref={ref} className="p-8 bg-white text-gray-900" style={{ width: "210mm", minHeight: "297mm" }}>
      <PrintCompanyHeader
        company={companyInfo}
        documentTitle="CONSTRUCTION SITE"
        documentNumber={site.name}
        documentDate={<FormattedDate value={site.start_date} />}
        secondaryDate={{ label: "Status", value: formatStatusLabel(site.status) }}
      />

      <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p>
            <span className="text-gray-500">Location:</span> {site.location}
          </p>
          <p>
            <span className="text-gray-500">Client:</span> {site.client_name || "—"}
          </p>
          <p>
            <span className="text-gray-500">Warehouse:</span> {site.warehouse_name || "—"}
          </p>
        </div>
        <div>
          <p>
            <span className="text-gray-500">Manager:</span> {site.manager_name || "—"}
          </p>
          <p>
            <span className="text-gray-500">Budget Health:</span> {getBudgetHealthLabel(budgetPct)} (
            {budgetPct.toFixed(1)}% used)
          </p>
        </div>
      </div>

      {dashboard && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Site Activity
          </h3>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div className="border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-gray-500 text-xs">Active Workers</p>
              <p className="text-lg font-bold mt-1">{dashboard.workers?.total_active ?? 0}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-gray-500 text-xs">Present (7d)</p>
              <p className="text-lg font-bold mt-1">{dashboard.attendance?.present ?? 0}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-gray-500 text-xs">Material Logs (30d)</p>
              <p className="text-lg font-bold mt-1">
                {dashboard.material_consumption?.last_30_days ?? 0}
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-gray-500 text-xs">Daily Logs</p>
              <p className="text-lg font-bold mt-1">{dashboard.daily_logs?.total ?? 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Budget Overview
        </h3>
        <div className="grid grid-cols-4 gap-3 text-sm">
          {[
            ["Allocated", formatNPR(site.allocated_budget)],
            ["Actual Spend", formatNPR(site.actual_spend ?? 0)],
            ["Remaining", formatNPR(site.remaining_budget ?? 0)],
            ["Budget Used", `${budgetPct.toFixed(1)}%`],
          ].map(([label, value]) => (
            <div key={label} className="border border-gray-200 rounded-lg p-3">
              <p className="text-gray-500 text-xs">{label}</p>
              <p className="text-base font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Cost Breakdown
        </h3>
        <table className="w-full text-sm border border-gray-200">
          <tbody>
            {[
              ["Material Cost", formatNPR(site.material_cost ?? 0)],
              ["Labor Cost", formatNPR(site.labor_cost ?? 0)],
              ["Equipment Cost", formatNPR(site.equipment_cost ?? 0)],
              ["Other Expenses", formatNPR(site.other_expenses ?? 0)],
              ["Total Actual Spend", formatNPR(site.actual_spend ?? 0)],
            ].map(([label, value]) => (
              <tr key={label} className="border-b border-gray-100">
                <td className="py-2.5 px-3 text-gray-600 font-medium w-1/2 bg-gray-50">{label}</td>
                <td className="py-2.5 px-3 text-right font-semibold">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Timeline
        </h3>
        <div className="text-sm space-y-2">
          <p>
            <span className="text-gray-500">Start Date:</span>{" "}
            <FormattedDate value={site.start_date} />
          </p>
          {site.estimated_end_date && (
            <p>
              <span className="text-gray-500">Estimated End:</span>{" "}
              <FormattedDate value={site.estimated_end_date} />
            </p>
          )}
          {site.actual_end_date && (
            <p>
              <span className="text-gray-500">Actual End:</span>{" "}
              <FormattedDate value={site.actual_end_date} />
            </p>
          )}
        </div>
      </div>

      {site.description && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Description
          </h3>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200 rounded-lg p-4">
            {site.description}
          </p>
        </div>
      )}

      <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
        Generated from Khata Construction · Site #{site.id}
      </div>
    </div>
  );
});

PrintableConstructionSite.displayName = "PrintableConstructionSite";
