"use client";

import { useState, useEffect, useCallback } from "react";
import { ReportsPageShell, reportsCardClass, reportsTableWrapClass } from "@/components/reports/ReportsPageShell";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { formatNPR } from "@/lib/utils";
import { reportsAPI, type SupplierStatementData } from "@/lib/api/reports";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

interface Supplier {
  id: number;
  name: string;
}

interface SuppliersResponse {
  results: Supplier[];
}

export default function SupplierStatementsPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [data, setData] = useState<SupplierStatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Initialize dates to last 90 days
  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, []);

  // Fetch supplier list
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await apiClient.get<SuppliersResponse>("/purchase/suppliers/");
        setSuppliers(response.data.results || []);
        if (response.data.results?.length > 0) {
          setSelectedSupplierId(response.data.results[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch suppliers:", err);
        toast.error("Failed to load suppliers");
      }
    };
    void fetchSuppliers();
  }, []);

  const fetchStatement = useCallback(async (supplierId: number, start?: string, end?: string) => {
    if (!supplierId || !start || !end) return;
    setLoading(true);
    setError(null);
    try {
      const result = await reportsAPI.supplierStatement({
        supplier_id: supplierId,
        start_date: start,
        end_date: end,
      });
      setData(result);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch supplier statement:", err);
      setError(apiErr.response?.data?.detail || "Failed to load statement");
      toast.error("Failed to load statement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSupplierId && startDate && endDate) {
      void fetchStatement(selectedSupplierId, startDate, endDate);
    }
  }, [selectedSupplierId, startDate, endDate, fetchStatement]);

  const stats = data
    ? [
        {
          label: "Total Transactions",
          value: String(data.summary.total_transactions),
        },
        {
          label: "Total Purchases",
          value: formatNPR(data.summary.total_purchases),
        },
        {
          label: "Outstanding",
          value: formatNPR(data.summary.current_balance),
        },
        {
          label: "Avg Invoice",
          value: data.summary.total_transactions > 0
            ? formatNPR(data.summary.total_purchases / data.summary.total_transactions)
            : formatNPR(0),
        },
      ]
    : [
        { label: "Total Transactions", value: "0" },
        { label: "Total Purchases", value: "Rs. 0" },
        { label: "Outstanding", value: "Rs. 0" },
        { label: "Avg Invoice", value: "Rs. 0" },
      ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!data?.transactions.length) return null;
    return {
      filename: `supplier-statement-${data.supplier_name}-${startDate}-to-${endDate}`,
      title: "Supplier Statement",
      subtitle: `${data.supplier_name} | ${startDate} to ${endDate}`,
      headers: ["Date", "Type", "Reference", "Description", "Debit", "Credit", "Balance"],
      rows: data.transactions.map((txn) => [
        txn.date,
        txn.type,
        txn.reference,
        txn.description,
        formatNPR(txn.debit),
        formatNPR(txn.credit),
        formatNPR(txn.balance),
      ]),
    };
  }, [data, startDate, endDate]);

  return (
    <ReportsPageShell
      title="Supplier Statements"
      subtitle="Individual supplier transaction history"
      loading={loading && !data}
      error={error}
      onRetry={() => selectedSupplierId && void fetchStatement(selectedSupplierId, startDate, endDate)}
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedSupplierId || ""}
            onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">Select Supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
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
      {!data ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          {suppliers.length === 0 ? "No suppliers found" : "Select a supplier to view statement"}
        </div>
      ) : data.transactions.length === 0 ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No transactions for this supplier in the selected period
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                {data.supplier_name} - Ledger ({data.transactions.length} transactions)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Date", "Type", "Reference", "Description", "Debit", "Credit", "Balance"].map((h) => (
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
                  {data.transactions.map((txn, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 text-gray-600">
                        {new Date(txn.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            txn.type === "Invoice"
                              ? "bg-slate-50 text-slate-700"
                              : "bg-orange-50 text-orange-700"
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-blue-600">{txn.reference}</td>
                      <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{txn.description}</td>
                      <td className="px-6 py-3 text-green-600">
                        {txn.debit > 0 ? formatNPR(txn.debit) : "-"}
                      </td>
                      <td className="px-6 py-3 text-red-600">
                        {txn.credit > 0 ? formatNPR(txn.credit) : "-"}
                      </td>
                      <td className="px-6 py-3 font-medium">{formatNPR(txn.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </ReportsPageShell>
  );
}
