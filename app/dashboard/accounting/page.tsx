"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import toast from "react-hot-toast";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountingPageShell } from "@/components/dashboard/AccountingPageShell";
import { accountsAPI, type AccountingDashboardSummary } from "@/lib/api/accounting";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { useAuth } from "@/lib/context/AuthContext";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { tenantApi } from "@/lib/api/tenant";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;
const COLORS = ["#22C55E", "#86EFAC", "#FCA5A5", "#60A5FA", "#F59E0B", "#A78BFA"];

export default function AccountingDashboard() {
  const { user, refreshUser } = useAuth();
  const { hasModuleAccess, canView } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [enablingModule, setEnablingModule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AccountingDashboardSummary | null>(null);

  const accountingModuleActive = hasModuleAccess("accounting");
  const canEnableAccounting = user?.role === "admin" && !!user?.tenant?.slug;

  useEffect(() => {
    if (!accountingModuleActive) {
      setLoading(false);
      return;
    }
    void fetchDashboard();
  }, [accountingModuleActive]);

  const fetchDashboard = async () => {
    if (!canView("accounting")) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const summary = await accountsAPI.dashboardSummary();
      setData(summary);
    } catch {
      setError("Failed to load dashboard data.");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleEnableAccountingModule = async () => {
    if (!user?.tenant?.slug) return;
    try {
      setEnablingModule(true);
      await tenantApi.activateModule(user.tenant.slug, "accounting");
      await refreshUser();
      toast.success("Accounting module enabled");
    } catch {
      toast.error("Failed to enable accounting module");
    } finally {
      setEnablingModule(false);
    }
  };

  if (!accountingModuleActive) {
    return (
      <AccountingPageShell title="Accounting" subtitle="Financial overview">
        <div className="bg-white rounded-xl border border-gray-100 p-8 max-w-xl mx-auto text-center shadow-sm">
          <Calculator className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-gray-900">Accounting is not enabled</h2>
          <p className="text-sm text-gray-500 mt-2">
            Enable the accounting module to manage chart of accounts, journals, bank accounts, and tax returns.
          </p>
          {canEnableAccounting ? (
            <Button
              className="mt-6 bg-[#22C55E] hover:bg-[#16A34A] text-white"
              onClick={handleEnableAccountingModule}
              disabled={enablingModule}
            >
              {enablingModule ? "Enabling..." : "Enable Accounting"}
            </Button>
          ) : (
            <p className="text-sm text-gray-500 mt-6">Contact your organization admin to enable this module.</p>
          )}
        </div>
      </AccountingPageShell>
    );
  }

  if (loading) {
    return (
      <AccountingPageShell title="Accounting" subtitle="Financial overview" loading loadingMessage="Loading dashboard…" />
    );
  }

  if (error || !data) {
    return (
      <AccountingPageShell title="Accounting" subtitle="Error" error={error || "Failed to load"} onRetry={fetchDashboard} />
    );
  }

  const expenseBreakdown =
    data.expense_breakdown && data.expense_breakdown.length > 0
      ? data.expense_breakdown.map((x) => ({ name: x.name, value: x.amount }))
      : [
          { name: "Monthly expenses", value: data.monthly_expenses },
          { name: "COGS (est.)", value: Math.max(0, data.monthly_income - data.monthly_gross_profit) },
        ].filter((x) => x.value > 0);

  const incomeBreakdown =
    data.income_breakdown && data.income_breakdown.length > 0
      ? data.income_breakdown.map((x) => ({ name: x.name, value: x.amount }))
      : [];

  return (
    <AccountingPageShell
      title="Accounting"
      subtitle={`FY ${data.fiscal_year.label} (Nepal) · ${data.period.from_date} to ${data.period.to_date}`}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Cash in Hand", value: fmt(data.cash_in_hand) },
            { label: "Petty Cash", value: fmt(data.petty_cash ?? 0) },
            { label: "Bank Balance", value: fmt(data.bank_balance) },
            { label: "Today's Income", value: fmt(data.today_income) },
            { label: "Today's Expenses", value: fmt(data.today_expenses) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Monthly Income", value: fmt(data.monthly_income) },
            { label: "Monthly Expenses", value: fmt(data.monthly_expenses) },
            { label: "Gross Profit", value: fmt(data.monthly_gross_profit), green: true },
            { label: "Net Profit", value: fmt(data.monthly_net_profit), green: data.monthly_net_profit >= 0 },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.green ? "text-[#22C55E]" : "text-gray-900"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "FY Revenue", value: fmt(data.fiscal_revenue) },
            { label: "FY Expenses", value: fmt(data.fiscal_expenses) },
            { label: "FY Gross Profit", value: fmt(data.fiscal_gross_profit) },
            { label: "FY Net Profit", value: fmt(data.fiscal_net_profit), green: data.fiscal_net_profit >= 0 },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.green ? "text-[#22C55E]" : "text-gray-900"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Assets", value: fmt(data.total_assets) },
            { label: "Total Liabilities", value: fmt(data.total_liabilities) },
            { label: "Equity", value: fmt(data.total_equity ?? 0) },
            { label: "Working Capital", value: fmt(data.working_capital ?? 0), green: (data.working_capital ?? 0) >= 0 },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.green ? "text-[#22C55E]" : "text-gray-900"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Accounts Receivable", value: fmt(data.customer_outstanding), href: "/dashboard/accounting/reports" },
            { label: "Accounts Payable", value: fmt(data.supplier_outstanding), href: "/dashboard/accounting/reports" },
            { label: "VAT Collected", value: fmt(data.vat_collected), href: "/dashboard/accounting/tax-management" },
            { label: "Outstanding Taxes", value: fmt(data.outstanding_taxes ?? data.vat_payable), href: "/dashboard/accounting/tax-management" },
          ].map((s) => (
            <Link key={s.label} href={s.href} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-[#22C55E]/30">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue vs Expense (6 months)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Financial Ratios</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Current ratio</span>
                <span className="font-medium">{data.financial_ratios.current_ratio?.toFixed(2) ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Net margin</span>
                <span className="font-medium">{data.financial_ratios.net_margin_pct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Debt to equity</span>
                <span className="font-medium">{data.financial_ratios.debt_to_equity?.toFixed(2) ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Working capital</span>
                <span className="font-medium">{fmt(data.financial_ratios.working_capital ?? data.working_capital ?? 0)}</span>
              </div>
              {data.cash_flow_summary && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cash inflows (period)</span>
                    <span className="font-medium">{fmt(data.cash_flow_summary.cash_inflows)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Net cash flow</span>
                    <span className={`font-medium ${data.cash_flow_summary.net_cash_flow >= 0 ? "text-[#22C55E]" : "text-red-600"}`}>
                      {fmt(data.cash_flow_summary.net_cash_flow)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">VAT net payable (FY)</span>
                <span className="font-medium">{fmt(data.vat_payable)}</span>
              </div>
            </div>
          </div>
        </div>

        {(data.asset_distribution?.length || data.liability_distribution?.length || incomeBreakdown.length) ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {(data.asset_distribution?.length ?? 0) > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Asset Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.asset_distribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                      {data.asset_distribution!.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {(data.liability_distribution?.length ?? 0) > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Liability Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.liability_distribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                      {data.liability_distribution!.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {incomeBreakdown.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Income Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={incomeBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                      {incomeBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Profit Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Line type="monotone" dataKey="net_profit" name="Net profit" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {expenseBreakdown.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Expense Summary</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Recent Journal Entries</h3>
              <Link href="/dashboard/accounting/journal-entries" className="text-xs text-[#22C55E] hover:underline">View all</Link>
            </div>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {["Entry #", "Date", "Amount", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recent_journal_entries.map((je) => (
                    <tr key={je.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2">
                        <Link href={`/dashboard/accounting/journal-entries/${je.id}`} className="text-[#22C55E] font-mono text-xs">
                          {je.entry_number}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500"><FormattedDate value={je.date} /></td>
                      <td className="px-4 py-2 text-xs">{fmt(Number(je.total_debit))}</td>
                      <td className="px-4 py-2 text-xs capitalize">{je.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Upcoming Payments (7 days)</h3>
            </div>
            {data.upcoming_payments.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No due payments in the next 7 days.</p>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {data.upcoming_payments.map((item) => (
                  <li key={`${item.kind}-${item.reference}`} className="px-4 py-3 flex justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{item.party}</p>
                      <p className="text-xs text-gray-500">{item.reference} · <FormattedDate value={item.due_date} /></p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{fmt(item.amount)}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.kind}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {(data.recent_bank_transactions?.length ?? 0) > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Recent Bank Transactions</h3>
              <Link href="/dashboard/accounting/bank-accounts" className="text-xs text-[#22C55E] hover:underline">View banks</Link>
            </div>
            <div className="overflow-x-auto max-h-48">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {["Date", "Bank", "Description", "Amount"].map((h) => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recent_bank_transactions!.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-2 text-xs"><FormattedDate value={tx.date} /></td>
                      <td className="px-4 py-2 text-xs">{tx.bank_account__bank_name}</td>
                      <td className="px-4 py-2 text-xs truncate max-w-[200px]">{tx.description}</td>
                      <td className="px-4 py-2 text-xs font-medium">
                        {tx.credit > 0 ? `+${fmt(tx.credit)}` : `-${fmt(tx.debit)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AccountingPageShell>
  );
}
