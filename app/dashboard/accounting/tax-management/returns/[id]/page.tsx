"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { vatReturnsAPI, type VATReturn } from "@/lib/api/accounting";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;
const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  filed: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
};

interface VATTransaction {
  invoice: string;
  date: string;
  customer?: string;
  supplier?: string;
  taxable: number;
  vat: number;
}

export default function VatReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vatReturn, setVatReturn] = useState<VATReturn | null>(null);
  
  // Mock data for transactions - in production, these would come from API
  const [salesVAT] = useState<VATTransaction[]>([
    { invoice: "INV-0001", date: "2082-01-10", customer: "Ram Sharma", taxable: 21239, vat: 2761 },
    { invoice: "INV-0003", date: "2082-01-08", customer: "Hari KC", taxable: 46018, vat: 5982 },
  ]);
  
  const [purchaseVAT] = useState<VATTransaction[]>([
    { invoice: "PINV-0001", date: "2082-01-09", supplier: "ABC Suppliers", taxable: 75221, vat: 9779 },
  ]);

  useEffect(() => {
    fetchVATReturn();
  }, [id]);

  const fetchVATReturn = async () => {
    try {
      setLoading(true);
      const data = await vatReturnsAPI.get(id);
      setVatReturn(data);
    } catch (error: any) {
      console.error('Failed to load VAT return:', error);
      toast.error('Failed to load VAT return');
    } finally {
      setLoading(false);
    }
  };

  const handleFileReturn = async () => {
    if (!vatReturn) return;

    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">File this VAT return?</p>
            <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await vatReturnsAPI.file(id);
                toast.success('VAT return filed successfully');
                fetchVATReturn();
              } catch (error: any) {
                console.error('Failed to file VAT return:', error);
                toast.error('Failed to file VAT return');
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            File Return
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  const handleMarkPaid = async () => {
    if (!vatReturn) return;

    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Mark this return as paid?</p>
            <p className="text-sm text-gray-600 mt-1">This confirms the payment has been completed.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await vatReturnsAPI.markPaid(id);
                toast.success('VAT return marked as paid successfully');
                fetchVATReturn();
              } catch (error: any) {
                console.error('Failed to mark VAT return as paid:', error);
                toast.error('Failed to mark VAT return as paid');
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[#22C55E] rounded-lg hover:bg-[#16A34A] transition-colors"
          >
            Mark as Paid
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="VAT Return" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!vatReturn) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="VAT Return" subtitle="Not found" />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">VAT return not found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/dashboard/accounting/tax-management')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tax Management
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={vatReturn.return_number} subtitle={`VAT Return · ${vatReturn.period}`} />
      <div className="flex-1 p-6 space-y-4 max-w-4xl">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[vatReturn.status] ?? "bg-gray-100 text-gray-600"}`}>
              {vatReturn.status.charAt(0).toUpperCase() + vatReturn.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/dashboard/accounting/tax-management')}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {vatReturn.status === 'draft' && (
              <Button 
                size="sm"
                onClick={handleFileReturn}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                File Return
              </Button>
            )}
            {vatReturn.status === 'filed' && (
              <Button 
                size="sm"
                onClick={handleMarkPaid}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              >
                Mark as Paid
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Period", value: vatReturn.period },
            { label: "From Date", value: new Date(vatReturn.from_date).toLocaleDateString('en-GB') },
            { label: "To Date", value: new Date(vatReturn.to_date).toLocaleDateString('en-GB') },
            { label: "Net VAT Payable", value: fmt(vatReturn.net_payable) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Output Tax (Collected)", value: fmt(vatReturn.output_tax), color: "text-gray-800" },
            { label: "Input Tax (Paid)", value: fmt(vatReturn.input_tax), color: "text-gray-600" },
            { label: "Net Payable to IRD", value: fmt(vatReturn.net_payable), color: "text-[#22C55E] font-bold" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {vatReturn.notes && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-2">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{vatReturn.notes}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Sales VAT (Output Tax)</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Invoice #", "Date", "Customer", "Taxable Amount", "VAT Amount"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {salesVAT.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No sales transactions for this period
                  </td>
                </tr>
              ) : (
                salesVAT.map((r) => (
                  <tr key={r.invoice} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-mono text-xs text-[#22C55E]">{r.invoice}</td>
                    <td className="px-4 py-2.5 text-gray-600">{r.date}</td>
                    <td className="px-4 py-2.5 text-gray-700">{r.customer}</td>
                    <td className="px-4 py-2.5 text-gray-800">{fmt(r.taxable)}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{fmt(r.vat)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Purchase VAT (Input Tax)</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Invoice #", "Date", "Supplier", "Taxable Amount", "VAT (Claimable)"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {purchaseVAT.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No purchase transactions for this period
                  </td>
                </tr>
              ) : (
                purchaseVAT.map((r) => (
                  <tr key={r.invoice} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-mono text-xs text-[#22C55E]">{r.invoice}</td>
                    <td className="px-4 py-2.5 text-gray-600">{r.date}</td>
                    <td className="px-4 py-2.5 text-gray-700">{r.supplier}</td>
                    <td className="px-4 py-2.5 text-gray-800">{fmt(r.taxable)}</td>
                    <td className="px-4 py-2.5 font-medium text-[#22C55E]">{fmt(r.vat)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
