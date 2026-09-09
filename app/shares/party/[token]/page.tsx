"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, TrendingUp, TrendingDown, Download } from "lucide-react";
import toast from "react-hot-toast";

interface PartyLedgerShare {
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
        console.log(`[Frontend] Fetching /api/finance/public-party-share/${token}/`);
        const response = await fetch(`/api/finance/public-party-share/${token}/`);
        console.log(`[Frontend] Response status: ${response.status}`);

        if (!response.ok) {
          console.log(`[Frontend] Response not OK: ${response.status}`);
          if (response.status === 404) {
            setError("This share link is not found or has expired.");
          } else {
            setError("Failed to load share.");
          }
          setLoading(false);
          return;
        }

        const result = await response.json();
        console.log(`[Frontend] Response data:`, result);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A5D7A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ledger...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full border border-red-200">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Share Error</h1>
          </div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No data found.</p>
        </div>
      </div>
    );
  }

  const party = data.party;
  const transactions = data.transactions || [];
  const outTransactions = transactions.filter(t => t.direction === "out");
  const inTransactions = transactions.filter(t => t.direction === "in");

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-lg border border-gray-200 border-b-0 p-6">
          <h1 className="text-3xl font-bold text-gray-900">{party.name}'s Ledger</h1>
          <p className="text-gray-600 mt-1">Shared read-only view</p>
        </div>

        {/* Summary Cards */}
        <div className="bg-white border-l border-r border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Given */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
                    Total Given
                  </p>
                  <p className="text-2xl font-bold text-emerald-900 mt-2">
                    Rs. {party.total_given.toLocaleString("en-NP", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-600 opacity-20" />
              </div>
            </div>

            {/* Total Received */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Total Received
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    Rs. {party.total_received.toLocaleString("en-NP", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
            </div>

            {/* Net Balance */}
            <div
              className={`rounded-lg p-4 border ${
                party.net_balance >= 0
                  ? "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
                  : "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs font-medium uppercase tracking-wider ${
                      party.net_balance >= 0
                        ? "text-orange-700"
                        : "text-purple-700"
                    }`}
                  >
                    {party.net_balance >= 0 ? "Will Get" : "Owes"}
                  </p>
                  <p
                    className={`text-2xl font-bold mt-2 ${
                      party.net_balance >= 0
                        ? "text-orange-900"
                        : "text-purple-900"
                    }`}
                  >
                    Rs. {Math.abs(party.net_balance).toLocaleString("en-NP", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Party Info */}
        <div className="bg-white border-l border-r border-gray-200 p-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Party Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-medium text-gray-900">{party.name}</p>
            </div>
            {party.mobile && (
              <div>
                <p className="text-gray-600">Mobile</p>
                <p className="font-medium text-gray-900">{party.mobile}</p>
              </div>
            )}
            {party.pan && (
              <div>
                <p className="text-gray-600">PAN</p>
                <p className="font-medium text-gray-900">{party.pan}</p>
              </div>
            )}
            {party.email && (
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{party.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white border-l border-r border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>

          {/* Out Transactions */}
          {outTransactions.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Money Given ({outTransactions.length})
              </h3>
              <div className="space-y-2">
                {outTransactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{txn.date}</p>
                      {txn.payment_method_display && (
                        <p className="text-xs text-gray-600 mt-1">
                          {txn.payment_method_display}
                        </p>
                      )}
                      {txn.note && (
                        <p className="text-sm text-gray-600 mt-1">{txn.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-emerald-900">
                        Rs. {parseFloat(txn.amount).toLocaleString("en-NP", {
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      {txn.receipt_url && (
                        <button
                          onClick={() =>
                            window.open(txn.receipt_url, "_blank")
                          }
                          className="p-2 hover:bg-emerald-100 rounded transition"
                          title="Download receipt"
                        >
                          <Download className="h-4 w-4 text-emerald-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In Transactions */}
          {inTransactions.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-blue-600" />
                Money Received ({inTransactions.length})
              </h3>
              <div className="space-y-2">
                {inTransactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{txn.date}</p>
                      {txn.note && (
                        <p className="text-sm text-gray-600 mt-1">{txn.note}</p>
                      )}
                    </div>
                    <p className="font-semibold text-blue-900">
                      Rs. {parseFloat(txn.amount).toLocaleString("en-NP", {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions to display</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 p-6 text-center text-xs text-gray-500">
          <p>This is a read-only shared view of a party ledger.</p>
          <p>No changes can be made to this data.</p>
        </div>
      </div>
    </div>
  );
}
