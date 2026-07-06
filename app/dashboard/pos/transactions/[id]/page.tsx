"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  X,
  Loader2,
  Calendar,
  User,
  CreditCard,
  Package,
  Receipt,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { PosPageShell, posCardClass, posTableWrapClass } from "@/components/dashboard/PosPageShell";
import {
  PosPaymentMethodBadge,
  PosTransactionStatusBadge,
} from "@/components/pos/PosTransactionStatusBadge";
import posApi, { type POSTransaction } from "@/lib/api/pos";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

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

    toast(
      (t) => (
        <div className="flex flex-col gap-4 min-w-[320px] p-2">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
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
              Dismiss
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
      ),
      {
        duration: Infinity,
        position: "top-center",
        style: {
          marginTop: "40vh",
          background: "white",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          borderRadius: "12px",
          padding: "16px",
        },
      }
    );
  };

  const performCancel = async () => {
    setCancelling(true);
    try {
      await posApi.cancelTransaction(transactionId);
      toast.success("Transaction cancelled successfully");
      loadTransaction();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      console.error("Error cancelling transaction:", error);
      toast.error(err.response?.data?.error || "Failed to cancel transaction");
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${transaction?.transaction_number || "Receipt"}_${new Date().toISOString().split("T")[0]}`,
  });

  if (loading) {
    return (
      <PosPageShell
        title="Transaction Details"
        subtitle="Loading..."
        variant="fullscreen"
        loading
      />
    );
  }

  if (!transaction) {
    return (
      <PosPageShell
        title="Transaction Not Found"
        subtitle="The transaction could not be found"
        variant="fullscreen"
      >
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-gray-500 dark:text-muted-foreground">
            This transaction does not exist or was removed.
          </p>
          <Link href="/dashboard/pos/transactions">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Transactions
            </Button>
          </Link>
        </div>
      </PosPageShell>
    );
  }

  const customerLabel =
    transaction.customer_display || transaction.customer_name || "Walk-in Customer";

  return (
    <PosPageShell
      title={transaction.transaction_number || "Transaction"}
      subtitle={
        transaction.date
          ? `POS Transaction · ${new Date(transaction.date).toLocaleDateString("en-GB")}`
          : "POS Transaction"
      }
      variant="fullscreen"
    >
      <div className="w-full min-h-full space-y-6">
        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 sticky top-0 z-10 bg-[#F3F4F6] dark:bg-background py-2 -mx-1 px-1">
          <Link href="/dashboard/pos/transactions">
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
          <PosTransactionStatusBadge status={transaction.status} />
          <PosPaymentMethodBadge method={transaction.payment_method} />
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 h-8">
            <Printer className="h-3.5 w-3.5" />
            Print Receipt
          </Button>
          {transaction.status === "completed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={cancelling}
              className="gap-1.5 h-8 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </>
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left — transaction meta */}
          <div className="xl:col-span-4 space-y-4">
            <div className={`${posCardClass} p-5`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
                    Receipt
                  </p>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-foreground mt-1">
                    {transaction.transaction_number}
                  </h2>
                </div>
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-500/10">
                  <Receipt className="h-5 w-5 text-[#22C55E]" />
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                  </span>
                  <span className="font-medium text-gray-900 dark:text-foreground text-right">
                    {transaction.date
                      ? new Date(transaction.date).toLocaleString("en-GB")
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Customer
                  </span>
                  <span className="font-medium text-gray-900 dark:text-foreground text-right">
                    {customerLabel}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Cashier
                  </span>
                  <span className="font-medium text-gray-900 dark:text-foreground text-right">
                    {transaction.cashier_name || "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-gray-500 dark:text-muted-foreground">Status</span>
                  <PosTransactionStatusBadge status={transaction.status} />
                </div>
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-gray-500 dark:text-muted-foreground">Payment</span>
                  <PosPaymentMethodBadge method={transaction.payment_method} />
                </div>
              </div>
            </div>

            <div className={`${posCardClass} p-5 space-y-3`}>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
                Payment Summary
              </h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatNPR(transaction.subtotal)}</span>
              </div>
              {transaction.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-muted-foreground">Discount</span>
                  <span className="font-medium text-green-600">
                    -{formatNPR(transaction.discount_amount)}
                  </span>
                </div>
              )}
              {transaction.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatNPR(transaction.tax_amount)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 dark:border-border pt-3 flex justify-between items-center">
                <span className="font-semibold text-gray-900 dark:text-foreground">Total</span>
                <span className="text-xl font-bold text-[#22C55E]">
                  {formatNPR(transaction.total)}
                </span>
              </div>
              <div className="border-t border-gray-100 dark:border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    Amount Paid
                  </span>
                  <span className="font-medium">{formatNPR(transaction.amount_paid)}</span>
                </div>
                {transaction.change_given != null && transaction.change_given > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-muted-foreground">Change</span>
                    <span className="font-medium text-blue-600">
                      {formatNPR(transaction.change_given)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {transaction.notes && (
              <div className={`${posCardClass} p-5`}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wide mb-2">
                  Notes
                </h3>
                <p className="text-sm text-gray-700 dark:text-foreground whitespace-pre-wrap">
                  {transaction.notes}
                </p>
              </div>
            )}

            <div className="text-xs text-gray-400 dark:text-muted-foreground px-1 space-y-0.5">
              <div>Transaction ID: {transaction.id}</div>
              {transaction.created_at && (
                <div>Created: {new Date(transaction.created_at).toLocaleString("en-GB")}</div>
              )}
            </div>
          </div>

          {/* Right — line items */}
          <div className="xl:col-span-8">
            <div className={posTableWrapClass}>
              <div className="px-5 py-4 border-b border-gray-100 dark:border-border flex items-center gap-2">
                <Package className="h-4 w-4 text-[#22C55E]" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">
                  Items Purchased ({transaction.lines.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-muted border-b border-gray-100 dark:border-border">
                    <tr>
                      {["Product", "SKU", "Qty", "Unit Price", "Discount", "Line Total"].map(
                        (h) => (
                          <th
                            key={h}
                            className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                              h === "Product" || h === "SKU" ? "text-left" : "text-right"
                            }`}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-border">
                    {transaction.lines.map((line, index) => (
                      <tr
                        key={line.id || index}
                        className="hover:bg-gray-50/50 dark:hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                          {line.product_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                          {line.product_sku || "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-foreground">
                          {line.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-foreground">
                          {formatNPR(line.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600">
                          {line.discount_amount > 0
                            ? `-${formatNPR(line.discount_amount)}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground">
                          {formatNPR(line.line_total || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-muted border-t border-gray-100 dark:border-border">
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-muted-foreground"
                      >
                        Grand Total
                      </td>
                      <td className="px-4 py-3 text-right text-base font-bold text-[#22C55E]">
                        {formatNPR(transaction.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden printable receipt */}
      <div className="hidden">
        <div ref={printRef} className="p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">RECEIPT</h1>
            <p className="text-sm text-gray-600">{transaction.transaction_number}</p>
            <p className="text-xs text-gray-500">
              {transaction.date
                ? new Date(transaction.date).toLocaleString("en-GB")
                : ""}
            </p>
          </div>

          <div className="border-t border-b border-gray-300 py-3 mb-4 text-sm">
            <div className="flex justify-between mb-1">
              <span>Customer:</span>
              <span className="font-medium">{customerLabel}</span>
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
              <span>{formatNPR(transaction.subtotal)}</span>
            </div>
            {transaction.discount_amount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{formatNPR(transaction.discount_amount)}</span>
              </div>
            )}
            {transaction.tax_amount > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatNPR(transaction.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
              <span>TOTAL:</span>
              <span>{formatNPR(transaction.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid ({transaction.payment_method.toUpperCase()}):</span>
              <span>{formatNPR(transaction.amount_paid)}</span>
            </div>
            {transaction.change_given != null && transaction.change_given > 0 && (
              <div className="flex justify-between">
                <span>Change:</span>
                <span>{formatNPR(transaction.change_given)}</span>
              </div>
            )}
          </div>

          <div className="text-center mt-6 text-xs text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-2">Status: {transaction.status?.toUpperCase()}</p>
          </div>
        </div>
      </div>
    </PosPageShell>
  );
}
