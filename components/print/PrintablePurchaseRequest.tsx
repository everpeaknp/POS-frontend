"use client";

import React from "react";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { PrintCompanyHeader } from "@/components/print/PrintCompanyHeader";
import type { CompanyPrintInfo } from "@/lib/print/company-info";
import type { PurchaseRequest } from "@/lib/api/purchase";
import { formatCurrency } from "@/lib/utils";

interface PrintablePurchaseRequestProps {
  request: PurchaseRequest;
  companyInfo: CompanyPrintInfo;
}

export const PrintablePurchaseRequest = React.forwardRef<HTMLDivElement, PrintablePurchaseRequestProps>(
  ({ request, companyInfo }, ref) => {
    const lines = request.lines || [];

    return (
      <div ref={ref} className="p-8 bg-white text-gray-900" style={{ width: "210mm", minHeight: "297mm" }}>
        <PrintCompanyHeader
          company={companyInfo}
          documentTitle="PURCHASE REQUEST"
          documentNumber={request.request_number}
          documentDate={<FormattedDate value={request.date} />}
          secondaryDate={{ label: "Required By", value: <FormattedDate value={request.required_by} /> }}
        />

        <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="text-gray-500">Department:</span> {request.department}</p>
            <p><span className="text-gray-500">Priority:</span> {request.priority}</p>
            <p><span className="text-gray-500">Status:</span> {request.status}</p>
          </div>
          <div>
            <p><span className="text-gray-500">Requested By:</span> {request.requested_by_name || request.requested_by}</p>
            {request.supplier_name && (
              <p><span className="text-gray-500">Supplier:</span> {request.supplier_name}</p>
            )}
          </div>
        </div>

        {lines.length > 0 && (
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-2 text-sm font-semibold">#</th>
                <th className="text-left py-2 px-2 text-sm font-semibold">Item</th>
                <th className="text-right py-2 px-2 text-sm font-semibold">Qty</th>
                <th className="text-right py-2 px-2 text-sm font-semibold">Est. Price</th>
                <th className="text-right py-2 px-2 text-sm font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id || index} className="border-b border-gray-200">
                  <td className="py-2 px-2 text-sm">{index + 1}</td>
                  <td className="py-2 px-2 text-sm">{line.product_name || line.product}</td>
                  <td className="py-2 px-2 text-sm text-right">{Number(line.quantity)}</td>
                  <td className="py-2 px-2 text-sm text-right">{formatCurrency(line.estimated_unit_price)}</td>
                  <td className="py-2 px-2 text-sm text-right font-medium">
                    {formatCurrency(line.estimated_amount ?? Number(line.quantity) * Number(line.estimated_unit_price))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-3 text-base border-t-2 border-gray-300">
              <span className="font-bold">Estimated Total:</span>
              <span className="font-bold">{formatCurrency(request.estimated_amount)}</span>
            </div>
          </div>
        </div>

        {request.notes && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Notes:</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.notes}</p>
          </div>
        )}

        <div className="mt-8 text-xs text-gray-400 text-center">
          <p>Printed on: {new Date().toLocaleString("en-GB")}</p>
        </div>
      </div>
    );
  },
);

PrintablePurchaseRequest.displayName = "PrintablePurchaseRequest";
