"use client";

import { forwardRef } from "react";
import { type POSTransaction } from "@/lib/api/pos";
import { formatNPR } from "@/lib/utils";

interface POSProfessionalInvoiceProps {
  transaction: POSTransaction;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessPAN?: string;
  businessWebsite?: string;
}

const POSProfessionalInvoice = forwardRef<HTMLDivElement, POSProfessionalInvoiceProps>(
  (
    {
      transaction,
      businessName = "Your Business Name",
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
      <div ref={ref} className="p-12 max-w-4xl mx-auto bg-white text-gray-900">
        {/* Header with Business Info and Invoice Title */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          {/* Left: Business Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{businessName}</h1>
            {(businessAddress || businessPhone || businessEmail || businessWebsite || businessPAN) && (
              <div className="space-y-1 text-sm text-gray-600">
                {businessAddress && <p>{businessAddress}</p>}
                {businessPhone && <p>Phone: {businessPhone}</p>}
                {businessEmail && <p>Email: {businessEmail}</p>}
                {businessWebsite && <p>Website: {businessWebsite}</p>}
                {businessPAN && <p>PAN No: {businessPAN}</p>}
              </div>
            )}
          </div>

          {/* Right: Invoice Title and Number */}
          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">INVOICE</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Invoice No:</span>
                <p className="text-lg font-medium">{transaction.transaction_number}</p>
              </div>
              <div>
                <span className="font-semibold">Date:</span>
                <p>{invoiceDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
              </div>
              <div>
                <span className="font-semibold">Time:</span>
                <p>{invoiceDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To and Served By */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-gray-200">
          {/* Bill To */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Bill To:</h3>
            <div className="text-sm">
              <p className="font-semibold text-base mb-1">{customerLabel}</p>
              {transaction.customer_phone && <p>Phone: {transaction.customer_phone}</p>}
              {transaction.customer_email && <p>Email: {transaction.customer_email}</p>}
            </div>
          </div>

          {/* Served By */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Served By:</h3>
            <div className="text-sm">
              <p className="font-semibold text-base">{transaction.cashier_name || "Staff"}</p>
              <p className="text-gray-500">Cashier</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-4 px-2 font-bold text-sm text-gray-700 uppercase">#</th>
                <th className="text-left py-4 px-2 font-bold text-sm text-gray-700 uppercase">Description</th>
                <th className="text-right py-4 px-2 font-bold text-sm text-gray-700 uppercase">Qty</th>
                <th className="text-right py-4 px-2 font-bold text-sm text-gray-700 uppercase">Unit Price</th>
                <th className="text-right py-4 px-2 font-bold text-sm text-gray-700 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transaction.lines.map((line, index) => (
                <tr key={line.id || index} className="border-b border-gray-200">
                  <td className="py-4 px-2 text-sm">{index + 1}</td>
                  <td className="py-4 px-2">
                    <div className="font-medium">{line.product_name}</div>
                    {line.product_sku && (
                      <div className="text-xs text-gray-500 mt-1">SKU: {line.product_sku}</div>
                    )}
                  </td>
                  <td className="text-right py-4 px-2">{line.quantity}</td>
                  <td className="text-right py-4 px-2">{formatNPR(line.unit_price)}</td>
                  <td className="text-right py-4 px-2 font-medium">{formatNPR(line.line_total || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary and Totals */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left: Payment Info & Notes */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-bold text-sm text-gray-700 uppercase mb-3">Payment Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium uppercase">{transaction.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium">{formatNPR(transaction.amount_paid)}</span>
                </div>
                {transaction.change_given != null && transaction.change_given > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Change Given:</span>
                    <span className="font-medium">{formatNPR(transaction.change_given)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold uppercase text-green-600">{transaction.status}</span>
                </div>
              </div>
            </div>

            {transaction.notes && (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-bold text-sm text-gray-700 uppercase mb-2">Notes</h3>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{transaction.notes}</p>
              </div>
            )}
          </div>

          {/* Right: Totals */}
          <div>
            <div className="bg-gray-50 p-6 rounded">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatNPR(transaction.subtotal)}</span>
                </div>
                
                {transaction.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-{formatNPR(transaction.discount_amount)}</span>
                  </div>
                )}
                
                {transaction.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (VAT 13%):</span>
                    <span className="font-medium">{formatNPR(transaction.tax_amount)}</span>
                  </div>
                )}
                
                <div className="border-t-2 border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">TOTAL AMOUNT:</span>
                    <span className="text-2xl font-bold text-gray-900">{formatNPR(transaction.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t-2 border-gray-200">
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-gray-900">Thank you for your business!</p>
            <p className="text-sm text-gray-500">
              This is a computer-generated invoice and does not require a signature.
            </p>
            <p className="text-xs text-gray-400">
              Printed on {new Date().toLocaleDateString("en-GB")} at {new Date().toLocaleTimeString("en-GB")}
            </p>
          </div>
        </div>

        {/* Terms and Conditions */}
        {(businessPhone || businessEmail) && (
          <div className="mt-8 text-xs text-gray-500 text-center">
            <p>For any queries regarding this invoice, please contact us at {businessPhone || businessEmail}</p>
          </div>
        )}
      </div>
    );
  }
);

POSProfessionalInvoice.displayName = "POSProfessionalInvoice";

export default POSProfessionalInvoice;
