"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LineItemsTable } from "@/components/sales/LineItemsTable";
import { SalesSummaryBox } from "@/components/sales/SalesSummaryBox";
import { mockInvoices, mockCustomers } from "@/lib/mock-data/sales";
import type { LineItem } from "@/lib/mock-data/sales";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

const seedItems: LineItem[] = [
  { id: "1", product: "Cotton Kurta", description: "Blue, Size M", qty: 2, unit: "Pcs", unitPrice: 1200, discount: 5, tax: 13, amount: 2714 },
  { id: "2", product: "Silk Saree", description: "Red border", qty: 1, unit: "Pcs", unitPrice: 4500, discount: 0, tax: 13, amount: 5085 },
];

export default function EditInvoicePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const invoice = mockInvoices.find((i) => i.id === id) ?? mockInvoices[0];
  const [items, setItems] = useState<LineItem[]>(seedItems);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalDiscount = items.reduce((s, i) => s + (i.qty * i.unitPrice * i.discount) / 100, 0);
  const totalTax = items.reduce((s, i) => {
    const b = i.qty * i.unitPrice - (i.qty * i.unitPrice * i.discount) / 100;
    return s + (b * i.tax) / 100;
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={`Edit ${invoice.id}`} subtitle="Update invoice details" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-8 w-full min-h-full">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Invoice #">
              <Input className="h-9 text-sm bg-gray-50 text-gray-500" value={invoice.id} readOnly />
            </Field>
            <Field label="Invoice Date" required>
              <Input className="h-9 text-sm border-gray-200" defaultValue={invoice.date} />
            </Field>
            <Field label="Due Date" required>
              <Input className="h-9 text-sm border-gray-200" defaultValue={invoice.dueDate} />
            </Field>
            <Field label="Customer" required>
              <select defaultValue={mockCustomers.find((c) => c.name === invoice.customer)?.id ?? ""}
                className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E] w-full">
                {mockCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Payment Terms">
              <Select defaultValue="Net 30">
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Immediate", "Net 15", "Net 30", "Net 60"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select defaultValue={invoice.status}>
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Draft", "Sent", "Partially Paid", "Paid", "Overdue"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Bank Account">
              <Select defaultValue="nepal-bank">
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nepal-bank">Nepal Bank Ltd — A/C 0123456789</SelectItem>
                  <SelectItem value="nabil">Nabil Bank — A/C 9876543210</SelectItem>
                  <SelectItem value="esewa">eSewa Business Account</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reference / PO Number">
              <Input className="h-9 text-sm border-gray-200" placeholder="PO-XXX" />
            </Field>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
            <LineItemsTable items={items} onChange={setItems} />
          </div>

          <div className="flex justify-end">
            <SalesSummaryBox subtotal={subtotal} totalDiscount={totalDiscount} totalTax={totalTax} grandTotal={grandTotal} />
          </div>

          <div>
            <Label className="text-sm">Notes / Terms</Label>
            <textarea className="mt-1.5 w-full h-20 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]"
              placeholder="Payment terms, bank details..." />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={() => router.back()} className="gap-1.5 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <div className="flex-1" />
            <Button variant="outline" className="border-gray-200 text-gray-700">Save as Draft</Button>
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6">Update Invoice</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
