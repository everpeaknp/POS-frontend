"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LineItemsTable } from "@/components/purchase/LineItemsTable";
import { SummaryBox } from "@/components/purchase/SummaryBox";
import toast from "react-hot-toast";
import { debitNotesAPI, suppliersAPI, purchaseInvoicesAPI, type Supplier, type PurchaseInvoice } from "@/lib/api/purchase";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function NewDebitNotePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    invoice: "",
    reason: "Return",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [suppliersData, invoicesData] = await Promise.all([
        suppliersAPI.list({ status: "active" }),
        purchaseInvoicesAPI.list(),
      ]);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : (suppliersData as any).results || []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : (invoicesData as any).results || []);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const supplierInvoices = selectedSupplier
    ? invoices.filter((inv) => inv.supplier === selectedSupplier)
    : [];

  const subtotal = items.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
  const totalDiscount = items.reduce((s, i) => s + ((i.qty || 0) * (i.unitPrice || 0) * (i.discount || 0)) / 100, 0);
  const totalTax = items.reduce((s, i) => {
    const b = (i.qty || 0) * (i.unitPrice || 0) - ((i.qty || 0) * (i.unitPrice || 0) * (i.discount || 0)) / 100;
    return s + (b * (i.tax || 0)) / 100;
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      toast.error("Supplier is required");
      return;
    }
    if (!form.invoice) {
      toast.error("Invoice is required");
      return;
    }
    if (items.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    try {
      setSubmitting(true);
      const debitNoteData: any = {
        supplier: selectedSupplier,
        invoice: form.invoice,
        date: form.date,
        amount: grandTotal,
        reason: form.reason,
        description: form.description,
        status: "Issued",
      };

      await debitNotesAPI.create(debitNoteData);
      toast.success("Debit note created successfully");
      router.push("/dashboard/purchase/debit-notes");
    } catch (error: any) {
      console.error("Debit note creation error:", error.response?.data);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || JSON.stringify(error.response?.data) || "Failed to create debit note";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Create Debit Note" subtitle="Issue a new debit note" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Create Debit Note" subtitle="Issue a new debit note" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Debit Note #">
              <Input className="h-9 text-sm bg-gray-50 text-gray-500" value="Auto-generated" readOnly />
            </Field>
            <Field label="Date" required>
              <Input className="h-9 text-sm border-gray-200" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Reason" required>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v || "" })}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Return", "Overcharge", "Damage", "Other"].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Supplier" required>
              <select
                value={selectedSupplier}
                onChange={(e) => {
                  setSelectedSupplier(e.target.value);
                  setForm({ ...form, invoice: "" });
                }}
                className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]"
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Against Invoice" required>
              <select
                value={form.invoice}
                onChange={(e) => setForm({ ...form, invoice: e.target.value })}
                className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]"
                disabled={!selectedSupplier}
              >
                <option value="">— Select invoice —</option>
                {supplierInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} — Rs. {inv.total_amount?.toLocaleString()}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
            <LineItemsTable items={items} onChange={setItems} />
          </div>
          <div className="flex justify-end">
            <SummaryBox subtotal={subtotal} totalDiscount={totalDiscount} totalTax={totalTax} grandTotal={grandTotal} />
          </div>
          <div>
            <Label className="text-sm">Notes</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1.5 w-full h-20 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]"
              placeholder="Reason for debit note, return details..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={() => router.back()} className="gap-1.5 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <div className="flex-1" />
            <Button variant="outline" className="border-gray-200 text-gray-700" onClick={() => handleSubmit()} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Draft
            </Button>
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6" onClick={() => handleSubmit()} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Issue Debit Note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
