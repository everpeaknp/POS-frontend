"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { LineItemsTable } from "@/components/sales/LineItemsTable";
import { SalesSummaryBox } from "@/components/sales/SalesSummaryBox";
import { mockCustomers, mockSalesOrders } from "@/lib/mock-data/sales";
import type { LineItem } from "@/lib/mock-data/sales";

const defaultItems: LineItem[] = [
  { id: "1", product: "Cotton Kurta", description: "Blue, Size M", qty: 2, unit: "Pcs", unitPrice: 1200, discount: 5, tax: 13, amount: 2714 },
];

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const order = mockSalesOrders.find((o) => o.id === id) ?? mockSalesOrders[0];
  const [items, setItems] = useState<LineItem[]>(defaultItems);
  const [form, setForm] = useState({ customer: order.customer, deliveryDate: "2082-01-20", status: order.status, reference: order.reference, notes: "" });

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalDiscount = items.reduce((s, i) => s + (i.qty * i.unitPrice * i.discount) / 100, 0);
  const totalTax = items.reduce((s, i) => { const b = i.qty * i.unitPrice - (i.qty * i.unitPrice * i.discount) / 100; return s + (b * i.tax) / 100; }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Edit ${order.id}`} subtitle="Sales Order" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Order #</Label>
              <Input value={order.id} readOnly className="h-9 bg-gray-50 text-gray-500 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Order Date</Label>
              <Input defaultValue={order.date} className="h-9 text-sm border-gray-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Customer</Label>
              <Select value={form.customer || ""} onValueChange={(v) => setForm({ ...form, customer: v as string })}>
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>{mockCustomers.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Delivery Date</Label>
              <Input value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} className="h-9 text-sm border-gray-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Status</Label>
              <Select value={form.status || ""} onValueChange={(v) => setForm({ ...form, status: v as string })}>
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Draft", "Confirmed", "Delivered", "Cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Reference</Label>
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="h-9 text-sm border-gray-200" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
            <LineItemsTable items={items} onChange={setItems} />
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-between">
            <div className="flex-1">
              <Label className="text-sm mb-1.5 block">Notes</Label>
              <textarea rows={3} className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:border-[#22C55E]" />
            </div>
            <SalesSummaryBox subtotal={subtotal} totalDiscount={totalDiscount} totalTax={totalTax} grandTotal={grandTotal} />
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={() => router.back()} className="gap-1.5 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
