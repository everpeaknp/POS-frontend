"use client";

import { forwardRef } from "react";
import { type POSTransaction } from "@/lib/api/pos";
import { formatNPR } from "@/lib/utils";

interface POSInvoiceProps {
  transaction: POSTransaction;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessPAN?: string;
  businessWebsite?: string;
}

const POSInvoice = forwardRef<HTMLDivElement, POSInvoiceProps>(
  (
    {
      transaction,
      businessName = "",
      businessAddress = "",
      businessPhone = "",
      businessEmail = "",
      businessPAN = "",
      businessWebsite = "",
    },
    ref
  ) => {
    const invoiceDate = transaction.date
      ? new Date(transaction.date)
      : new Date();
    
    const customerLabel =
      transaction.customer_display || transaction.customer_name || "Walk-in Customer";

    return (
      <div ref={ref} className="p-8 max-w-md mx-auto bg-white">
        {/* Header - Business Info */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-3">{businessName}</h1>
          <div className="space-y-1 text-xs text-gray-600">
            {businessAddress && <p>{businessAddress}</p>}
            {businessPhone && <p>Phone: {businessPhone}</p>}
            {businessEmail && <p>Email: {businessEmail}</p>}
            {businessWebsite && <p>Website: {businessWebsite}</p>}
            {businessPAN && <p>PAN: {businessPAN}</p>}
          </div>
        </div>

        {/* Receipt Title */}
        <div className="text-center mb-6 border-t border-b border-gray-300 py-3">
          <h2 className="text-xl font-bold mb-1">RECEIPT</h2>
          <p className="text-sm text-gray-600">{transaction.transaction_number}</p>
          <p className="text-xs text-gray-500">
            {invoiceDate.toLocaleDateString("en-GB")} · {invoiceDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Customer & Cashier Info */}
        <div className="border-t border-b border-gray-300 py-3 mb-4 text-sm">
          <div className="flex justify-between mb-1">
            <span>Customer:</span>
            <span className="font-medium">{customerLabel}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span className="font-medium">{transaction.cashier_name || "Staff"}</span>
          </div>
        </div>

        {/* Items Table */}
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
              <tr key={line.id || index} className="border-b border-gray-200">
                <td className="py-2">
                  <div>{line.product_name}</div>
                  {line.product_sku && (
                    <div className="text-xs text-gray-500">SKU: {line.product_sku}</div>
                  )}
                </td>
                <td className="text-right align-top pt-2">{line.quantity}</td>
                <td className="text-right align-top pt-2">{formatNPR(line.unit_price)}</td>
                <td className="text-right align-top pt-2 font-medium">{formatNPR(line.line_total || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-gray-300 pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatNPR(transaction.subtotal)}</span>
          </div>
          {transaction.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-{formatNPR(transaction.discount_amount)}</span>
            </div>
          )}
          {transaction.tax_amount > 0 && (
            <div className="flex justify-between">
              <span>Tax (VAT 13%):</span>
              <span>{formatNPR(transaction.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-2">
            <span>TOTAL:</span>
            <span>{formatNPR(transaction.total)}</span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="border-t border-gray-300 mt-3 pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="font-medium uppercase">{transaction.payment_method}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span>{formatNPR(transaction.amount_paid)}</span>
          </div>
          {transaction.change_given != null && transaction.change_given > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Change Given:</span>
              <span>{formatNPR(transaction.change_given)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {transaction.notes && (
          <div className="border-t border-gray-300 mt-3 pt-3 text-sm">
            <p className="text-gray-600 mb-1">Notes:</p>
            <p className="text-gray-800 whitespace-pre-wrap">{transaction.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-900">Thank you for your business!</p>
          <p>Status: {transaction.status?.toUpperCase()}</p>
          <p className="text-[10px]">
            Printed on {new Date().toLocaleDateString("en-GB")} at {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    );
  }
);

POSInvoice.displayName = "POSInvoice";

export default POSInvoice;
