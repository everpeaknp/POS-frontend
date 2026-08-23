"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface SharedTransaction {
  id: number;
  party_name: string;
  direction: "in" | "out";
  direction_display: string;
  amount: string;
  date: string;
  payment_method?: string;
  payment_method_display?: string;
  receipt_url?: string;
  note: string;
}

export default function PublicSharePage() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<SharedTransaction | null>(null);
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
        const response = await fetch(`/api/finance/public-share/${token}/`);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading share...</p>
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

  const isMoneyOut = data.direction === "out";
  const amountLabel = isMoneyOut
    ? `Paid to ${data.party_name}`
    : `Received from ${data.party_name}`;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-lg border border-gray-200 border-b-0 p-6">
          <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
          <p className="text-gray-600 mt-1">Shared read-only view</p>
        </div>

        {/* Transaction Card */}
        <div className="bg-white border border-gray-200 rounded-b-lg p-6 space-y-6">
          {/* Direction Badge */}
          <div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isMoneyOut
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {data.direction_display}
            </span>
          </div>

          {/* Amount */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 mb-2">Amount</p>
            <p className="text-4xl font-bold text-gray-900">
              Rs. {parseFloat(data.amount).toLocaleString("en-NP", {
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-gray-600 mt-2">{amountLabel}</p>
          </div>

          {/* Party Name */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 mb-2">Party</p>
            <p className="text-lg font-semibold text-gray-900">
              {data.party_name}
            </p>
          </div>

          {/* Date */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 mb-2">Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(data.date).toLocaleDateString("en-NP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Payment Method (for Out transactions only) */}
          {isMoneyOut && data.payment_method && (
            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 mb-2">Payment Method</p>
              <p className="text-lg font-semibold text-gray-900">
                {data.payment_method_display}
              </p>
            </div>
          )}

          {/* Receipt (for Out transactions only) */}
          {isMoneyOut && data.receipt_url && (
            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 mb-2">Receipt</p>
              <button
                onClick={() => window.open(data.receipt_url, "_blank")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-white rounded-lg text-sm font-medium transition"
              >
                <Download className="h-4 w-4" />
                View Receipt
              </button>
            </div>
          )}

          {/* Note */}
          {data.note && (
            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 mb-2">Note</p>
              <p className="text-gray-900 whitespace-pre-wrap">{data.note}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-6 text-center text-xs text-gray-500">
            <p>This is a read-only shared view of a transaction.</p>
            <p>No changes can be made to this data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
