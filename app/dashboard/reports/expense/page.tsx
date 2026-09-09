"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import {
  ReportsPageShell,
  reportsCardClass,
  reportsTableWrapClass,
} from "@/components/reports/ReportsPageShell";
import { formatNPR } from "@/lib/utils";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

interface ExpenseData {
  category: string;
  amount: number;
  count: number;
}

interface ExpenseResponse {
  results: ExpenseData[];
}

export default function ExpenseReportPage() {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Initialize dates to last 12 months
  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, []);

  const fetchData = useCallback(async (start?: string, end?: string) => {
    if (!start || !end) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ExpenseResponse>("/api/reports/financial-reports/", {
        params: { type: "expense", date_from: start, date_to: end },
      });
      const data = response.data.results || [];
      setExpenses(data);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch expenses:", err);
      setError("Unable to load expenses - feature currently unavailable");
      toast.error("Unable to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      void fetchData(startDate, endDate);
    }
  }, [startDate, endDate, fetchData]);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const stats = [
    { label: "Total Expenses", value: formatNPR(totalExpense) },
    { label: "Categories", value: String(expenses.length) },
    {
      label: "Avg Category",
      value: expenses.length > 0 ? formatNPR(totalExpense / expenses.length) : formatNPR(0),
    },
    { label: "Total Transactions", value: String(expenses.reduce((sum, e) => sum + e.count, 0)) },
  ];

  const chartData = expenses.slice(0, 8);
  const colors = ["#4A5D7A", "#6B7FA3", "#8B9FCC", "#ABB8D8", "#CBD1E4", "#2E3E52", "#1E2530", "#556B8C"];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!expenses.length) return null;
    return {
      filename: `expense-report-${startDate}-to-${endDate}`,
      title: "Expense Report",
      subtitle: `${startDate} to ${endDate}`,
      headers: ["Category", "Amount", "Transactions", "% of Total"],
      rows: expenses.map((cat) => [
        cat.category,
        formatNPR(cat.amount),
        String(cat.count),
        `${((cat.amount / totalExpense) * 100).toFixed(2)}%`,
      ]),
    };
  }, [expenses, startDate, endDate, totalExpense]);

  return (
    <ReportsPageShell
      title="Expense Report"
      subtitle="Categorized expense breakdown"
      loading={loading && !expenses.length}
      error={error}
      onRetry={() => void fetchData(startDate, endDate)}
      toolbar={
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!expenses.length ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No expense data for the selected period
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {chartData.length > 0 && (
              <div className={reportsCardClass}>
                <h3 className="px-6 py-4 border-b border-gray-100 text-sm font-semibold text-gray-700">
                  Expense Distribution
                </h3>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, amount }) => `${category}: ${formatNPR(amount)}`}
                        outerRadius={100}
                        fill="#4A5D7A"
                        dataKey="amount"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className={reportsCardClass}>
              <h3 className="px-6 py-4 border-b border-gray-100 text-sm font-semibold text-gray-700">Summary</h3>
              <div className="p-6 space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Categories</span>
                  <span className="font-medium">{expenses.length}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Transactions</span>
                  <span className="font-medium">{expenses.reduce((sum, e) => sum + e.count, 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="font-semibold text-lg text-red-600">{formatNPR(totalExpense)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Expenses by Category</h3>
            </div>
            {expenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Category", "Amount", "Transactions", "% of Total"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenses.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-900">{cat.category}</td>
                        <td className="px-6 py-3 font-medium text-red-600">{formatNPR(cat.amount)}</td>
                        <td className="px-6 py-3 text-gray-600">{cat.count}</td>
                        <td className="px-6 py-3">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700">
                            {((cat.amount / totalExpense) * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">No category data</div>
            )}
          </div>
        </>
      )}
    </ReportsPageShell>
  );
}
