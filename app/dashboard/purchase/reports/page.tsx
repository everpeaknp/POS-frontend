"use client";

import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { reportsAPI } from "@/lib/api/reports";
import toast from "react-hot-toast";

const TABS = ["Purchase Summary", "By Supplier", "By Product", "Tax Report"];
const DATE_RANGES = ["This Week", "This Month", "This Quarter", "This Year"];

const dateRangeMap: Record<string, "week" | "month" | "quarter" | "year"> = {
  "This Week": "week",
  "This Month": "month",
  "This Quarter": "quarter",
  "This Year": "year",
};

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

function DateRangeFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DATE_RANGES.map((r) => (
        <button key={r} onClick={() => onChange(r)}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
            value === r ? "bg-[#22C55E] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}>
          {r}
        </button>
      ))}
    </div>
  );
}

export default function PurchaseReportsPage() {
  const [tab, setTab] = useState("Purchase Summary");
  const [dateRange, setDateRange] = useState("This Month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportData = await reportsAPI.purchaseReports({
        date_range: dateRangeMap[dateRange],
      });
      setData(reportData);
    } catch (error) {
      console.error("Error loading purchase reports:", error);
      toast.error("Failed to load purchase reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Purchase Reports" subtitle="Analytics and spending insights" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const bySupplier = data?.by_supplier || [];
  const byProduct = data?.by_product || [];
  const taxReport = data?.tax_report || {};
  const monthlyTrend = data?.monthly_trend || [];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Purchase Reports" subtitle="Analytics and spending insights" />
      <div className="flex-1 p-6 space-y-4">

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-gray-600 border-gray-200">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-gray-600 border-gray-200">
            <Download className="h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>

        {tab === "Purchase Summary" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Purchases", value: fmt(summary.total_purchases || 0), sub: `${summary.total_orders || 0} orders` },
                { label: "Total Orders", value: summary.total_orders || 0, sub: "Purchase invoices" },
                { label: "Avg Order Value", value: fmt(summary.avg_order_value || 0), sub: "Per transaction" },
                { label: "Total Paid", value: fmt(summary.total_paid || 0), sub: `${summary.payment_rate_percentage || 0}% payment rate` },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{typeof s.value === 'number' && s.label !== "Total Orders" ? s.value : s.value}</p>
                  <p className="text-xs text-[#22C55E] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Purchase Trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`, "Purchases"]} />
                  <Line type="monotone" dataKey="purchases" stroke="#22C55E" strokeWidth={2.5} dot={{ fill: "#22C55E", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{["Month", "Orders", "Amount", "Paid", "Outstanding"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthlyTrend.map((row: any) => (
                    <tr key={row.month} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{row.month}</td>
                      <td className="px-4 py-3 text-gray-600">{Math.floor(row.purchases / (summary.avg_order_value || 1))}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{fmt(row.purchases)}</td>
                      <td className="px-4 py-3 text-[#22C55E] font-medium">{fmt(Math.floor(row.purchases * 0.88))}</td>
                      <td className="px-4 py-3 text-red-500">{fmt(Math.floor(row.purchases * 0.12))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "By Supplier" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Purchases by Supplier</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bySupplier}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="supplier_name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`, "Amount"]} />
                  <Bar dataKey="amount" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{["Supplier", "Orders", "Total Purchased", "Outstanding", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bySupplier.map((s: any) => (
                    <tr key={s.supplier_id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{s.supplier_name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.orders}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{fmt(s.amount)}</td>
                      <td className="px-4 py-3 text-red-500 font-medium">{fmt(s.outstanding)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "By Product" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Purchases by Product</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byProduct}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="product_name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`]} />
                  <Legend />
                  <Bar dataKey="amount" name="Amount" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="qty" name="Qty" fill="#86EFAC" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{["Product", "Unit", "Avg Price", "Qty Purchased", "Total Amount"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {byProduct.map((p: any) => (
                    <tr key={p.product_id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{p.product_name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.unit}</td>
                      <td className="px-4 py-3 text-gray-600">Rs. {p.avg_price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{p.qty}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{fmt(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "Tax Report" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Taxable Purchases", value: fmt(taxReport.total_taxable || 0) },
                { label: "Input VAT (13%)", value: fmt(taxReport.total_vat || 0) },
                { label: "Net VAT Claimable", value: fmt(taxReport.total_vat || 0) },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Input VAT by Month</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={taxReport.monthly_data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`]} />
                  <Legend />
                  <Bar dataKey="taxable" name="Taxable Purchases" fill="#86EFAC" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="vat" name="Input VAT (13%)" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{["Period", "Taxable Purchases", "VAT Rate", "Input VAT", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(taxReport.monthly_data || []).map((row: any) => (
                    <tr key={row.month} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{row.month} 2082</td>
                      <td className="px-4 py-3 text-gray-600">{fmt(row.taxable)}</td>
                      <td className="px-4 py-3 text-gray-600">13%</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{fmt(row.vat)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Claimable</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
