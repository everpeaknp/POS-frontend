"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { DateInput } from "@/components/shared/DateInput";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { reportsAPI } from "@/lib/api/reports";
import { salesReportsAPI } from "@/lib/api/sales";
import { inventoryApi } from "@/lib/api/inventory";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

type ReportKey =
  | "sales"
  | "inventory"
  | "credit"
  | "products"
  | "payments"
  | "bulk";

const reportMeta: Record<
  ReportKey,
  { title: string; description: string; href?: string }
> = {
  sales: {
    title: "Sales Performance",
    description: "Hardware sales trends and performance metrics",
    href: "/dashboard/sales/reports",
  },
  inventory: {
    title: "Inventory Valuation",
    description: "Current stock value and inventory metrics",
    href: "/dashboard/inventory/reports",
  },
  credit: {
    title: "Credit Summary",
    description: "Outstanding balances and credit utilization",
    href: "/dashboard/reports/financial",
  },
  products: {
    title: "Top Products",
    description: "Best-selling products by revenue",
  },
  payments: {
    title: "Payment Collection",
    description: "Sales summary with payment breakdown",
  },
  bulk: {
    title: "Bulk Pricing Rules",
    description: "Active volume discount rules",
    href: "/dashboard/inventory/bulk-pricing",
  },
};

export default function HardwareReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [activeReport, setActiveReport] = useState<ReportKey>("sales");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<unknown>(null);

  const loadReport = useCallback(async (key: ReportKey) => {
    setLoading(true);
    setReportData(null);
    try {
      const params = { start_date: dateRange.start, end_date: dateRange.end };
      let data: unknown;

      switch (key) {
        case "sales":
          data = await reportsAPI.salesPerformance(params);
          break;
        case "inventory":
          data = await reportsAPI.inventoryValuation();
          break;
        case "credit":
          data = await reportsAPI.creditSummary({ limit: 10 });
          break;
        case "products":
          data = await salesReportsAPI.getByProduct(params);
          break;
        case "payments":
          data = await salesReportsAPI.getSalesSummary(params);
          break;
        case "bulk":
          data = await inventoryApi.bulkPricing.list();
          break;
      }

      setReportData(data);
    } catch (error) {
      console.error("Failed to load report:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadReport(activeReport);
  }, [activeReport, loadReport]);

  const renderReportBody = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      );
    }

    if (!reportData) {
      return <p className="text-gray-500 py-8 text-center">No data available</p>;
    }

    const data = reportData as Record<string, unknown>;

    if (activeReport === "sales" && data.top_products) {
      const products = data.top_products as Array<{ name: string; revenue: number; quantity: number }>;
      return (
        <ul className="divide-y divide-gray-100">
          {products.slice(0, 8).map((p, i) => (
            <li key={i} className="flex justify-between py-2 text-sm">
              <span>{p.name}</span>
              <span className="font-medium">{formatNPR(p.revenue)}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (activeReport === "inventory" && data.total_value !== undefined) {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-xl font-bold">{formatNPR(Number(data.total_value))}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Products</p>
            <p className="text-xl font-bold">{String(data.total_products ?? "—")}</p>
          </div>
        </div>
      );
    }

    if (activeReport === "credit") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Total Outstanding</p>
              <p className="text-xl font-bold text-red-600">
                {formatNPR(Number(data.total_outstanding ?? 0))}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Customers with Balance</p>
              <p className="text-xl font-bold">{String(data.customers_with_balance ?? 0)}</p>
            </div>
          </div>
          {Array.isArray(data.top_debtors) && (
            <ul className="divide-y divide-gray-100">
              {(data.top_debtors as Array<{ name: string; balance: number }>).slice(0, 5).map((d, i) => (
                <li key={i} className="flex justify-between py-2 text-sm">
                  <span>{d.name}</span>
                  <span className="font-medium text-red-600">{formatNPR(d.balance)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    if (activeReport === "products" && Array.isArray(data)) {
      return (
        <ul className="divide-y divide-gray-100">
          {(data as Array<{ product_name?: string; name?: string; total_sales?: number; revenue?: number }>)
            .slice(0, 10)
            .map((p, i) => (
              <li key={i} className="flex justify-between py-2 text-sm">
                <span>{p.product_name || p.name}</span>
                <span className="font-medium">{formatNPR(Number(p.total_sales ?? p.revenue ?? 0))}</span>
              </li>
            ))}
        </ul>
      );
    }

    if (activeReport === "payments" && data.total_sales !== undefined) {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Total Sales</p>
            <p className="text-xl font-bold">{formatNPR(Number(data.total_sales))}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Orders</p>
            <p className="text-xl font-bold">{String(data.total_orders ?? "—")}</p>
          </div>
        </div>
      );
    }

    if (activeReport === "bulk") {
      const rules = Array.isArray(data)
        ? data
        : (data as { results?: unknown[] }).results ?? [];
      return (
        <ul className="divide-y divide-gray-100">
          {(rules as Array<{ product_name?: string; min_quantity?: number; discount_percent?: number }>)
            .slice(0, 10)
            .map((r, i) => (
              <li key={i} className="flex justify-between py-2 text-sm">
                <span>{r.product_name || "Product rule"}</span>
                <span className="text-gray-600">
                  {r.min_quantity}+ qty · {r.discount_percent}% off
                </span>
              </li>
            ))}
          {rules.length === 0 && <li className="py-4 text-gray-500 text-center">No bulk pricing rules</li>}
        </ul>
      );
    }

    return (
      <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-64">
        {JSON.stringify(reportData, null, 2)}
      </pre>
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Hardware Reports" subtitle="Live reports from your business data" />
      <div className="flex-1 p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <DateInput
                value={dateRange.start}
                onChange={(date) => setDateRange({ ...dateRange, start: date })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <DateInput
                value={dateRange.end}
                onChange={(date) => setDateRange({ ...dateRange, end: date })}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(reportMeta) as ReportKey[]).map((key) => {
            const meta = reportMeta[key];
            const isActive = activeReport === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveReport(key)}
                className={`text-left bg-white rounded-xl border p-5 shadow-sm transition-all ${
                  isActive
                    ? "border-[#22C55E] ring-1 ring-[#22C55E]"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <h3 className="text-base font-semibold text-gray-900 mb-1">{meta.title}</h3>
                <p className="text-sm text-gray-600">{meta.description}</p>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{reportMeta[activeReport].title}</h3>
            <div className="flex gap-2">
              {reportMeta[activeReport].href && (
                <Link href={reportMeta[activeReport].href!}>
                  <Button variant="outline" size="sm">Full Report</Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={() => loadReport(activeReport)} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          {renderReportBody()}
        </div>
      </div>
    </div>
  );
}
