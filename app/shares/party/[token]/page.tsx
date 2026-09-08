"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowUpRight, ArrowDownLeft, DollarSign, Download, Shield } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/client";

interface PartyLedgerShare {
  tenant: {
    name: string;
    workspace_name: string;
    logo_url: string | null;
  };
  party: {
    id: number;
    name: string;
    pan?: string;
    mobile?: string;
    email?: string;
    total_given: number;
    total_received: number;
    net_balance: number;
  };
  transactions: Array<{
    id: number;
    direction: "in" | "out";
    direction_display: string;
    amount: string;
    date: string;
    payment_method?: string;
    payment_method_display?: string;
    receipt_url?: string;
    note: string;
  }>;
}

function formatMoney(value: number): string {
  return value.toLocaleString("en-NP", { maximumFractionDigits: 2 });
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function PublicPartyLedgerPage() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<PartyLedgerShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadShare = async () => {
      if (!token) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/finance/public-party-share/${token}/`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("This share link is not found or has expired.");
          } else {
            setError("Failed to load share.");
          }
          setLoading(false);
          return;
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Failed to load share:", err);
        setError("Failed to load share data.");
      } finally {
        setLoading(false);
      }
    };

    loadShare();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-custom,#22C55E)] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ledger...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full border border-red-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Share Error</h1>
          </div>
          <p className="text-gray-600">{error || "No data found."}</p>
        </div>
      </div>
    );
  }

  const { tenant, party } = data;
  const transactions = [...data.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
  const businessName = tenant.workspace_name || tenant.name;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Letterhead */}
        <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {tenant.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logo_url}
                  alt={businessName}
                  className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-[var(--color-accent-custom,#22C55E)]/10 flex items-center justify-center border border-gray-200 shrink-0">
                  <span className="text-lg font-bold text-[var(--color-accent-custom,#22C55E)]">
                    {getInitials(businessName)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">{businessName}</h1>
                <p className="text-xs text-gray-500">Party Ledger Statement</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-500">Generated on</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date().toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Party details */}
        <div className="px-6 sm:px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 shrink-0">
              <span className="text-sm font-bold text-gray-600">{getInitials(party.name)}</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900">{party.name}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
            {party.mobile && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-16 shrink-0">Mobile</span>
                <span className="text-gray-900 font-medium">{party.mobile}</span>
              </div>
            )}
            {party.email && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-16 shrink-0">Email</span>
                <span className="text-gray-900 font-medium">{party.email}</span>
              </div>
            )}
            {party.pan && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-16 shrink-0">PAN</span>
                <span className="text-gray-900 font-medium">{party.pan}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="px-6 sm:px-8 py-6 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Money Given</p>
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">Rs. {formatMoney(party.total_given)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Money Received</p>
              <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">Rs. {formatMoney(party.total_received)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {party.net_balance >= 0 ? "Will Get" : "Owes"}
              </p>
              <DollarSign className={`h-4 w-4 ${party.net_balance >= 0 ? "text-orange-500" : "text-purple-500"}`} />
            </div>
            <p className={`text-xl font-bold ${party.net_balance >= 0 ? "text-orange-600" : "text-purple-600"}`}>
              Rs. {formatMoney(Math.abs(party.net_balance))}
            </p>
          </div>
        </div>

        {/* Transactions */}
        <div className="px-6 sm:px-8 py-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Transaction History <span className="text-gray-400 font-normal">({transactions.length})</span>
          </h2>

          {transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
              No transactions to display
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="text-left font-medium text-gray-500 uppercase text-xs tracking-wide px-6 sm:px-0 py-2">Date</th>
                    <th className="text-left font-medium text-gray-500 uppercase text-xs tracking-wide px-3 py-2">Type</th>
                    <th className="text-right font-medium text-gray-500 uppercase text-xs tracking-wide px-3 py-2">Amount</th>
                    <th className="text-left font-medium text-gray-500 uppercase text-xs tracking-wide px-3 py-2">Method</th>
                    <th className="text-left font-medium text-gray-500 uppercase text-xs tracking-wide px-3 py-2">Note</th>
                    <th className="text-center font-medium text-gray-500 uppercase text-xs tracking-wide px-3 sm:pr-0 py-2">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td className="px-6 sm:px-0 py-3 text-gray-900 whitespace-nowrap">{txn.date}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            txn.direction === "in"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {txn.direction === "in" ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {txn.direction_display || (txn.direction === "in" ? "Money In" : "Money Out")}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold whitespace-nowrap ${
                          txn.direction === "in" ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        Rs. {formatMoney(parseFloat(txn.amount))}
                      </td>
                      <td className="px-3 py-3 text-gray-600">{txn.payment_method_display || "—"}</td>
                      <td className="px-3 py-3 text-gray-600 max-w-[200px] truncate">{txn.note || "—"}</td>
                      <td className="px-3 sm:pr-0 py-3 text-center">
                        {txn.receipt_url ? (
                          <button
                            onClick={() => window.open(txn.receipt_url, "_blank")}
                            className="p-1.5 hover:bg-gray-100 rounded transition inline-flex"
                            title="Download receipt"
                          >
                            <Download className="h-4 w-4 text-gray-500" />
                          </button>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-5 bg-gray-50 border-t border-gray-200 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-1">
            <Shield className="h-3.5 w-3.5" />
            <span>Read-only shared view — no changes can be made to this data.</span>
          </div>
          <p className="text-xs text-gray-400">Generated from {businessName} · Khata Business OS</p>
        </div>
      </div>
    </div>
  );
}
