"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { taxRulesAPI, vatReturnsAPI } from "@/lib/api/accounting";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;
const TABS = ["Tax Rules", "VAT Returns"];

const VAT_STATUS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  filed: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
};

interface TaxRule {
  id: string;
  name: string;
  type: string;
  rate: number;
  applicable_on: string;
  account: string;
  account_name?: string;
  status: string;
}

interface VATReturn {
  id: string;
  return_number: string;
  period: string;
  from_date: string;
  to_date: string;
  output_tax: number;
  input_tax: number;
  net_payable: number;
  status: string;
  filed_date?: string;
  paid_date?: string;
}

export default function TaxManagementPage() {
  const [tab, setTab] = useState("Tax Rules");
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [vatReturns, setVatReturns] = useState<VATReturn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab === "Tax Rules") {
      fetchTaxRules();
    } else {
      fetchVATReturns();
    }
  }, [tab]);

  const fetchTaxRules = async () => {
    try {
      setLoading(true);
      const data = await taxRulesAPI.list();
      const rulesData = Array.isArray(data) ? data : (data as any).results || [];
      setTaxRules(rulesData);
    } catch (error: any) {
      console.error('Failed to load tax rules:', error);
      toast.error('Failed to load tax rules');
    } finally {
      setLoading(false);
    }
  };

  const fetchVATReturns = async () => {
    try {
      setLoading(true);
      const data = await vatReturnsAPI.list();
      const returnsData = Array.isArray(data) ? data : (data as any).results || [];
      setVatReturns(returnsData);
    } catch (error: any) {
      console.error('Failed to load VAT returns:', error);
      toast.error('Failed to load VAT returns');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateTaxRule = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Deactivate this tax rule?</p>
            <p className="text-sm text-gray-600 mt-1">It will no longer be available for use.</p>
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
                await taxRulesAPI.patch(id, { status: 'inactive' });
                toast.success('Tax rule deactivated successfully');
                fetchTaxRules();
              } catch (error: any) {
                console.error('Failed to deactivate tax rule:', error);
                toast.error('Failed to deactivate tax rule');
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Deactivate
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

  const handleFileVATReturn = async (id: string) => {
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
                fetchVATReturns();
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

  const handleMarkPaid = async (id: string) => {
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
                fetchVATReturns();
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
        <DashHeader title="Tax Management" subtitle="Tax rules and VAT returns" />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Tax Management" subtitle="Tax rules and VAT returns" />
      <div className="flex-1 p-6 space-y-4">

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map((t) => (
            <button 
              key={t} 
              onClick={() => setTab(t)} 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Tax Rules" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Link href="/dashboard/accounting/tax-management/new">
                <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                  <Plus className="h-4 w-4" /> Add Tax Rule
                </Button>
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Tax Name", "Type", "Rate", "Applicable On", "Account", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {taxRules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No tax rules found. Click "Add Tax Rule" to create one.
                      </td>
                    </tr>
                  ) : (
                    taxRules.map((tax) => (
                      <tr key={tax.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-800">{tax.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tax.type === "VAT" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                            {tax.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-800">{tax.rate}%</td>
                        <td className="px-4 py-3 text-gray-600">{tax.applicable_on}</td>
                        <td className="px-4 py-3 text-gray-600">{tax.account_name || tax.account}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tax.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {tax.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-xs">
                            <Link href={`/dashboard/accounting/tax-management/${tax.id}/edit`} className="text-[#22C55E] hover:underline">
                              Edit
                            </Link>
                            {tax.status === "active" && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button 
                                  onClick={() => handleDeactivateTaxRule(tax.id)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  Deactivate
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "VAT Returns" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Link href="/dashboard/accounting/tax-management/returns/new">
                <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                  <Plus className="h-4 w-4" /> File VAT Return
                </Button>
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Period", "From Date", "To Date", "Output Tax", "Input Tax", "Net Payable", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {vatReturns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No VAT returns found. Click "File VAT Return" to create one.
                      </td>
                    </tr>
                  ) : (
                    vatReturns.map((vat) => (
                      <tr key={vat.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-800">{vat.period}</td>
                        <td className="px-4 py-3 text-gray-600">{new Date(vat.from_date).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-gray-600">{new Date(vat.to_date).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-gray-800">{fmt(vat.output_tax)}</td>
                        <td className="px-4 py-3 text-gray-600">{fmt(vat.input_tax)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{fmt(vat.net_payable)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${VAT_STATUS[vat.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {vat.status.charAt(0).toUpperCase() + vat.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-xs">
                            <Link href={`/dashboard/accounting/tax-management/returns/${vat.id}`} className="text-[#22C55E] hover:underline">
                              View
                            </Link>
                            {vat.status === "draft" && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button 
                                  onClick={() => handleFileVATReturn(vat.id)}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  File
                                </button>
                              </>
                            )}
                            {vat.status === "filed" && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button 
                                  onClick={() => handleMarkPaid(vat.id)}
                                  className="text-[#22C55E] hover:text-[#16A34A]"
                                >
                                  Mark Paid
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
