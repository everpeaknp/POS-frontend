"use client";

import { useState, useEffect, useCallback } from "react";
import { ReportsPageShell, reportsCardClass, reportsTableWrapClass } from "@/components/reports/ReportsPageShell";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { formatNPR } from "@/lib/utils";
import { reportsAPI, type CustomerStatementData } from "@/lib/api/reports";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

interface Customer {
  id: number;
  name: string;
}

interface CustomersResponse {
  results: Customer[];
}

export default function CustomerStatementsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [data, setData] = useState<CustomerStatementData | null>(null);
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

  // Fetch customer list
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await apiClient.get<CustomersResponse>("/sales/customers/");
        setCustomers(response.data.results || []);
        if (response.data.results?.length > 0) {
          setSelectedCustomerId(response.data.results[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch customers:", err);
        toast.error("Failed to load customers");
      }
    };
    void fetchCustomers();
  }, []);

  const fetchStatement = useCallback(async (customerId: number, start?: string, end?: string) => {
    if (!customerId || !start || !end) return;
    setLoading(true);
    setError(null);
    try {
      const result = await reportsAPI.customerStatement({
        customer_id: customerId,
        start_date: start,
        end_date: end,
      });
      setData(result);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch customer statement:", err);
      setError(apiErr.response?.data?.detail || "Failed to load statement");
      toast.error("Failed to load statement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCustomerId && startDate && endDate) {
      void fetchStatement(selectedCustomerId, startDate, endDate);
    }
  }, [selectedCustomerId, startDate, endDate, fetchStatement]);

  const stats = data
    ? [
        {
          label: "Total Transactions",
          value: String(data.summary.total_transactions),
        },
        {
          label: "Total Sales",
          value: formatNPR(data.summary.total_sales),
        },
        {
          label: "Total Payments",
          value: formatNPR(data.summary.total_payments),
        },
        {
          label: "Outstanding Balance",
          value: formatNPR(data.summary.current_balance),
        },
      ]
    : [
        { label: "Total Transactions", value: "0" },
        { label: "Total Sales", value: "Rs. 0" },
        { label: "Total Payments", value: "Rs. 0" },
        { label: "Outstanding Balance", value: "Rs. 0" },
      ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!data?.transactions.length) return null;
    return {
      filename: `customer-statement-${data.customer_name}-${startDate}-to-${endDate}`,
      title: "Customer Statement",
      subtitle: `${data.customer_name} | ${startDate} to ${endDate}`,
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
      title="Customer Statements"
      subtitle="Individual customer transaction history"
      loading={loading && !data}
      error={error}
      onRetry={() => selectedCustomerId && void fetchStatement(selectedCustomerId, startDate, endDate)}
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCustomerId || ""}
            onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
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
          {customers.length === 0 ? "No customers found" : "Select a customer to view statement"}
        </div>
      ) : data.transactions.length === 0 ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No transactions for this customer in the selected period
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                {data.customer_name} - Ledger ({data.transactions.length} transactions)
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
                              : txn.type === "Payment"
                                ? "bg-green-50 text-green-700"
                                : "bg-orange-50 text-orange-700"
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-blue-600">{txn.reference}</td>
                      <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{txn.description}</td>
                      <td className="px-6 py-3 text-red-600">
                        {txn.debit > 0 ? formatNPR(txn.debit) : "-"}
                      </td>
                      <td className="px-6 py-3 text-green-600">
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
