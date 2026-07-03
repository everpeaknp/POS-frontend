"use client";

import React from 'react';
import { FormattedDate } from '@/components/shared/FormattedDate';
import { PrintCompanyHeader } from '@/components/print/PrintCompanyHeader';
import type { CompanyPrintInfo } from '@/lib/print/company-info';
import type { PurchaseInvoice, PurchaseOrder, PurchaseOrderLine } from '@/lib/api/purchase';
import { formatCurrency } from '@/lib/utils';

interface PrintablePurchaseInvoiceProps {
  invoice: PurchaseInvoice;
  purchaseOrder?: PurchaseOrder | null;
  companyInfo: CompanyPrintInfo;
}

export const PrintablePurchaseInvoice = React.forwardRef<HTMLDivElement, PrintablePurchaseInvoiceProps>(
  ({ invoice, purchaseOrder, companyInfo }, ref) => {
    const lineItems: PurchaseOrderLine[] = purchaseOrder?.lines || [];

    const subtotal = purchaseOrder ? Number(purchaseOrder.subtotal) : Number(invoice.amount);
    const tax = purchaseOrder ? Number(purchaseOrder.tax) : 0;
    const total = purchaseOrder ? Number(purchaseOrder.total) : Number(invoice.amount);

    return (
      <div ref={ref} className="p-8 bg-white text-gray-900" style={{ width: '210mm', minHeight: '297mm' }}>
        <PrintCompanyHeader
          company={companyInfo}
          documentTitle="PURCHASE INVOICE"
          documentNumber={invoice.invoice_number}
          documentDate={<FormattedDate value={invoice.date} />}
          secondaryDate={
            invoice.due_date
              ? { label: 'Due Date', value: <FormattedDate value={invoice.due_date} /> }
              : undefined
          }
        />

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Supplier:</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p className="font-semibold text-gray-900">{invoice.supplier_name || invoice.supplier}</p>
            {(invoice.purchase_order_number || purchaseOrder?.po_number) && (
              <p className="text-sm text-gray-600 mt-1">
                PO Reference: {invoice.purchase_order_number || purchaseOrder?.po_number}
              </p>
            )}
          </div>
        </div>

        {lineItems.length > 0 ? (
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">#</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Item</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Qty</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Price</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Tax%</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((line, index) => (
                <tr key={line.id || index} className="border-b border-gray-200">
                  <td className="py-3 px-2 text-sm text-gray-600">{index + 1}</td>
                  <td className="py-3 px-2">
                    <p className="text-sm font-medium text-gray-900">{line.product_name || line.product}</p>
                    {line.description && (
                      <p className="text-xs text-gray-500">{line.description}</p>
                    )}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-900 text-right">{Number(line.quantity)}</td>
                  <td className="py-3 px-2 text-sm text-gray-900 text-right">
                    {formatCurrency(line.unit_price)}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-900 text-right">{Number(line.tax_percent)}%</td>
                  <td className="py-3 px-2 text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(line.amount ?? Number(line.quantity) * Number(line.unit_price))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mb-8 bg-gray-50 p-4 rounded text-sm text-gray-600">
            Invoice total: {formatCurrency(invoice.amount)}
          </div>
        )}

        <div className="flex justify-end mb-8">
          <div className="w-64">
            {lineItems.length > 0 && (
              <>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Tax (VAT):</span>
                  <span className="font-medium text-gray-900">{formatCurrency(tax)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between py-3 text-base border-t-2 border-gray-300 mt-2">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="font-bold text-gray-900">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Paid:</span>
              <span className="font-medium text-gray-900">{formatCurrency(invoice.paid_amount)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Balance Due:</span>
              <span className="font-medium text-gray-900">{formatCurrency(invoice.balance)}</span>
            </div>
          </div>
        </div>

        <div className="mb-8 bg-gray-50 p-4 rounded">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <span className="font-medium text-gray-900">{invoice.status}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Notes:</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-gray-300">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              This is a computer-generated document. No signature required.
            </p>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-400 text-center">
          <p>Printed on: {new Date().toLocaleString('en-GB')}</p>
        </div>
      </div>
    );
  }
);

PrintablePurchaseInvoice.displayName = 'PrintablePurchaseInvoice';
