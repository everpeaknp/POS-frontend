"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { reportsAPI, TaxReportsData } from "@/lib/api/reports";
import toast from "react-hot-toast";

export default function TaxReportPage() {
  const [data, setData] = useState<TaxReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await reportsAPI.taxReports();
        setData(result);
      } catch (error: any) {
        console.error("Failed to load tax reports:", error);
        toast.error(error.response?.data?.detail || "Failed to load tax reports");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Tax Report" subtitle="VAT, TDS and tax summaries" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tax reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Tax Report" subtitle="VAT, TDS and tax summaries" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">No tax data available</p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const vatStats = [
    { label: "Output VAT", value: formatCurrency(data.vat.output_vat) },
    { label: "Input VAT", value: formatCurrency(data.vat.input_vat) },
    { label: "Net VAT Payable", value: formatCurrency(data.vat.net_payable) },
    { label: "Returns Filed", value: data.vat.returns_filed.toString() },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Tax Report" subtitle="VAT, TDS and tax summaries" />
      <div className="flex-1 p-6 space-y-6">
        {/* Export Buttons */}
        <div className="flex justify-end">
          <ExportButtons />
        </div>

        <div className="space-y-6">
          <Tabs defaultValue="vat" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="vat">VAT Report</TabsTrigger>
              <TabsTrigger value="tds">TDS Report</TabsTrigger>
              <TabsTrigger value="income">Income Tax</TabsTrigger>
            </TabsList>

            {/* VAT Tab */}
            <TabsContent value="vat" className="space-y-4 mt-4">
              <SummaryCards cards={vatStats} />

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">VAT Summary by Month</h3>
                </div>
                {data.vat.monthly.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Month", "Sales (Ex VAT)", "Output VAT", "Purchases (Ex VAT)", "Input VAT", "Net VAT", "Status"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.vat.monthly.map((month, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">{month.month}</td>
                          <td className="px-4 py-3 text-gray-600">{formatCurrency(month.sales_ex_vat)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatCurrency(month.output_vat)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatCurrency(month.purchases_ex_vat)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatCurrency(month.input_vat)}</td>
                          <td className="px-4 py-3 text-gray-800 font-medium">{formatCurrency(month.net_vat)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${month.status === "filed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {month.status.charAt(0).toUpperCase() + month.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No VAT data available for the selected period
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TDS Tab */}
            <TabsContent value="tds" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Total TDS Deducted</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.tds.total_deducted)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">TDS on Services (15%)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.tds.on_services)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">TDS on Rent (10%)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.tds.on_rent)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">TDS on Goods (1.5%)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.tds.on_goods)}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">TDS Details</h3>
                </div>
                {data.tds.details.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Supplier", "PAN", "Payment Type", "Gross Amount", "TDS Rate", "TDS Amount", "Payment Date", "Submitted"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.tds.details.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">{item.supplier}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.pan}</td>
                          <td className="px-4 py-3 text-gray-600">{item.type}</td>
                          <td className="px-4 py-3 text-gray-600">{formatCurrency(item.gross)}</td>
                          <td className="px-4 py-3 text-gray-600">{item.rate}%</td>
                          <td className="px-4 py-3 text-gray-800 font-medium">{formatCurrency(item.tds)}</td>
                          <td className="px-4 py-3 text-gray-600"><FormattedDate value={item.date} /></td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.submitted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {item.submitted ? "Yes" : "No"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No TDS data available for the selected period
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Income Tax Tab */}
            <TabsContent value="income" className="space-y-4 mt-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Tax Slab Reference (FY 2081/82)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Up to Rs. 5,00,000</p>
                    <p className="text-lg font-bold text-gray-900">1%</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Rs. 5,00,001 - Rs. 7,00,000</p>
                    <p className="text-lg font-bold text-gray-900">10%</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Rs. 7,00,001 - Rs. 10,00,000</p>
                    <p className="text-lg font-bold text-gray-900">20%</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Above Rs. 10,00,000</p>
                    <p className="text-lg font-bold text-gray-900">30%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Employee Income Tax Summary</h3>
                </div>
                {data.income_tax.employees.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Employee", "PAN", "Gross Salary YTD", "Taxable Income", "Tax Slab", "Tax Amount", "Deducted", "Balance"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.income_tax.employees.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">{item.employee}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.pan}</td>
                          <td className="px-4 py-3 text-gray-600">{formatCurrency(item.gross_salary_ytd)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatCurrency(item.taxable_income)}</td>
                          <td className="px-4 py-3 text-gray-600">{item.tax_slab}</td>
                          <td className="px-4 py-3 text-gray-600">{formatCurrency(item.tax_amount)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatCurrency(item.tax_deducted)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatCurrency(item.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No employee income tax data available for the selected period
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
