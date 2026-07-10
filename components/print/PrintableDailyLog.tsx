"use client";

import React from "react";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { PrintCompanyHeader } from "@/components/print/PrintCompanyHeader";
import type { CompanyPrintInfo } from "@/lib/print/company-info";
import type { DailyLog } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";

interface PrintableDailyLogProps {
  log: DailyLog;
  companyInfo: CompanyPrintInfo;
}

function sumMaterialCost(log: DailyLog) {
  return (log.material_consumptions ?? []).reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0,
  );
}

export const PrintableDailyLog = React.forwardRef<HTMLDivElement, PrintableDailyLogProps>(
  ({ log, companyInfo }, ref) => {
    const materialCost = sumMaterialCost(log);
    const otherExpenses = Number(log.other_expenses) || 0;
    const totalSpend = materialCost + otherExpenses;
    const consumptions = log.material_consumptions ?? [];
    const documentNumber = `${log.site_name || "Site"} · ${log.date}`;

    return (
      <div ref={ref} className="p-8 bg-white text-gray-900" style={{ width: "210mm", minHeight: "297mm" }}>
        <PrintCompanyHeader
          company={companyInfo}
          documentTitle="DAILY LOG"
          documentNumber={documentNumber}
          documentDate={<FormattedDate value={log.date} />}
          secondaryDate={
            log.weather
              ? { label: "Weather", value: log.weather }
              : undefined
          }
        />

        <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>
              <span className="text-gray-500">Site:</span> {log.site_name || "—"}
            </p>
            <p>
              <span className="text-gray-500">Submitted By:</span> {log.submitted_by_name || "—"}
            </p>
            <p>
              <span className="text-gray-500">Review Status:</span>{" "}
              {log.reviewed_by_name ? "Reviewed" : "Pending Review"}
            </p>
          </div>
          <div>
            {log.reviewed_by_name && (
              <p>
                <span className="text-gray-500">Reviewed By:</span> {log.reviewed_by_name}
              </p>
            )}
            {log.reviewed_at && (
              <p>
                <span className="text-gray-500">Reviewed At:</span>{" "}
                <FormattedDate value={log.reviewed_at} />
              </p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Work Description
          </h3>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200 rounded-lg p-4">
            {log.work_description}
          </p>
        </div>

        {log.progress_notes && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Progress Notes
            </h3>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200 rounded-lg p-4">
              {log.progress_notes}
            </p>
          </div>
        )}

        {consumptions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Material Consumptions
            </h3>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 px-2 text-sm font-semibold">Product</th>
                  <th className="text-right py-2 px-2 text-sm font-semibold">Qty</th>
                  <th className="text-right py-2 px-2 text-sm font-semibold">Unit Cost</th>
                  <th className="text-right py-2 px-2 text-sm font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {consumptions.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-gray-200">
                    <td className="py-2 px-2 text-sm">
                      <p>{item.product_name}</p>
                      {item.product_sku && (
                        <p className="text-xs text-gray-500">{item.product_sku}</p>
                      )}
                    </td>
                    <td className="py-2 px-2 text-sm text-right">
                      {Number(item.quantity).toFixed(2)} {item.product_unit}
                    </td>
                    <td className="py-2 px-2 text-sm text-right">{formatNPR(item.unit_cost)}</td>
                    <td className="py-2 px-2 text-sm text-right font-medium">
                      {formatNPR(item.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={3} className="py-2 px-2 text-sm font-semibold text-right">
                    Material Total
                  </td>
                  <td className="py-2 px-2 text-sm font-bold text-right">{formatNPR(materialCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Material Cost</span>
              <span>{formatNPR(materialCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Other Expenses</span>
              <span>{formatNPR(otherExpenses)}</span>
            </div>
            <div className="flex justify-between py-3 text-base border-t-2 border-gray-300 font-bold">
              <span>Total Spend</span>
              <span>{formatNPR(totalSpend)}</span>
            </div>
          </div>
        </div>

        {log.other_expenses_description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Expense Notes
            </h3>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{log.other_expenses_description}</p>
          </div>
        )}

        {log.manager_comments && (
          <div className="mb-6 border border-green-200 bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-900 mb-2">Manager Comments</h3>
            <p className="text-sm text-green-900 whitespace-pre-wrap">{log.manager_comments}</p>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          Generated from Khata Construction · Daily Log #{log.id}
        </div>
      </div>
    );
  },
);

PrintableDailyLog.displayName = "PrintableDailyLog";
