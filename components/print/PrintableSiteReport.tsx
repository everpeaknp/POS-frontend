"use client";

import React from "react";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { PrintCompanyHeader } from "@/components/print/PrintCompanyHeader";
import type { CompanyPrintInfo } from "@/lib/print/company-info";
import type { SiteReport } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";

interface PrintableSiteReportProps {
  report: SiteReport;
  companyInfo: CompanyPrintInfo;
}

export const PrintableSiteReport = React.forwardRef<HTMLDivElement, PrintableSiteReportProps>(
  ({ report, companyInfo }, ref) => {
    return (
      <div ref={ref} className="p-8 bg-white text-gray-900" style={{ width: "210mm", minHeight: "297mm" }}>
        <PrintCompanyHeader
          company={companyInfo}
          documentTitle="SITE REPORT"
          documentNumber={report.site_name}
          documentDate={<FormattedDate value={report.start_date} />}
          secondaryDate={{ label: "Status", value: report.status.toUpperCase() }}
        />

        <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>
              <span className="text-gray-500">Location:</span> {report.location}
            </p>
            <p>
              <span className="text-gray-500">Client:</span> {report.client_name || "—"}
            </p>
          </div>
          <div>
            <p>
              <span className="text-gray-500">Manager:</span> {report.manager}
            </p>
            <p>
              <span className="text-gray-500">Budget Health:</span>{" "}
              {report.budget_health.toUpperCase()} ({report.budget_percentage.toFixed(1)}% used)
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Budget Overview
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-gray-500">Allocated Budget</p>
              <p className="text-lg font-bold mt-1">{formatNPR(report.allocated_budget)}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-gray-500">Total Actual Spend</p>
              <p className="text-lg font-bold mt-1">{formatNPR(report.total_actual_spend)}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-gray-500">Remaining Budget</p>
              <p className="text-lg font-bold mt-1">{formatNPR(report.remaining_budget)}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Cost Breakdown
          </h3>
          <table className="w-full text-sm border border-gray-200">
            <tbody>
              {[
                ["Material Cost", formatNPR(report.material_cost)],
                ["Labor Cost", formatNPR(report.labor_cost)],
                ["Equipment Cost", formatNPR(report.equipment_cost)],
                ["Other Expenses", formatNPR(report.other_expenses)],
                ["Total Actual Spend", formatNPR(report.total_actual_spend)],
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
            Project Timeline
          </h3>
          <div className="text-sm space-y-2">
            <p>
              <span className="text-gray-500">Start Date:</span>{" "}
              <FormattedDate value={report.start_date} />
            </p>
            {report.estimated_end_date && (
              <p>
                <span className="text-gray-500">Estimated End:</span>{" "}
                <FormattedDate value={report.estimated_end_date} />
              </p>
            )}
            {report.actual_end_date && (
              <p>
                <span className="text-gray-500">Actual End:</span>{" "}
                <FormattedDate value={report.actual_end_date} />
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          Generated from Khata Construction · Site Report
        </div>
      </div>
    );
  },
);

PrintableSiteReport.displayName = "PrintableSiteReport";
