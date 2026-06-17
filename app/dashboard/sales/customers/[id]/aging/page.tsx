"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { customerAPI, customerCreditAPI } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function CustomerAgingReportPage() {
  const { id } = useParams<{ id: string }>();

  const { data: customerData, loading: customerLoading } = useApi(
    () => customerAPI.get(id),
    { immediate: true, deps: [id] }
  );

  const { data: agingData, loading: agingLoading } = useApi(
    () => customerCreditAPI.getAgingReport(id),
    { immediate: true, deps: [id] }
  );

  const customer = customerData?.data;
  const aging = agingData;

  const handleExport = () => {
    toast.success("Export functionality coming soon");
  };

  if (customerLoading || agingLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Loading..." subtitle="Aging Report" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  if (!customer || !aging) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Not Found" subtitle="Aging Report" />
        <div className="flex-1 p-6">
          <p className="text-gray-500">Customer not found</p>
        </div>
      </div>
    );
  }

  const ageBuckets = [
    { label: "Current (0-30 days)", value: aging.current, color: "bg-green-100 text-green-700" },
    { label: "31-60 days", value: aging.days_30_60, color: "bg-yellow-100 text-yellow-700" },
    { label: "61-90 days", value: aging.days_60_90, color: "bg-orange-100 text-orange-700" },
    { label: "90+ days", value: aging.days_90_plus, color: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Aging Report - ${customer.name}`} subtitle="Outstanding balance breakdown" />
      <div className="flex-1 p-6 space-y-4 max-w-6xl">
        
        <Link href={`/dashboard/sales/customers/${id}`}>
          <Button variant="ghost" size="sm" className="mb-2 gap-1.5 h-8">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Customer
          </Button>
        </Link>

        {/* Credit Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Credit Summary</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              className="gap-1.5 h-8"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(aging.total_outstanding)}</p>
              <p className="text-xs text-gray-500 mt-1">Total Outstanding</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(aging.credit_limit)}</p>
              <p className="text-xs text-gray-500 mt-1">Credit Limit</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(aging.available_credit)}</p>
              <p className="text-xs text-gray-500 mt-1">Available Credit</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">
                {aging.credit_limit > 0 
                  ? `${((aging.total_outstanding / aging.credit_limit) * 100).toFixed(1)}%`
                  : '0%'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">Credit Utilization</p>
            </div>
          </div>

          {aging.is_over_limit && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Credit Limit Exceeded</p>
                <p className="text-xs text-red-700 mt-0.5">
                  This customer has exceeded their credit limit by {formatCurrency(aging.total_outstanding - aging.credit_limit)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Aging Buckets */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aging Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ageBuckets.map((bucket) => (
              <div key={bucket.label} className="border border-gray-100 rounded-lg p-4">
                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mb-2 ${bucket.color}`}>
                  {bucket.label}
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(bucket.value)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {aging.total_outstanding > 0 
                    ? `${((bucket.value / aging.total_outstanding) * 100).toFixed(1)}% of total`
                    : '0% of total'
                  }
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Overdue Invoices</h3>
          </div>

          {aging.overdue_invoices && aging.overdue_invoices.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Invoice #", "Date", "Due Date", "Amount", "Paid", "Balance", "Days Overdue"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {aging.overdue_invoices.map((invoice: any) => (
                  <tr key={invoice.invoice_number} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-[#22C55E] font-medium">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(invoice.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(invoice.due_date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(invoice.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(invoice.paid_amount)}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{formatCurrency(invoice.balance)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        invoice.days_overdue > 90 ? 'bg-red-100 text-red-700' :
                        invoice.days_overdue > 60 ? 'bg-orange-100 text-orange-700' :
                        invoice.days_overdue > 30 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {invoice.days_overdue} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-400">No overdue invoices</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
