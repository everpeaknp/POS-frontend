"use client";

import React from 'react';
import { FormattedDate } from '@/components/shared/FormattedDate';
import { SalesOrder } from '@/lib/api/sales';
import { formatCurrency } from '@/lib/utils';

interface PrintableInvoiceProps {
  order: SalesOrder;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    pan?: string;
  };
}

export const PrintableInvoice = React.forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ order, companyInfo }, ref) => {
    const defaultCompanyInfo = {
      name: 'Khata Business OS',
      address: 'Kathmandu, Nepal',
      phone: '+977-1-XXXXXXX',
      email: 'info@khata.com',
      pan: 'XXXXXXXXX',
      ...companyInfo,
    };

    const lineItems = order.lines?.map(line => ({
      product: line.product_name || line.product,
      description: line.description || '',
      quantity: Number(line.quantity),
      unitPrice: Number(line.unit_price),
      discount: Number(line.discount_percent),
      tax: Number(line.tax_percent),
      amount: Number(line.amount),
    })) || [];

    return (
      <div ref={ref} className="p-8 bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{defaultCompanyInfo.name}</h1>
            <p className="text-sm text-gray-600 mt-2">{defaultCompanyInfo.address}</p>
            <p className="text-sm text-gray-600">Phone: {defaultCompanyInfo.phone}</p>
            <p className="text-sm text-gray-600">Email: {defaultCompanyInfo.email}</p>
            {defaultCompanyInfo.pan && (
              <p className="text-sm text-gray-600">PAN: {defaultCompanyInfo.pan}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">
              {order.status === 'Delivered' ? 'INVOICE' : 'SALES ORDER'}
            </h2>
            <p className="text-sm text-gray-600 mt-2">#{order.order_number}</p>
            <p className="text-sm text-gray-600">
              Date: <FormattedDate value={order.date} />
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Bill To:</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p className="font-semibold text-gray-900">{order.customer_name || order.customer}</p>
            {order.reference && (
              <p className="text-sm text-gray-600 mt-1">Reference: {order.reference}</p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
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
            {lineItems.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-2 text-sm text-gray-600">{index + 1}</td>
                <td className="py-3 px-2">
                  <p className="text-sm font-medium text-gray-900">{item.product}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500">{item.description}</p>
                  )}
                </td>
                <td className="py-3 px-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                <td className="py-3 px-2 text-sm text-gray-900 text-right">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="py-3 px-2 text-sm text-gray-900 text-right">{item.discount}%</td>
                <td className="py-3 px-2 text-sm text-gray-900 text-right">{item.tax}%</td>
                <td className="py-3 px-2 text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium text-gray-900">-{formatCurrency(order.discount)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Tax (VAT):</span>
              <span className="font-medium text-gray-900">{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between py-3 text-base border-t-2 border-gray-300 mt-2">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mb-8 bg-gray-50 p-4 rounded">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Type:</span>
            <span className="font-medium text-gray-900 capitalize">{order.payment_type}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-600">Status:</span>
            <span className="font-medium text-gray-900">{order.status}</span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Notes:</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-300">
          <div className="text-center">
            <p className="text-sm text-gray-600">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-2">
              This is a computer-generated document. No signature required.
            </p>
          </div>
        </div>

        {/* Print Metadata */}
        <div className="mt-8 text-xs text-gray-400 text-center">
          <p>Printed on: {new Date().toLocaleString('en-GB')}</p>
          <p>Generated by: {order.created_by_name || 'System'}</p>
        </div>
      </div>
    );
  }
);

PrintableInvoice.displayName = 'PrintableInvoice';
