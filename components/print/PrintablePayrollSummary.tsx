"use client";

import React from "react";
import { PrintCompanyHeader } from "@/components/print/PrintCompanyHeader";
import type { CompanyPrintInfo } from "@/lib/print/company-info";
import type { SitePayrollSummary } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";

interface PrintablePayrollSummaryProps {
  payroll: SitePayrollSummary;
  companyInfo: CompanyPrintInfo;
  periodLabel: string;
}

export const PrintablePayrollSummary = React.forwardRef<
  HTMLDivElement,
  PrintablePayrollSummaryProps
>(({ payroll, companyInfo, periodLabel }, ref) => {
  return (
    <div ref={ref} className="p-8 bg-white text-gray-900" style={{ width: "210mm", minHeight: "297mm" }}>
      <PrintCompanyHeader
        company={companyInfo}
        documentTitle="PAYROLL SUMMARY"
        documentNumber={payroll.site_name}
        documentDate={periodLabel}
        secondaryDate={{ label: "Workers", value: String(payroll.worker_count) }}
      />

      <div className="mb-6 flex justify-end">
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Payroll</p>
          <p className="text-2xl font-bold">{formatNPR(payroll.total_payroll)}</p>
        </div>
      </div>

      <table className="w-full text-sm mb-8">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2 px-2 font-semibold">Worker</th>
            <th className="text-left py-2 px-2 font-semibold">Category</th>
            <th className="text-right py-2 px-2 font-semibold">Present</th>
            <th className="text-right py-2 px-2 font-semibold">Half</th>
            <th className="text-right py-2 px-2 font-semibold">OT</th>
            <th className="text-right py-2 px-2 font-semibold">Total Wage</th>
          </tr>
        </thead>
        <tbody>
          {payroll.worker_breakdown.map((row) => (
            <tr key={row.worker_id} className="border-b border-gray-200">
              <td className="py-2 px-2">{row.worker_name}</td>
              <td className="py-2 px-2 capitalize">{row.category}</td>
              <td className="py-2 px-2 text-right">{row.days_present}</td>
              <td className="py-2 px-2 text-right">{row.days_half_day}</td>
              <td className="py-2 px-2 text-right">{row.days_overtime}</td>
              <td className="py-2 px-2 text-right font-medium">{formatNPR(row.total_wage)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300">
            <td colSpan={5} className="py-3 px-2 text-right font-bold">
              Total
            </td>
            <td className="py-3 px-2 text-right font-bold">{formatNPR(payroll.total_payroll)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
        Generated from Khata Construction · Payroll Summary
      </div>
    </div>
  );
});

PrintablePayrollSummary.displayName = "PrintablePayrollSummary";
