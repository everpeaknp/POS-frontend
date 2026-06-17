"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { reportsAPI, FinancialReportsData } from "@/lib/api/reports";
import toast from "react-hot-toast";

export default function FinancialReportPage() {
  const [data, setData] = useState<FinancialReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await reportsAPI.financialReports();
        setData(result);
      } catch (error: any) {
        console.error("Failed to load financial reports:", error);
        toast.error(error.response?.data?.detail || "Failed to load financial reports");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Financial Report" subtitle="P&L, Balance Sheet, Trial Balance" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading financial reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Financial Report" subtitle="P&L, Balance Sheet, Trial Balance" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">No financial data available</p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Financial Report" subtitle="P&L, Balance Sheet, Trial Balance" />
      <div className="flex-1 p-6 space-y-6">
        {/* Export Buttons */}
        <div className="flex justify-end">
          <ExportButtons />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <Tabs defaultValue="pnl" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pnl">P&L</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="trial">Trial Balance</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            </TabsList>

            {/* P&L Tab */}
            <TabsContent value="pnl" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Profit & Loss Statement</h3>
                <p className="text-xs text-gray-600">
                  For the period {new Date(data.profit_and_loss.period.from_date).toLocaleDateString()} to {new Date(data.profit_and_loss.period.to_date).toLocaleDateString()}
                </p>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-200">
                  <tr className="font-semibold">
                    <td className="py-2 text-gray-900">REVENUE</td>
                    <td className="py-2 text-right text-gray-900">{formatCurrency(data.profit_and_loss.total_income)}</td>
                  </tr>
                  {data.profit_and_loss.income.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pl-4 text-gray-600">{item.account}</td>
                      <td className="py-2 text-right text-gray-600">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold bg-gray-50">
                    <td className="py-2 text-gray-900">EXPENSES</td>
                    <td className="py-2 text-right text-gray-900">{formatCurrency(data.profit_and_loss.total_expenses)}</td>
                  </tr>
                  {data.profit_and_loss.expenses.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pl-4 text-gray-600">{item.account}</td>
                      <td className="py-2 text-right text-gray-600">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className={`font-bold ${data.profit_and_loss.net_profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <td className={`py-2 ${data.profit_and_loss.net_profit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                      {data.profit_and_loss.net_profit >= 0 ? 'NET PROFIT' : 'NET LOSS'}
                    </td>
                    <td className={`py-2 text-right ${data.profit_and_loss.net_profit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                      {formatCurrency(Math.abs(data.profit_and_loss.net_profit))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </TabsContent>

            {/* Balance Sheet Tab */}
            <TabsContent value="balance" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Balance Sheet</h3>
                <p className="text-xs text-gray-600">
                  As of {new Date(data.balance_sheet.as_of_date).toLocaleDateString()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">ASSETS</h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-200">
                      {data.balance_sheet.assets.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 text-gray-600">{item.account}</td>
                          <td className="py-2 text-right text-gray-600">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-blue-50">
                        <td className="py-2 text-blue-900">TOTAL ASSETS</td>
                        <td className="py-2 text-right text-blue-900">{formatCurrency(data.balance_sheet.total_assets)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">LIABILITIES & EQUITY</h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-200">
                      {data.balance_sheet.liabilities.length > 0 && (
                        <>
                          <tr className="font-semibold">
                            <td className="py-2 text-gray-900">Liabilities</td>
                            <td className="py-2 text-right text-gray-900">{formatCurrency(data.balance_sheet.total_liabilities)}</td>
                          </tr>
                          {data.balance_sheet.liabilities.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-2 pl-4 text-gray-600">{item.account}</td>
                              <td className="py-2 text-right text-gray-600">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </>
                      )}
                      {data.balance_sheet.equity.length > 0 && (
                        <>
                          <tr className="font-semibold">
                            <td className="py-2 text-gray-900">Equity</td>
                            <td className="py-2 text-right text-gray-900">{formatCurrency(data.balance_sheet.total_equity)}</td>
                          </tr>
                          {data.balance_sheet.equity.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-2 pl-4 text-gray-600">{item.account}</td>
                              <td className="py-2 text-right text-gray-600">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </>
                      )}
                      <tr className="font-bold bg-blue-50">
                        <td className="py-2 text-blue-900">TOTAL LIAB. & EQUITY</td>
                        <td className="py-2 text-right text-blue-900">
                          {formatCurrency(data.balance_sheet.total_liabilities + data.balance_sheet.total_equity)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Trial Balance Tab */}
            <TabsContent value="trial" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Trial Balance</h3>
                <p className="text-xs text-gray-600">
                  As of {new Date(data.trial_balance.as_of_date).toLocaleDateString()}
                </p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Account", "Debit", "Credit"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.trial_balance.accounts.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.account}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {item.debit > 0 ? formatCurrency(item.debit) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {item.credit > 0 ? formatCurrency(item.credit) : "-"}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-100">
                    <td className="px-4 py-3 text-gray-900">TOTAL</td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(data.trial_balance.total_debit)}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(data.trial_balance.total_credit)}</td>
                  </tr>
                </tbody>
              </table>
            </TabsContent>

            {/* Cash Flow Tab */}
            <TabsContent value="cashflow" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Cash Flow Statement</h3>
                <p className="text-xs text-gray-600">
                  For the period {new Date(data.cash_flow.period.from_date).toLocaleDateString()} to {new Date(data.cash_flow.period.to_date).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Operating Activities</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between font-semibold bg-gray-50 px-2 py-1">
                      <span>Net Cash from Operations</span>
                      <span>{formatCurrency(data.cash_flow.operating_activities)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Investing Activities</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between font-semibold bg-gray-50 px-2 py-1">
                      <span>Net Cash from Investing</span>
                      <span>{formatCurrency(data.cash_flow.investing_activities)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Financing Activities</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between font-semibold bg-gray-50 px-2 py-1">
                      <span>Net Cash from Financing</span>
                      <span>{formatCurrency(data.cash_flow.financing_activities)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Net Change in Cash</span>
                    <span className={data.cash_flow.net_cash_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(data.cash_flow.net_cash_change)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>Opening Cash Balance</span>
                    <span>{formatCurrency(data.cash_flow.opening_cash)}</span>
                  </div>
                  <div className={`flex justify-between font-bold text-lg ${data.cash_flow.closing_cash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span>Closing Cash Balance</span>
                    <span>{formatCurrency(data.cash_flow.closing_cash)}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
