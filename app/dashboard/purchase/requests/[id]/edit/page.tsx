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
import { mockPurchaseRequests } from "@/lib/mock-data/purchase";
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
  { id: "1", product: "Cotton Fabric (per meter)", description: "For Q2 production", qty: 50, unit: "Meter", unitPrice: 450, discount: 0, tax: 13, amount: 25425 },
];

export default function EditPurchaseRequestPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const req = mockPurchaseRequests.find((r) => r.id === id) ?? mockPurchaseRequests[0];
  const [items, setItems] = useState<LineItem[]>(seedItems);
  const [priority, setPriority] = useState(req.priority);

  const priorityColors: Record<string, string> = {
    Low: "border-gray-300 text-gray-600",
    Medium: "border-yellow-400 text-yellow-700 bg-yellow-50",
    High: "border-red-400 text-red-700 bg-red-50",
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Edit ${req.id}`} subtitle="Update purchase request" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="PR #"><Input className="h-9 text-sm bg-gray-50 text-gray-500" value={req.id} readOnly /></Field>
            <Field label="Request Date" required><Input className="h-9 text-sm border-gray-200" defaultValue={req.date} /></Field>
            <Field label="Required By Date" required><Input className="h-9 text-sm border-gray-200" defaultValue={req.requiredBy} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Requested By" required>
              <select defaultValue={req.requestedBy} className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]">
                <option>Ram Sharma</option><option>Sita Thapa</option><option>Hari KC</option><option>Gita Rai</option>
              </select>
            </Field>
            <Field label="Department" required>
              <Select defaultValue={req.department}>
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>{["Operations", "IT", "Admin", "Finance", "HR", "Sales"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div>
            <Label className="text-sm mb-2 block">Priority</Label>
            <div className="flex gap-2">
              {["Low", "Medium", "High"].map((p) => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${priority === p ? priorityColors[p] : "border-gray-200 text-gray-500"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Line Items</h3>
            <LineItemsTable items={items} onChange={setItems} />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={() => router.back()} className="gap-1.5 text-gray-500"><ArrowLeft className="h-4 w-4" /> Cancel</Button>
            <div className="flex-1" />
            <Button variant="outline" className="border-gray-200 text-gray-700">Save Draft</Button>
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6">Update Request</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
