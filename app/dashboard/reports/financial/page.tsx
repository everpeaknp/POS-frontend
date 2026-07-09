"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportFilter } from "@/components/reports/ReportFilter";
import { ExportButtons } from "@/components/reports/ExportButtons";
import {
  ReportsPageShell,
  reportsCardClass,
} from "@/components/reports/ReportsPageShell";
import { reportsAPI, type FinancialReportsData } from "@/lib/api/reports";
import { tenantApi, type Tenant } from "@/lib/api/tenant";
import { useAuth } from "@/lib/context/AuthContext";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ExportTableData, ExportRow } from "@/lib/utils/export";
import { tenantToExportOrg } from "@/lib/utils/export";

export default function FinancialReportPage() {
  const { user } = useAuth();
  const [data, setData] = useState<FinancialReportsData | null>(null);
  const [orgProfile, setOrgProfile] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [activeTab, setActiveTab] = useState("pnl");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsAPI.financialReports({
        from_date: fromDate,
        to_date: toDate,
        as_of_date: asOfDate,
      });
      setData(result);
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number; data?: { detail?: string } } };
      console.error("Failed to load financial reports:", err);
      const detail =
        apiErr.response?.status === 403
          ? "You do not have permission to view financial reports."
          : apiErr.response?.data?.detail || "Failed to load financial reports";
      setError(detail);
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, asOfDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const slug = user?.tenant?.slug;
    if (!slug) return;
    tenantApi
      .getBySlug(slug)
      .then(setOrgProfile)
      .catch(() => {
        /* use minimal tenant from auth if profile fetch fails */
      });
  }, [user?.tenant?.slug]);

  const formatCurrency = (amount: number) => formatNPR(amount);

  const getExportData = useCallback((): ExportTableData | null => {
    if (!data) return null;

    const org = orgProfile
      ? tenantToExportOrg(orgProfile)
      : user?.tenant
        ? tenantToExportOrg({
            name: user.tenant.name,
            workspace_name: user.tenant.workspace_name,
            email: user.tenant.email,
          })
        : undefined;

    const baseExport = (
      partial: Omit<ExportTableData, "org" | "template" | "reportType">
    ): ExportTableData => ({
      ...partial,
      reportType: "Financial Report",
      template: "financial",
      org,
    });

    if (activeTab === "balance") {
      const rows: ExportRow[] = [
        { cells: ["ASSETS", "", ""], style: "section" },
        ...data.balance_sheet.assets.map((item) => ({
          cells: ["", item.account, formatCurrency(item.amount)],
        })),
        {
          cells: ["", "Total Assets", formatCurrency(data.balance_sheet.total_assets)],
          style: "total",
        },
        { cells: ["LIABILITIES & EQUITY", "", ""], style: "section" },
        ...data.balance_sheet.liabilities.map((item) => ({
          cells: ["", item.account, formatCurrency(item.amount)],
        })),
        ...data.balance_sheet.equity.map((item) => ({
          cells: ["", item.account, formatCurrency(item.amount)],
        })),
        {
          cells: [
            "",
            "Total Liabilities & Equity",
            formatCurrency(data.balance_sheet.total_liabilities + data.balance_sheet.total_equity),
          ],
          style: "total",
        },
      ];
      return baseExport({
        filename: `balance-sheet-${data.balance_sheet.as_of_date}`,
        title: "Balance Sheet",
        subtitle: `As of ${data.balance_sheet.as_of_date}`,
        headers: ["Section", "Account", "Amount (NPR)"],
        rows,
        rightAlignColumns: [2],
      });
    }

    if (activeTab === "trial") {
      if (!data.trial_balance.accounts.length) return null;
      return baseExport({
        filename: `trial-balance-${data.trial_balance.as_of_date}`,
        title: "Trial Balance",
        subtitle: `As of ${data.trial_balance.as_of_date}`,
        headers: ["Account", "Debit (NPR)", "Credit (NPR)"],
        rows: [
          ...data.trial_balance.accounts.map((item) => ({
            cells: [
              item.account,
              item.debit > 0 ? formatCurrency(item.debit) : "—",
              item.credit > 0 ? formatCurrency(item.credit) : "—",
            ],
          })),
          {
            cells: [
              "TOTAL",
              formatCurrency(data.trial_balance.total_debit),
              formatCurrency(data.trial_balance.total_credit),
            ],
            style: "total",
          },
        ],
        rightAlignColumns: [1, 2],
      });
    }

    if (activeTab === "cashflow") {
      const cf = data.cash_flow;
      return baseExport({
        filename: `cash-flow-${cf.period.from_date}`,
        title: "Cash Flow Statement",
        subtitle: `${cf.period.from_date} to ${cf.period.to_date}`,
        headers: ["Description", "Amount (NPR)"],
        rows: [
          { cells: ["Operating Activities", formatCurrency(cf.operating_activities)] },
          { cells: ["Investing Activities", formatCurrency(cf.investing_activities)] },
          { cells: ["Financing Activities", formatCurrency(cf.financing_activities)] },
          { cells: ["Net Change in Cash", formatCurrency(cf.net_cash_change)], style: "subtotal" },
          { cells: ["Opening Cash Balance", formatCurrency(cf.opening_cash)] },
          { cells: ["Closing Cash Balance", formatCurrency(cf.closing_cash)], style: "total" },
        ],
        rightAlignColumns: [1],
      });
    }

    const pnl = data.profit_and_loss;
    return baseExport({
      filename: `profit-loss-${pnl.period.from_date}`,
      title: "Profit & Loss Statement",
      subtitle: `${pnl.period.from_date} to ${pnl.period.to_date}`,
      headers: ["Category", "Account", "Amount (NPR)"],
      rows: [
        { cells: ["REVENUE", "", formatCurrency(pnl.total_income)], style: "section" },
        ...pnl.income.map((item) => ({
          cells: ["", item.account, formatCurrency(item.amount)],
        })),
        { cells: ["EXPENSES", "", formatCurrency(pnl.total_expenses)], style: "section" },
        ...pnl.expenses.map((item) => ({
          cells: ["", item.account, formatCurrency(item.amount)],
        })),
        {
          cells: [
            pnl.net_profit >= 0 ? "NET PROFIT" : "NET LOSS",
            "",
            formatCurrency(Math.abs(pnl.net_profit)),
          ],
          style: "total",
        },
      ],
      rightAlignColumns: [2],
    });
  }, [data, activeTab, orgProfile, user?.tenant]);

  return (
    <ReportsPageShell
      title="Financial Report"
      subtitle="P&L, Balance Sheet, Trial Balance, and Cash Flow"
      loading={loading && !data}
      error={error}
      onRetry={fetchData}
      toolbar={
        <>
          <ReportFilter
            embedded
            period="month"
            periods={["month"]}
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onPeriodChange={() => {}}
            onGenerate={fetchData}
            loading={loading}
          />
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground">
            <span className="whitespace-nowrap">As of:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="h-9 px-3 border border-gray-200 dark:border-border rounded-lg text-sm bg-white dark:bg-card"
            />
          </div>
        </>
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {data && (
        <div className={`${reportsCardClass} p-6`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="pnl">P&L</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="trial">Trial Balance</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="pnl" className="space-y-4 mt-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Profit & Loss</h3>
                <p className="text-xs text-gray-600 mt-1">
                  <FormattedDate value={data.profit_and_loss.period.from_date} /> –{" "}
                  <FormattedDate value={data.profit_and_loss.period.to_date} />
                </p>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-200">
                  <tr className="font-semibold">
                    <td className="py-2 text-gray-900">REVENUE</td>
                    <td className="py-2 text-right">
                      {formatCurrency(data.profit_and_loss.total_income)}
                    </td>
                  </tr>
                  {data.profit_and_loss.income.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pl-4 text-gray-600">{item.account}</td>
                      <td className="py-2 text-right text-gray-600">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold bg-gray-50">
                    <td className="py-2 text-gray-900">EXPENSES</td>
                    <td className="py-2 text-right">
                      {formatCurrency(data.profit_and_loss.total_expenses)}
                    </td>
                  </tr>
                  {data.profit_and_loss.expenses.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pl-4 text-gray-600">{item.account}</td>
                      <td className="py-2 text-right text-gray-600">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr
                    className={`font-bold ${
                      data.profit_and_loss.net_profit >= 0 ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <td className="py-2">
                      {data.profit_and_loss.net_profit >= 0 ? "NET PROFIT" : "NET LOSS"}
                    </td>
                    <td className="py-2 text-right">
                      {formatCurrency(Math.abs(data.profit_and_loss.net_profit))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </TabsContent>

            <TabsContent value="balance" className="space-y-4 mt-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Balance Sheet</h3>
                <p className="text-xs text-gray-600 mt-1">
                  As of <FormattedDate value={data.balance_sheet.as_of_date} />
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">ASSETS</h4>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-200">
                      {data.balance_sheet.assets.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 text-gray-600">{item.account}</td>
                          <td className="py-2 text-right">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-blue-50">
                        <td className="py-2">TOTAL ASSETS</td>
                        <td className="py-2 text-right">
                          {formatCurrency(data.balance_sheet.total_assets)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    LIABILITIES & EQUITY
                  </h4>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-200">
                      {data.balance_sheet.liabilities.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 pl-4 text-gray-600">{item.account}</td>
                          <td className="py-2 text-right">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      {data.balance_sheet.equity.map((item, idx) => (
                        <tr key={`eq-${idx}`}>
                          <td className="py-2 pl-4 text-gray-600">{item.account}</td>
                          <td className="py-2 text-right">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-blue-50">
                        <td className="py-2">TOTAL LIAB. & EQUITY</td>
                        <td className="py-2 text-right">
                          {formatCurrency(
                            data.balance_sheet.total_liabilities +
                              data.balance_sheet.total_equity
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trial" className="space-y-4 mt-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Trial Balance</h3>
                <p className="text-xs text-gray-600 mt-1">
                  As of <FormattedDate value={data.trial_balance.as_of_date} />
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Account", "Debit", "Credit"].map((h) => (
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
                    {data.trial_balance.accounts.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">{item.account}</td>
                        <td className="px-4 py-3 text-right">
                          {item.debit > 0 ? formatCurrency(item.debit) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.credit > 0 ? formatCurrency(item.credit) : "—"}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-gray-100">
                      <td className="px-4 py-3">TOTAL</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(data.trial_balance.total_debit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(data.trial_balance.total_credit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="cashflow" className="space-y-4 mt-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Cash Flow Statement</h3>
                <p className="text-xs text-gray-600 mt-1">
                  <FormattedDate value={data.cash_flow.period.from_date} /> –{" "}
                  <FormattedDate value={data.cash_flow.period.to_date} />
                </p>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ["Operating Activities", data.cash_flow.operating_activities],
                  ["Investing Activities", data.cash_flow.investing_activities],
                  ["Financing Activities", data.cash_flow.financing_activities],
                ].map(([label, amount]) => (
                  <div
                    key={label as string}
                    className="flex justify-between font-medium bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    <span>{label}</span>
                    <span>{formatCurrency(amount as number)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Net Change in Cash</span>
                    <span
                      className={
                        data.cash_flow.net_cash_change >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {formatCurrency(data.cash_flow.net_cash_change)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Opening Cash</span>
                    <span>{formatCurrency(data.cash_flow.opening_cash)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Closing Cash</span>
                    <span>{formatCurrency(data.cash_flow.closing_cash)}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </ReportsPageShell>
  );
}
