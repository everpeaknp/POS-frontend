"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DashHeader } from "@/components/dashboard/dash-header";
import { vatReturnsAPI } from "@/lib/api/accounting";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

const NEPALI_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

interface VATTransaction {
  invoice: string;
  date: string;
  customer?: string;
  supplier?: string;
  taxable: number;
  vat: number;
}

export default function NewVatReturnPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState("Chaitra");
  const [fromDate, setFromDate] = useState("2081-12-01");
  const [toDate, setToDate] = useState("2081-12-30");
  const [paymentDate, setPaymentDate] = useState("2082-01-25");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [bankReference, setBankReference] = useState("");
  const [notes, setNotes] = useState("");
  
  // Mock data - in production, this would come from API
  const [salesVAT, setSalesVAT] = useState<VATTransaction[]>([
    { invoice: "INV-2024-001", date: "2081-12-05", customer: "ABC Hardware", taxable: 100000, vat: 13000 },
    { invoice: "INV-2024-002", date: "2081-12-12", customer: "XYZ Construction", taxable: 250000, vat: 32500 },
    { invoice: "INV-2024-003", date: "2081-12-20", customer: "PQR Traders", taxable: 75000, vat: 9750 },
  ]);
  
  const [purchaseVAT, setPurchaseVAT] = useState<VATTransaction[]>([
    { invoice: "PINV-2024-001", date: "2081-12-03", supplier: "Supplier A", taxable: 50000, vat: 6500 },
    { invoice: "PINV-2024-002", date: "2081-12-15", supplier: "Supplier B", taxable: 80000, vat: 10400 },
  ]);

  const outputTax = salesVAT.reduce((sum, item) => sum + item.vat, 0);
  const inputTax = purchaseVAT.reduce((sum, item) => sum + item.vat, 0);
  const netPayable = outputTax - inputTax;

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      await vatReturnsAPI.create({
        period: `${month} 2081`,
        from_date: fromDate,
        to_date: toDate,
        output_tax: outputTax,
        input_tax: inputTax,
        status: 'draft',
        notes: notes.trim()
      });
      toast.success('VAT return saved as draft');
      router.push('/dashboard/accounting/tax-management');
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save draft';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!paymentDate) {
      toast.error('Payment date is required');
      return;
    }
    if (!bankReference.trim()) {
      toast.error('Bank reference is required');
      return;
    }

    try {
      setLoading(true);
      const vatReturn = await vatReturnsAPI.create({
        period: `${month} 2081`,
        from_date: fromDate,
        to_date: toDate,
        output_tax: outputTax,
        input_tax: inputTax,
        status: 'filed',
        filed_date: paymentDate,
        notes: `Payment Method: ${paymentMethod}\nBank Reference: ${bankReference}\n${notes.trim()}`
      });
      toast.success('VAT return submitted successfully');
      router.push('/dashboard/accounting/tax-management');
    } catch (error: any) {
      console.error('Failed to submit return:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to submit return';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="File VAT Return" subtitle="Monthly VAT return to IRD" />
      <div className="flex-1 p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-4xl">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Tax Period" required>
              <Select value={month} onValueChange={(v) => setMonth(v || "Chaitra")}>
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NEPALI_MONTHS.map((m) => <SelectItem key={m} value={m}>{m} 2081</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="From Date">
              <Input className="h-9 text-sm border-gray-200 bg-gray-50" value="2081-12-01" readOnly />
            </Field>
            <Field label="To Date">
              <Input className="h-9 text-sm border-gray-200 bg-gray-50" value="2081-12-30" readOnly />
            </Field>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Output Tax (VAT Collected)", value: fmt(outputTax), color: "text-gray-800" },
              { label: "Input Tax (VAT Paid)", value: fmt(inputTax), color: "text-gray-600" },
              { label: "Net VAT Payable", value: fmt(netPayable), color: "text-[#22C55E] font-bold" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Sales VAT breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Sales VAT Breakdown (Output Tax)</h3>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Invoice #", "Date", "Customer", "Taxable Amount", "VAT Amount"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {salesVAT.map((r) => (
                    <tr key={r.invoice} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-mono text-xs text-[#22C55E]">{r.invoice}</td>
                      <td className="px-4 py-2.5 text-gray-600">{r.date}</td>
                      <td className="px-4 py-2.5 text-gray-700">{r.customer}</td>
                      <td className="px-4 py-2.5 text-gray-800">{fmt(r.taxable)}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{fmt(r.vat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Purchase VAT breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Purchase VAT Breakdown (Input Tax)</h3>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Invoice #", "Date", "Supplier", "Taxable Amount", "VAT (Claimable)"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {purchaseVAT.map((r) => (
                    <tr key={r.invoice} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-mono text-xs text-[#22C55E]">{r.invoice}</td>
                      <td className="px-4 py-2.5 text-gray-600">{r.date}</td>
                      <td className="px-4 py-2.5 text-gray-700">{r.supplier}</td>
                      <td className="px-4 py-2.5 text-gray-800">{fmt(r.taxable)}</td>
                      <td className="px-4 py-2.5 font-medium text-[#22C55E]">{fmt(r.vat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
            <Field label="Payment Date">
              <Input 
                className="h-9 text-sm border-gray-200" 
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={loading}
              />
            </Field>
            <Field label="Payment Method">
              <Select 
                value={paymentMethod} 
                onValueChange={(v) => setPaymentMethod(v || "Bank Transfer")}
                disabled={loading}
              >
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Bank Transfer", "eSewa", "Khalti", "Cash"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Bank Reference">
              <Input 
                className="h-9 text-sm border-gray-200" 
                placeholder="Transaction reference"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                disabled={loading}
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea 
              className="text-sm border-gray-200 min-h-[60px]" 
              placeholder="Additional notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </Field>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button 
              variant="ghost" 
              onClick={() => router.back()} 
              className="gap-1.5 text-gray-500"
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <div className="flex-1" />
            <Button 
              variant="outline" 
              className="border-gray-200 text-gray-700"
              onClick={handleSaveDraft}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button 
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Return'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
