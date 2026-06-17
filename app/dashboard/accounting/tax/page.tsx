"use client";

import { DashHeader } from "@/components/dashboard/dash-header";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const taxData = [
  { period: "Baisakh 2082", taxableSales: 320000, vatCollected: 41600, taxablePurchases: 280000, vatPaid: 36400, netVat: 5200, status: "Filed" },
  { period: "Jestha 2082", taxableSales: 285000, vatCollected: 37050, taxablePurchases: 245000, vatPaid: 31850, netVat: 5200, status: "Filed" },
  { period: "Ashadh 2082", taxableSales: 410000, vatCollected: 53300, taxablePurchases: 360000, vatPaid: 46800, netVat: 6500, status: "Filed" },
  { period: "Shrawan 2082", taxableSales: 375000, vatCollected: 48750, taxablePurchases: 320000, vatPaid: 41600, netVat: 7150, status: "Pending" },
];

export default function TaxManagementPage() {
  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Tax Management" subtitle="VAT tracking and filing" />
      <div className="flex-1 p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "VAT Collected (YTD)", value: "Rs. 2,47,676", color: "text-green-600" },
            { label: "VAT Paid (YTD)", value: "Rs. 1,98,400", color: "text-blue-600" },
            { label: "Net VAT Payable", value: "Rs. 49,276", color: "text-orange-600" },
            { label: "Pending Returns", value: "1", color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-gray-600 border-gray-200">
            <Download className="h-3.5 w-3.5" /> Export VAT Report
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Period", "Taxable Sales", "VAT Collected", "Taxable Purchases", "VAT Paid", "Net VAT", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {taxData.map((t) => (
                <tr key={t.period} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">{t.period}</td>
                  <td className="px-4 py-3 text-gray-600">Rs. {t.taxableSales.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">Rs. {t.vatCollected.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">Rs. {t.taxablePurchases.toLocaleString()}</td>
                  <td className="px-4 py-3 text-blue-600 font-medium">Rs. {t.vatPaid.toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold text-orange-600">Rs. {t.netVat.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === "Filed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
