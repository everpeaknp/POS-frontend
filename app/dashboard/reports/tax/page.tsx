"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportFilter } from "@/components/reports/ReportFilter";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import {
  ReportsPageShell,
  reportsCardClass,
  reportsTableWrapClass,
} from "@/components/reports/ReportsPageShell";
import { reportsAPI, type TaxReportsData } from "@/lib/api/reports";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

function defaultFiscalRange() {
  const today = new Date();
  if (today.getMonth() >= 6) {
    return {
      from: format(new Date(today.getFullYear(), 6, 1), "yyyy-MM-dd"),
      to: format(today, "yyyy-MM-dd"),
    };
  }
  return {
    from: format(new Date(today.getFullYear() - 1, 6, 1), "yyyy-MM-dd"),
    to: format(today, "yyyy-MM-dd"),
  };
}

export default function TaxReportPage() {
  const fiscal = defaultFiscalRange();
  const [data, setData] = useState<TaxReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(fiscal.from);
  const [toDate, setToDate] = useState(fiscal.to);
  const [activeTab, setActiveTab] = useState("vat");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsAPI.taxReports({
        from_date: fromDate,
        to_date: toDate,
      });
      setData(result);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to load tax reports:", err);
      setError(apiErr.response?.data?.detail || "Failed to load tax reports");
      toast.error("Failed to load tax reports");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const vatStats = data
    ? [
        { label: "Output VAT", value: formatNPR(data.vat.output_vat) },
        { label: "Input VAT", value: formatNPR(data.vat.input_vat) },
        { label: "Net VAT Payable", value: formatNPR(data.vat.net_payable) },
        { label: "Returns Filed", value: String(data.vat.returns_filed) },
      ]
    : [];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!data) return null;

    if (activeTab === "tds") {
      if (!data.tds.details.length) return null;
      return {
        filename: `tds-report-${fromDate}`,
        title: "TDS Report",
        subtitle: `${fromDate} to ${toDate}`,
        headers: ["Supplier", "PAN", "Type", "Gross", "Rate", "TDS", "Date", "Submitted"],
        rows: data.tds.details.map((item) => [
          item.supplier,
          item.pan,
          item.type,
          formatNPR(item.gross),
          `${item.rate}%`,
          formatNPR(item.tds),
          item.date,
          item.submitted ? "Yes" : "No",
        ]),
      };
    }

    if (activeTab === "income") {
      if (!data.income_tax.employees.length) return null;
      return {
        filename: `income-tax-report-${fromDate}`,
        title: "Income Tax Report",
        subtitle: `${fromDate} to ${toDate}`,
        headers: ["Employee", "PAN", "Gross YTD", "Taxable", "Slab", "Tax", "Deducted", "Balance"],
        rows: data.income_tax.employees.map((item) => [
          item.employee,
          item.pan,
          formatNPR(item.gross_salary_ytd),
          formatNPR(item.taxable_income),
          item.tax_slab,
          formatNPR(item.tax_amount),
          formatNPR(item.tax_deducted),
          formatNPR(item.balance),
        ]),
      };
    }

    if (!data.vat.monthly.length) return null;
    return {
      filename: `vat-report-${fromDate}`,
      title: "VAT Report",
      subtitle: `${fromDate} to ${toDate}`,
      headers: ["Month", "Sales (Ex VAT)", "Output VAT", "Purchases (Ex VAT)", "Input VAT", "Net VAT", "Status"],
      rows: data.vat.monthly.map((month) => [
        month.month,
        formatNPR(month.sales_ex_vat),
        formatNPR(month.output_vat),
        formatNPR(month.purchases_ex_vat),
        formatNPR(month.input_vat),
        formatNPR(month.net_vat),
        month.status,
      ]),
    };
  }, [data, activeTab, fromDate, toDate]);

  return (
    <ReportsPageShell
      title="Tax Report"
      subtitle="VAT, TDS, and income tax summaries"
      loading={loading && !data}
      error={error}
      onRetry={fetchData}
      toolbar={
        <ReportFilter
          embedded
          period="year"
          periods={["year"]}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onPeriodChange={() => {}}
          onGenerate={fetchData}
          loading={loading}
        />
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {data && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <div className={`${reportsCardClass} p-2`}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="vat">VAT</TabsTrigger>
              <TabsTrigger value="tds">TDS</TabsTrigger>
              <TabsTrigger value="income">Income Tax</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="vat" className="space-y-4">
            <SummaryCards cards={vatStats} />
            <div className={reportsTableWrapClass}>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">VAT by Month</h3>
              </div>
              {data.vat.monthly.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {[
                          "Month",
                          "Sales (Ex VAT)",
                          "Output VAT",
                          "Purchases (Ex VAT)",
                          "Input VAT",
                          "Net VAT",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.vat.monthly.map((month, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium">{month.month}</td>
                          <td className="px-4 py-3">{formatNPR(month.sales_ex_vat)}</td>
                          <td className="px-4 py-3">{formatNPR(month.output_vat)}</td>
                          <td className="px-4 py-3">{formatNPR(month.purchases_ex_vat)}</td>
                          <td className="px-4 py-3">{formatNPR(month.input_vat)}</td>
                          <td className="px-4 py-3 font-medium">
                            {formatNPR(month.net_vat)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                month.status === "filed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {month.status.charAt(0).toUpperCase() + month.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  No VAT data for{" "}
                  <FormattedDate value={data.period.from_date} /> –{" "}
                  <FormattedDate value={data.period.to_date} />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tds" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ["Total TDS Deducted", data.tds.total_deducted],
                ["On Services (15%)", data.tds.on_services],
                ["On Rent (10%)", data.tds.on_rent],
                ["On Goods (1.5%)", data.tds.on_goods],
              ].map(([label, amount]) => (
                <div key={label as string} className={`${reportsCardClass} p-4`}>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNPR(amount as number)}
                  </p>
                </div>
              ))}
            </div>

            <div className={reportsTableWrapClass}>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">TDS Details</h3>
              </div>
              {data.tds.details.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {[
                          "Supplier",
                          "PAN",
                          "Type",
                          "Gross",
                          "Rate",
                          "TDS",
                          "Date",
                          "Submitted",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.tds.details.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium">{item.supplier}</td>
                          <td className="px-4 py-3 font-mono text-xs">{item.pan}</td>
                          <td className="px-4 py-3">{item.type}</td>
                          <td className="px-4 py-3">{formatNPR(item.gross)}</td>
                          <td className="px-4 py-3">{item.rate}%</td>
                          <td className="px-4 py-3 font-medium">{formatNPR(item.tds)}</td>
                          <td className="px-4 py-3">
                            <FormattedDate value={item.date} />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                item.submitted
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {item.submitted ? "Yes" : "No"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">No TDS records</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            <div className={`${reportsCardClass} p-6`}>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Tax Slab Reference (FY 2081/82)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["Up to Rs. 5,00,000", "1%"],
                  ["Rs. 5,00,001 – Rs. 7,00,000", "10%"],
                  ["Rs. 7,00,001 – Rs. 10,00,000", "20%"],
                  ["Above Rs. 10,00,000", "30%"],
                ].map(([range, rate]) => (
                  <div key={range} className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">{range}</p>
                    <p className="text-lg font-bold text-gray-900">{rate}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={reportsTableWrapClass}>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">
                  Employee Income Tax Summary
                </h3>
              </div>
              {data.income_tax.employees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {[
                          "Employee",
                          "PAN",
                          "Gross YTD",
                          "Taxable",
                          "Slab",
                          "Tax",
                          "Deducted",
                          "Balance",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.income_tax.employees.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium">{item.employee}</td>
                          <td className="px-4 py-3 font-mono text-xs">{item.pan}</td>
                          <td className="px-4 py-3">{formatNPR(item.gross_salary_ytd)}</td>
                          <td className="px-4 py-3">{formatNPR(item.taxable_income)}</td>
                          <td className="px-4 py-3">{item.tax_slab}</td>
                          <td className="px-4 py-3">{formatNPR(item.tax_amount)}</td>
                          <td className="px-4 py-3">{formatNPR(item.tax_deducted)}</td>
                          <td className="px-4 py-3">{formatNPR(item.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  No payroll income tax data for this period
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </ReportsPageShell>
  );
}
