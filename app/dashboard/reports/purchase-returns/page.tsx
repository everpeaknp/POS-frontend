"use client";

import { useState, useEffect, useCallback } from "react";
import { ReportsPageShell, reportsCardClass, reportsTableWrapClass } from "@/components/reports/ReportsPageShell";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { formatNPR } from "@/lib/utils";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

interface DebitNote {
  id: number;
  debit_note_number: string;
  supplier_name: string;
  date: string;
  amount: number;
  reason: string;
  status: string;
}

interface DebitNotesResponse {
  count: number;
  results: DebitNote[];
}

export default function PurchaseReturnsPage() {
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<DebitNotesResponse>("/api/reports/all-transactions/", {
        params: { type: "debit-note" }
      });
      setDebitNotes(response.data.results || []);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch purchase returns:", err);
      setError("Unable to load purchase returns - feature currently unavailable");
      toast.error("Unable to load purchase returns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredNotes = debitNotes.filter((note) => {
    const matchesSearch = note.debit_note_number.toLowerCase().includes(filters.search.toLowerCase()) ||
      note.supplier_name.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === "all" || note.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      label: "Total Returns",
      value: String(filteredNotes.length),
    },
    {
      label: "Total Amount",
      value: formatNPR(filteredNotes.reduce((sum, note) => sum + note.amount, 0)),
    },
    {
      label: "Avg Return Value",
      value: filteredNotes.length > 0 ? formatNPR(filteredNotes.reduce((sum, note) => sum + note.amount, 0) / filteredNotes.length) : formatNPR(0),
    },
  ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!filteredNotes.length) return null;
    return {
      filename: "purchase-returns",
      title: "Purchase Returns Report",
      headers: ["Return #", "Supplier", "Date", "Amount", "Reason", "Status"],
      rows: filteredNotes.map((note) => [
        note.debit_note_number,
        note.supplier_name,
        new Date(note.date).toLocaleDateString(),
        formatNPR(note.amount),
        note.reason,
        note.status,
      ]),
    };
  }, [filteredNotes]);

  return (
    <ReportsPageShell
      title="Purchase Returns"
      subtitle="Track debit notes and returns"
      loading={loading && !debitNotes.length}
      error={error}
      onRetry={() => void fetchData()}
      toolbar={
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by return # or supplier..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!debitNotes.length ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No purchase returns recorded yet
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Purchase Returns ({filteredNotes.length})
              </h3>
            </div>
            {filteredNotes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Return #", "Supplier", "Date", "Amount", "Reason", "Status"].map((h) => (
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
                    {filteredNotes.map((note) => (
                      <tr key={note.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-blue-600">{note.debit_note_number}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">{note.supplier_name}</td>
                        <td className="px-6 py-3 text-gray-600">
                          {new Date(note.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 font-medium">{formatNPR(note.amount)}</td>
                        <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{note.reason}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              note.status === "active"
                                ? "bg-slate-50 text-slate-700"
                                : note.status === "draft"
                                  ? "bg-yellow-50 text-yellow-700"
                                  : "bg-gray-50 text-gray-700"
                            }`}
                          >
                            {note.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">No purchase returns match your filters</div>
            )}
          </div>
        </>
      )}
    </ReportsPageShell>
  );
}
