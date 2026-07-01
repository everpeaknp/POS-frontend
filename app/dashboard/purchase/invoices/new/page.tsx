"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LineItemsTable } from "@/components/purchase/LineItemsTable";
import { SummaryBox } from "@/components/purchase/SummaryBox";
import toast from "react-hot-toast";
import { purchaseInvoicesAPI, purchaseOrdersAPI, suppliersAPI, type Supplier, type PurchaseOrder } from "@/lib/api/purchase";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function NewPurchaseInvoicePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    invoiceNumber: "",
    supplierInvoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    supplier: "",
    purchaseOrder: "",
    paymentTerms: "Net 30",
    warehouse: "main",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [suppliersData, ordersData] = await Promise.all([
        suppliersAPI.list({ status: "active" }),
        purchaseOrdersAPI.list(),
      ]);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = items.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
  const totalDiscount = items.reduce((s, i) => s + ((i.qty || 0) * (i.unitPrice || 0) * (i.discount || 0)) / 100, 0);
  const totalTax = items.reduce((s, i) => {
    const b = (i.qty || 0) * (i.unitPrice || 0) - ((i.qty || 0) * (i.unitPrice || 0) * (i.discount || 0)) / 100;
    return s + (b * (i.tax || 0)) / 100;
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const handleSubmit = async () => {
    if (!form.supplier) {
      toast.error("Supplier is required");
      return;
    }
    if (items.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    try {
      setSubmitting(true);
      const invoiceData: any = {
        supplier: form.supplier,
        purchase_order: form.purchaseOrder || undefined,
        date: form.date,
        due_date: form.dueDate,
        amount: grandTotal,
        paid_amount: 0,
        status: "Received" as const,
        notes: form.notes,
      };

      await purchaseInvoicesAPI.create(invoiceData);
      toast.success("Invoice created successfully");
      router.push("/dashboard/purchase/invoices");
    } catch (error: any) {
      const errorData = error?.response?.data;
      console.error("Invoice creation error:", errorData || error);
      const errorMsg = errorData?.detail || errorData?.message || (errorData ? JSON.stringify(errorData) : error?.message) || "Failed to create invoice";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Create Purchase Invoice" subtitle="New supplier invoice" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Create Purchase Invoice" subtitle="New supplier invoice" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-8 w-full min-h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Invoice #">
              <Input className="h-9 text-sm bg-gray-50 text-gray-500" value={form.invoiceNumber || "Auto-generated"} readOnly />
            </Field>
            <Field label="Supplier Invoice #">
              <Input className="h-9 text-sm border-gray-200" placeholder="Supplier's own invoice no." value={form.supplierInvoiceNumber} onChange={(e) => setForm({ ...form, supplierInvoiceNumber: e.target.value })} />
            </Field>
            <Field label="Invoice Date" required>
              <DateInput className="h-9 text-sm border-gray-200"  value={form.date} onChange={(date) => setForm({ ...form, date: date})} />
            </Field>
            <Field label="Due Date" required>
              <DateInput className="h-9 text-sm border-gray-200"  value={form.dueDate} onChange={(date) => setForm({ ...form, dueDate: date})} />
            </Field>
            <Field label="Supplier" required>
              <Select value={form.supplier} onValueChange={(v) => setForm({ ...form, supplier: v || "" })}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Link to PO">
              <Select value={form.purchaseOrder} onValueChange={(v) => setForm({ ...form, purchaseOrder: v || "" })}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue placeholder="— None —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {orders.filter((o) => o.status !== "Cancelled").map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.po_number} — {o.supplier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Payment Terms">
              <Select value={form.paymentTerms} onValueChange={(v) => setForm({ ...form, paymentTerms: v || "" })}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Immediate", "Net 15", "Net 30", "Net 60"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Warehouse / Delivery Location">
              <Select value={form.warehouse} onValueChange={(v) => setForm({ ...form, warehouse: v || "" })}>
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Warehouse</SelectItem>
                  <SelectItem value="store">Store Room</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
            <LineItemsTable items={items} onChange={setItems} />
          </div>
          <div className="flex flex-col lg:flex-row gap-6 justify-between">
            <div className="flex-1 min-w-0">
              <Label className="text-sm mb-1.5 block">Notes</Label>
              <textarea className="w-full h-24 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]" placeholder="Additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <SummaryBox subtotal={subtotal} totalDiscount={totalDiscount} totalTax={totalTax} grandTotal={grandTotal} />
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
            <Button variant="outline" className="border-[#22C55E] text-[#22C55E] hover:bg-green-50" onClick={() => handleSubmit()} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Mark as Received
            </Button>
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6" onClick={() => handleSubmit()} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Record Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
