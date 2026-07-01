"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/shared/DateInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DashHeader } from "@/components/dashboard/dash-header";
import { vatReturnsAPI } from "@/lib/api/accounting";

const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const NEPALI_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function NewVatReturnPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState("Chaitra");
  const [fiscalYear, setFiscalYear] = useState(String(currentYear));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [outputTax, setOutputTax] = useState("");
  const [inputTax, setInputTax] = useState("");
  const [notes, setNotes] = useState("");

  const output = parseFloat(outputTax) || 0;
  const input = parseFloat(inputTax) || 0;
  const netPayable = output - input;

  const buildPayload = () => {
    if (!fromDate || !toDate) {
      toast.error("From date and to date are required");
      return null;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      toast.error("From date must be before to date");
      return null;
    }
    return {
      period: `${month} ${fiscalYear}`,
      from_date: fromDate,
      to_date: toDate,
      output_tax: output,
      input_tax: input,
      status: "draft" as const,
      notes: notes.trim() || undefined,
    };
  };

  const showApiErrors = (error: unknown) => {
    const err = error as { response?: { data?: Record<string, unknown> } };
    const data = err.response?.data;
    if (!data) {
      toast.error("Request failed");
      return;
    }
    if (typeof data.detail === "string") {
      toast.error(data.detail);
      return;
    }
    Object.entries(data).forEach(([field, value]) => {
      const msg = Array.isArray(value) ? String(value[0]) : String(value);
      toast.error(`${field}: ${msg}`);
    });
  };

  const handleSaveDraft = async () => {
    const payload = buildPayload();
    if (!payload) return;

    try {
      setLoading(true);
      await vatReturnsAPI.create(payload);
      toast.success("VAT return saved as draft");
      router.push("/dashboard/accounting/tax-management?tab=vat-returns");
    } catch (error: unknown) {
      console.error("Failed to save draft:", error);
      showApiErrors(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) return;

    try {
      setLoading(true);
      const created = await vatReturnsAPI.create(payload);
      await vatReturnsAPI.file(String(created.id));
      toast.success("VAT return filed successfully");
      router.push(`/dashboard/accounting/tax-management/returns/${created.id}`);
    } catch (error: unknown) {
      console.error("Failed to file return:", error);
      showApiErrors(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="New VAT Return" subtitle="Create a monthly VAT return for IRD filing" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Return Period</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Tax Period (Month)" required>
                <Select value={month} onValueChange={(v) => setMonth(v || "Chaitra")} disabled={loading}>
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEPALI_MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Fiscal Year" required>
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  placeholder="e.g. 2081"
                  disabled={loading}
                />
              </Field>
              <Field label="From Date" required>
                <DateInput value={fromDate} onChange={setFromDate} disabled={loading} required />
              </Field>
              <Field label="To Date" required>
                <DateInput value={toDate} onChange={setToDate} disabled={loading} required />
              </Field>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Tax Amounts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Output Tax (VAT Collected)">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-9 text-sm border-gray-200"
                  placeholder="0.00"
                  value={outputTax}
                  onChange={(e) => setOutputTax(e.target.value)}
                  disabled={loading}
                />
              </Field>
              <Field label="Input Tax (VAT Paid / Claimable)">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-9 text-sm border-gray-200"
                  placeholder="0.00"
                  value={inputTax}
                  onChange={(e) => setInputTax(e.target.value)}
                  disabled={loading}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {[
                { label: "Output Tax", value: fmt(output), color: "text-gray-800" },
                { label: "Input Tax", value: fmt(input), color: "text-gray-600" },
                {
                  label: "Net VAT Payable",
                  value: fmt(netPayable),
                  color: netPayable >= 0 ? "text-[#22C55E] font-bold" : "text-red-600 font-bold",
                },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`text-xl mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            Enter totals from your sales and purchase records for this period. Line-item breakdown from invoices will be
            available when sales and purchase modules are linked to accounting.
          </p>

          <Field label="Notes">
            <Textarea
              className="text-sm border-gray-200 min-h-[80px]"
              placeholder="Additional notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </Field>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button variant="outline" className="border-gray-200 text-gray-700" onClick={handleSaveDraft} disabled={loading}>
              {loading ? "Saving..." : "Save Draft"}
            </Button>
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6" onClick={handleSubmit} disabled={loading}>
              {loading ? "Filing..." : "File Return"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
