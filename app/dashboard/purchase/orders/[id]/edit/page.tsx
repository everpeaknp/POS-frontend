"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LineItemsTable } from "@/components/purchase/LineItemsTable";
import { SummaryBox } from "@/components/purchase/SummaryBox";
import { mockPurchaseOrders, mockSuppliers } from "@/lib/mock-data/purchase";
import type { LineItem } from "@/lib/mock-data/purchase";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

const seedItems: LineItem[] = [
  { id: "1", product: "Cotton Fabric (per meter)", description: "White, 60 GSM", qty: 100, unit: "Meter", unitPrice: 450, discount: 5, tax: 13, amount: 48217 },
  { id: "2", product: "Silk Fabric (per meter)", description: "Red", qty: 50, unit: "Meter", unitPrice: 1200, discount: 0, tax: 13, amount: 67800 },
];

export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const order = mockPurchaseOrders.find((o) => o.id === id) ?? mockPurchaseOrders[0];
  const [items, setItems] = useState<LineItem[]>(seedItems);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalDiscount = items.reduce((s, i) => s + (i.qty * i.unitPrice * i.discount) / 100, 0);
  const totalTax = items.reduce((s, i) => { const b = i.qty * i.unitPrice - (i.qty * i.unitPrice * i.discount) / 100; return s + (b * i.tax) / 100; }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Edit ${order.id}`} subtitle="Update purchase order" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="PO #"><Input className="h-9 text-sm bg-gray-50 text-gray-500" value={order.id} readOnly /></Field>
            <Field label="PO Date" required><Input className="h-9 text-sm border-gray-200" defaultValue={order.date} /></Field>
            <Field label="Expected Delivery Date"><Input className="h-9 text-sm border-gray-200" defaultValue={order.expectedDate} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Supplier" required>
              <select defaultValue={order.supplierId} className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]">
                {mockSuppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <Select defaultValue={order.status}>
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>{["Draft", "Sent", "Received", "Partially Received", "Cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Payment Terms">
              <Select defaultValue={order.paymentTerms}>
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>{["Immediate", "Net 15", "Net 30", "Net 60"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
            <LineItemsTable items={items} onChange={setItems} />
          </div>
          <div className="flex justify-end">
            <SummaryBox subtotal={subtotal} totalDiscount={totalDiscount} totalTax={totalTax} grandTotal={grandTotal} />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={() => router.back()} className="gap-1.5 text-gray-500"><ArrowLeft className="h-4 w-4" /> Cancel</Button>
            <div className="flex-1" />
            <Button variant="outline" className="border-gray-200 text-gray-700">Save as Draft</Button>
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6">Update Order</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
