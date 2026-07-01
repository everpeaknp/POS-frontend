"use client";

import React from 'react';
import { FormattedDate } from '@/components/shared/FormattedDate';
import { Quotation } from '@/lib/api/sales';
import { formatCurrency } from '@/lib/utils';

interface PrintableQuotationProps {
  quotation: Quotation;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    pan?: string;
  };
}

export const PrintableQuotation = React.forwardRef<HTMLDivElement, PrintableQuotationProps>(
  ({ quotation, companyInfo }, ref) => {
    const defaultCompanyInfo = {
      name: 'Your Company Name',
      address: 'Company Address, City, Country',
      phone: '+977-1-XXXXXXX',
      email: 'info@company.com',
      pan: 'XXXXXXXXX',
      ...companyInfo,
    };

    return (
      <div ref={ref} className="bg-white p-8 w-[210mm] min-h-[297mm]">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-6 mb-6">
          <div className="flex justify-between items-start">
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
              <h2 className="text-2xl font-bold text-gray-900">QUOTATION</h2>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-semibold">Quote #:</span> {quotation.quotation_number}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Date:</span>{' '}
                <FormattedDate value={quotation.date} />
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Valid Until:</span>{' '}
                <FormattedDate value={quotation.valid_until} />
              </p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To:</h3>
          <p className="text-base font-semibold text-gray-900">{quotation.customer_name || quotation.customer}</p>
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-2 text-sm font-semibold text-gray-700">#</th>
              <th className="text-left py-2 text-sm font-semibold text-gray-700">Item</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-700">Qty</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-700">Price</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-700">Disc%</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-700">Tax%</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quotation.lines?.map((line, index) => (
              <tr key={line.id || index} className="border-b border-gray-200">
                <td className="py-3 text-sm text-gray-600">{index + 1}</td>
                <td className="py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {line.product_name || line.product}
                    {line.product_sku && (
                      <span className="text-xs text-gray-500 ml-2">({line.product_sku})</span>
                    )}
                  </p>
                  {line.description && (
                    <p className="text-xs text-gray-500 mt-1">{line.description}</p>
                  )}
                </td>
                <td className="py-3 text-sm text-gray-600 text-right">{line.quantity}</td>
                <td className="py-3 text-sm text-gray-600 text-right">
                  {formatCurrency(line.unit_price)}
                </td>
                <td className="py-3 text-sm text-gray-600 text-right">{line.discount_percent}%</td>
                <td className="py-3 text-sm text-gray-600 text-right">{line.tax_percent}%</td>
                <td className="py-3 text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(line.amount || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">{formatCurrency(quotation.subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium text-gray-900">-{formatCurrency(quotation.discount)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Tax (VAT):</span>
              <span className="font-medium text-gray-900">{formatCurrency(quotation.tax)}</span>
            </div>
            <div className="flex justify-between py-3 text-base border-t-2 border-gray-800">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="font-bold text-gray-900">{formatCurrency(quotation.total)}</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <span className="font-semibold text-gray-900">{quotation.status}</span>
          </div>
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes:</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-6 mt-8">
          <p className="text-sm text-gray-600 text-center mb-2">
            Thank you for your business!
          </p>
          <p className="text-xs text-gray-500 text-center">
            This is a computer-generated quotation. Please contact us if you have any questions.
          </p>
          <p className="text-xs text-gray-400 text-center mt-2">
            Printed on: {new Date().toLocaleString('en-GB')}
            {quotation.created_by_name && ` | Generated by: ${quotation.created_by_name}`}
          </p>
        </div>
      </div>
    );
  }
);

PrintableQuotation.displayName = 'PrintableQuotation';
