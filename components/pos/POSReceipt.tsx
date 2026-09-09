"use client";

import { forwardRef } from "react";
import { POSTransaction } from "@/lib/api/pos";
import { Separator } from "@/components/ui/separator";

interface POSReceiptProps {
  transaction: POSTransaction;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
}

export const POSReceipt = forwardRef<HTMLDivElement, POSReceiptProps>(
  ({ transaction, companyName, companyAddress, companyPhone }, ref) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const paymentMethodLabel = {
      cash: "Cash",
      card: "Card",
      esewa: "eSewa",
      khalti: "Khalti",
      fonepay: "Fonepay",
      credit: "Credit/Udhaaro",
    }[transaction.payment_method] || transaction.payment_method;

    return (
      <div ref={ref} className="bg-white p-8 max-w-md mx-auto font-mono text-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {companyName || "Your Business"}
          </h1>
          {companyAddress && (
            <p className="text-xs text-gray-600">{companyAddress}</p>
          )}
          {companyPhone && (
            <p className="text-xs text-gray-600">Tel: {companyPhone}</p>
          )}
        </div>

        <Separator className="my-4" />

        {/* Transaction Info */}
        <div className="mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="font-semibold">Receipt #:</span>
            <span>{transaction.transaction_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Date:</span>
            <span>{formatDate(transaction.date || new Date().toISOString())}</span>
          </div>
          {transaction.cashier_name && (
            <div className="flex justify-between">
              <span className="font-semibold">Cashier:</span>
              <span>{transaction.cashier_name}</span>
            </div>
          )}
          {transaction.customer_name && (
            <div className="flex justify-between">
              <span className="font-semibold">Customer:</span>
              <span>{transaction.customer_name}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Items */}
        <div className="mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2">Item</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {transaction.lines?.map((line, index) => (
                <tr key={index} className="border-b border-dashed border-gray-200">
                  <td className="py-2 text-left">
                    <div className="font-semibold">{line.product_name}</div>
                    {line.product_sku && (
                      <div className="text-gray-500 text-xs">{line.product_sku}</div>
                    )}
                  </td>
                  <td className="py-2 text-center">{line.quantity}</td>
                  <td className="py-2 text-right">
                    {Number(line.unit_price).toFixed(2)}
                  </td>
                  <td className="py-2 text-right font-semibold">
                    {line.line_total
                      ? Number(line.line_total).toFixed(2)
                      : (line.quantity * Number(line.unit_price)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Separator className="my-4" />

        {/* Totals */}
        <div className="space-y-2 text-xs mb-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rs. {Number(transaction.subtotal).toFixed(2)}</span>
          </div>

          {transaction.discount_amount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount:</span>
              <span>- Rs. {Number(transaction.discount_amount).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Tax (13% VAT):</span>
            <span>Rs. {Number(transaction.tax_amount).toFixed(2)}</span>
          </div>

          <Separator className="my-2" />

          <div className="flex justify-between text-lg font-bold">
            <span>TOTAL:</span>
            <span>Rs. {Number(transaction.total).toFixed(2)}</span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Payment Details */}
        <div className="space-y-2 text-xs mb-4">
          <div className="flex justify-between">
            <span className="font-semibold">Payment Method:</span>
            <span>{paymentMethodLabel}</span>
          </div>

          {transaction.payment_method === "cash" && (
            <>
              <div className="flex justify-between">
                <span>Cash Received:</span>
                <span>Rs. {Number(transaction.amount_paid).toFixed(2)}</span>
              </div>
              {transaction.change_given > 0 && (
                <div className="flex justify-between font-bold text-slate-600">
                  <span>Change:</span>
                  <span>Rs. {Number(transaction.change_given).toFixed(2)}</span>
                </div>
              )}
            </>
          )}

          {transaction.payment_method === "credit" && (
            <div className="text-amber-600 text-xs mt-2">
              * This amount has been added to customer's credit balance
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 mt-6">
          <p className="mb-2">Thank you for your business!</p>
          <p className="text-xs">Please keep this receipt for your records</p>
          {transaction.notes && (
            <p className="mt-3 text-xs italic border-t pt-3 border-gray-200">
              Note: {transaction.notes}
            </p>
          )}
        </div>

        {/* Print-only styling */}
        <style jsx>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            div {
              page-break-inside: avoid;
            }
          }
        `}</style>
      </div>
    );
  }
);

POSReceipt.displayName = "POSReceipt";
