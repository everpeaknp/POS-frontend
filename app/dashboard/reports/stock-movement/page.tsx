"use client";

import { useState, useEffect, useCallback } from "react";
import { ReportsPageShell, reportsCardClass, reportsTableWrapClass } from "@/components/reports/ReportsPageShell";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { formatNPR } from "@/lib/utils";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

interface StockMovement {
  id: number;
  date: string;
  product_name: string;
  movement_type: "in" | "out" | "adjustment";
  quantity: number;
  reference: string;
  warehouse_name: string;
  notes: string;
}

interface MovementResponse {
  count: number;
  results: StockMovement[];
}

export default function StockMovementPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: "all",
    search: "",
  });
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Initialize dates to last 30 days
  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, []);

  const fetchData = useCallback(async (start?: string, end?: string) => {
    if (!start || !end) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<MovementResponse>("/api/reports/all-transactions/", {
        params: { type: "stock-movement", date_from: start, date_to: end },
      });
      setMovements(response.data.results || []);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch stock movements:", err);
      setError("Unable to load stock movements - feature currently unavailable");
      toast.error("Unable to load stock movements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      void fetchData(startDate, endDate);
    }
  }, [startDate, endDate, fetchData]);

  const filteredMovements = movements.filter((m) => {
    const matchesType = filters.type === "all" || m.movement_type === filters.type;
    const matchesSearch =
      m.product_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      m.reference.toLowerCase().includes(filters.search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const inMovements = filteredMovements.filter((m) => m.movement_type === "in");
  const outMovements = filteredMovements.filter((m) => m.movement_type === "out");
  const adjustments = filteredMovements.filter((m) => m.movement_type === "adjustment");

  const stats = [
    { label: "Total Movements", value: String(filteredMovements.length) },
    { label: "Stock In", value: String(inMovements.reduce((sum, m) => sum + m.quantity, 0)) },
    { label: "Stock Out", value: String(outMovements.reduce((sum, m) => sum + m.quantity, 0)) },
    { label: "Adjustments", value: String(adjustments.length) },
  ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!filteredMovements.length) return null;
    return {
      filename: `stock-movement-${startDate}-to-${endDate}`,
      title: "Stock Movement Report",
      subtitle: `${startDate} to ${endDate}`,
      headers: ["Date", "Product", "Type", "Quantity", "Warehouse", "Reference", "Notes"],
      rows: filteredMovements.map((m) => [
        new Date(m.date).toLocaleDateString(),
        m.product_name,
        m.movement_type,
        String(m.quantity),
        m.warehouse_name,
        m.reference,
        m.notes,
      ]),
    };
  }, [filteredMovements, startDate, endDate]);

  return (
    <ReportsPageShell
      title="Stock Movement"
      subtitle="Track stock in and out"
      loading={loading && !movements.length}
      error={error}
      onRetry={() => void fetchData(startDate, endDate)}
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
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
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!movements.length ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No stock movements for the selected period
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Movements ({filteredMovements.length})
              </h3>
            </div>
            {filteredMovements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Date", "Product", "Type", "Quantity", "Warehouse", "Reference", "Notes"].map((h) => (
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
                    {filteredMovements.map((movement) => (
                      <tr key={movement.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 text-gray-600">
                          {new Date(movement.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 font-medium text-gray-900">{movement.product_name}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              movement.movement_type === "in"
                                ? "bg-green-50 text-green-700"
                                : movement.movement_type === "out"
                                  ? "bg-orange-50 text-orange-700"
                                  : "bg-slate-50 text-slate-700"
                            }`}
                          >
                            {movement.movement_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-medium">{movement.quantity}</td>
                        <td className="px-6 py-3 text-gray-600">{movement.warehouse_name}</td>
                        <td className="px-6 py-3 text-blue-600 font-medium">{movement.reference}</td>
                        <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{movement.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">No matching movements</div>
            )}
          </div>
        </>
      )}
    </ReportsPageShell>
  );
}
