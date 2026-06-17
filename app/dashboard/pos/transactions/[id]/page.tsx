"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Printer, X, Loader2, Calendar, User, CreditCard, Package, Receipt } from "lucide-react";
import { useReactToPrint } from 'react-to-print';
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import posApi, { type POSTransaction } from "@/lib/api/pos";
import toast from "react-hot-toast";

const statusColors = {
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-yellow-100 text-yellow-700"
};

const paymentColors = {
  cash: "bg-blue-100 text-blue-700",
  card: "bg-purple-100 text-purple-700",
  upi: "bg-indigo-100 text-indigo-700",
  credit: "bg-orange-100 text-orange-700"
};

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;
  
  const [transaction, setTransaction] = useState<POSTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      const response = await posApi.getTransaction(transactionId);
      setTransaction(response);
    } catch (error) {
      console.error("Error loading transaction:", error);
      toast.error("Failed to load transaction details");
      router.push("/dashboard/pos/transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!transaction) return;

    // Show custom confirmation toast
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Cancel this transaction?</p>
            <p className="text-sm text-gray-600 mt-1">Stock will be restored to inventory.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              performCancel();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  const performCancel = async () => {
    setCancelling(true);
    try {
      await posApi.cancelTransaction(transactionId);
      toast.success("Transaction cancelled successfully");
      loadTransaction();
    } catch (error: any) {
      console.error("Error cancelling transaction:", error);
      toast.error(error.response?.data?.error || "Failed to cancel transaction");
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${transaction?.transaction_number || 'Receipt'}_${new Date().toISOString().split('T')[0]}`,
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Transaction Details" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Transaction Not Found" subtitle="The transaction could not be found" />
        <div className="flex-1 flex items-center justify-center">
          <Button onClick={() => router.push("/dashboard/pos/transactions")}>
            Back to Transactions
          </Button>
        </div>
      </div>
    );
  }

  const statusColor = statusColors[transaction.status as keyof typeof statusColors] || "bg-gray-100 text-gray-700";
  const paymentColor = paymentColors[transaction.payment_method as keyof typeof paymentColors] || "bg-gray-100 text-gray-700";

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader 
        title={transaction.transaction_number || "Transaction"} 
        subtitle={`POS Transaction · ${new Date(transaction.date!).toLocaleDateString('en-GB')}`}
      />
      
      <div className="flex-1 p-6 space-y-6 max-w-5xl">
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/pos/transactions")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Transactions
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          {transaction.status === "completed" && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelling}
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Cancel Transaction
                </>
              )}
            </Button>
          )}
        </div>

        {/* Transaction Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#22C55E] to-[#16A34A] p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{transaction.transaction_number}</h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                    {transaction.status}
                  </span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${paymentColor}`}>
                    {transaction.payment_method.toUpperCase()}
                  </span>
                </div>
              </div>
              <Receipt className="h-12 w-12 opacity-80" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Transaction Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Date & Time</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {new Date(transaction.date!).toLocaleString('en-GB')}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Customer</div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {transaction.customer_display || transaction.customer_name || "Walk-in Customer"}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Cashier</div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{transaction.cashier_name}</span>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items Purchased
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Product</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">SKU</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Qty</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Unit Price</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Discount</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transaction.lines.map((line, index) => (
                      <tr key={line.id || index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {line.product_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {line.product_sku}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {line.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          Rs. {line.unit_price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          {line.discount_amount > 0 ? `-Rs. ${line.discount_amount.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          Rs. {(line.line_total || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t border-gray-100 pt-6">
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-lg font-medium text-gray-900">
                    Rs. {transaction.subtotal.toLocaleString()}
                  </span>
                </div>
                {transaction.discount_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-lg font-medium text-green-600">
                      -Rs. {transaction.discount_amount.toLocaleString()}
                    </span>
                  </div>
                )}
                {transaction.tax_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-lg font-medium text-gray-900">
                      Rs. {transaction.tax_amount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-gray-900 font-semibold text-lg">Total</span>
                  <span className="text-2xl font-bold text-[#22C55E]">
                    Rs. {transaction.total.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Amount Paid ({transaction.payment_method.toUpperCase()})
                    </span>
                    <span className="text-lg font-medium text-gray-900">
                      Rs. {transaction.amount_paid.toLocaleString()}
                    </span>
                  </div>
                  {transaction.change_given && transaction.change_given > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Change Given</span>
                      <span className="text-lg font-medium text-blue-600">
                        Rs. {transaction.change_given.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {transaction.notes && (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-sm text-gray-500 mb-2">Notes</div>
                <p className="text-gray-700 whitespace-pre-wrap">{transaction.notes}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-100 pt-4 text-xs text-gray-500">
              <div>Transaction ID: {transaction.id}</div>
              {transaction.created_at && (
                <div>Created: {new Date(transaction.created_at).toLocaleString('en-GB')}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Printable Receipt */}
      <div className="hidden">
        <div ref={printRef} className="p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">RECEIPT</h1>
            <p className="text-sm text-gray-600">{transaction.transaction_number}</p>
            <p className="text-xs text-gray-500">{new Date(transaction.date!).toLocaleString('en-GB')}</p>
          </div>
          
          <div className="border-t border-b border-gray-300 py-3 mb-4 text-sm">
            <div className="flex justify-between mb-1">
              <span>Customer:</span>
              <span className="font-medium">{transaction.customer_display || "Walk-in"}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span className="font-medium">{transaction.cashier_name}</span>
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead className="border-b border-gray-300">
              <tr>
                <th className="text-left py-2">Item</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {transaction.lines.map((line, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2">{line.product_name}</td>
                  <td className="text-right">{line.quantity}</td>
                  <td className="text-right">{line.unit_price}</td>
                  <td className="text-right">{line.line_total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-gray-300 pt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs. {transaction.subtotal.toLocaleString()}</span>
            </div>
            {transaction.discount_amount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-Rs. {transaction.discount_amount.toLocaleString()}</span>
              </div>
            )}
            {transaction.tax_amount > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>Rs. {transaction.tax_amount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
              <span>TOTAL:</span>
              <span>Rs. {transaction.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid ({transaction.payment_method.toUpperCase()}):</span>
              <span>Rs. {transaction.amount_paid.toLocaleString()}</span>
            </div>
            {transaction.change_given && transaction.change_given > 0 && (
              <div className="flex justify-between">
                <span>Change:</span>
                <span>Rs. {transaction.change_given.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="text-center mt-6 text-xs text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-2">Status: {transaction.status?.toUpperCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
