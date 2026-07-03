"use client";

import React from 'react';
import { FormattedDate } from '@/components/shared/FormattedDate';
import { PrintCompanyHeader } from '@/components/print/PrintCompanyHeader';
import type { CompanyPrintInfo } from '@/lib/print/company-info';
import type { Invoice, SalesOrder, SalesOrderLine } from '@/lib/api/sales';
import { formatCurrency } from '@/lib/utils';

interface PrintableSalesInvoiceProps {
  invoice: Invoice;
  salesOrder?: SalesOrder | null;
  companyInfo: CompanyPrintInfo;
}

export const PrintableSalesInvoice = React.forwardRef<HTMLDivElement, PrintableSalesInvoiceProps>(
  ({ invoice, salesOrder, companyInfo }, ref) => {
    const lineItems: SalesOrderLine[] = salesOrder?.lines || [];

    const subtotal = salesOrder ? Number(salesOrder.subtotal) : Number(invoice.amount);
    const discount = salesOrder ? Number(salesOrder.discount) : 0;
    const tax = salesOrder ? Number(salesOrder.tax) : 0;
    const total = salesOrder ? Number(salesOrder.total) : Number(invoice.amount);

    return (
      <div ref={ref} className="p-8 bg-white text-gray-900" style={{ width: '210mm', minHeight: '297mm' }}>
        <PrintCompanyHeader
          company={companyInfo}
          documentTitle="TAX INVOICE"
          documentNumber={invoice.invoice_number}
          documentDate={<FormattedDate value={invoice.date} />}
          secondaryDate={{ label: 'Due Date', value: <FormattedDate value={invoice.due_date} /> }}
        />

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Bill To:</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p className="font-semibold text-gray-900">{invoice.customer_name || invoice.customer}</p>
            {salesOrder?.reference && (
              <p className="text-sm text-gray-600 mt-1">Reference: {salesOrder.reference}</p>
            )}
            {salesOrder?.order_number && (
              <p className="text-sm text-gray-600 mt-1">Order: {salesOrder.order_number}</p>
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
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Disc%</th>
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
                  <td className="py-3 px-2 text-sm text-gray-900 text-right">{Number(line.discount_percent)}%</td>
                  <td className="py-3 px-2 text-sm text-gray-900 text-right">{Number(line.tax_percent)}%</td>
                  <td className="py-3 px-2 text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(line.amount)}
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
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-gray-900">-{formatCurrency(discount)}</span>
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
            <span className="text-gray-600">Payment Type:</span>
            <span className="font-medium text-gray-900 capitalize">{invoice.payment_type}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
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
            <p className="text-sm text-gray-600">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-2">
              This is a computer-generated document. No signature required.
            </p>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-400 text-center">
          <p>Printed on: {new Date().toLocaleString('en-GB')}</p>
          {invoice.created_by_name && <p>Generated by: {invoice.created_by_name}</p>}
        </div>
      </div>
    );
  }
);

PrintableSalesInvoice.displayName = 'PrintableSalesInvoice';
