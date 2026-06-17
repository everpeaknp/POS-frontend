"use client";

import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { LineItemsTable } from "@/components/purchase/LineItemsTable";
import { SummaryBox } from "@/components/purchase/SummaryBox";
import { AmountInWords } from "@/components/sales/AmountInWords";
import { mockDebitNotes } from "@/lib/mock-data/purchase";

const mockItems = [
  { id: "1", product: "Cotton Fabric (per meter)", description: "Returned — damaged", qty: 10, unit: "Meter", unitPrice: 450, discount: 0, tax: 13, amount: 5085 },
];

export default function DebitNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dn = mockDebitNotes.find((d) => d.id === id) ?? mockDebitNotes[0];

  const subtotal = mockItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalTax = mockItems.reduce((s, i) => s + (i.qty * i.unitPrice * i.tax) / 100, 0);
  const grandTotal = subtotal + totalTax;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={dn.id} subtitle={`Debit Note · ${dn.date}`} />
      <div className="flex-1 p-6 space-y-4 max-w-5xl">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={dn.status} />
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          {dn.status === "Issued" && (
            <Button size="sm" className="h-8 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> Apply to Invoice
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Debit Note Info</h3>
            {[["Debit Note #", dn.id], ["Date", dn.date], ["Against Invoice", dn.invoiceRef], ["Reason", dn.reason], ["Status", dn.status]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className={`font-medium ${k === "Against Invoice" ? "text-blue-600" : "text-gray-800"}`}>{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier</h3>
            <p className="font-semibold text-gray-800">{dn.supplier}</p>
            <p className="text-sm text-gray-500">Kathmandu, Nepal</p>
            <p className="text-sm text-gray-500">PAN: 301234567</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Items</h3>
          <LineItemsTable items={mockItems} onChange={() => {}} readOnly />
          <div className="flex justify-end mt-4">
            <SummaryBox subtotal={subtotal} totalDiscount={0} totalTax={totalTax} grandTotal={grandTotal} />
          </div>
          <div className="mt-3"><AmountInWords amount={grandTotal} /></div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800">Reason: {dn.reason}</p>
          <p className="text-xs text-amber-600 mt-1">This debit note is issued against {dn.invoiceRef} for Rs. {dn.amount.toLocaleString()}</p>
        </div>

        <Button variant="ghost" onClick={() => router.back()} className="gap-1.5 text-gray-500">
          <ArrowLeft className="h-4 w-4" /> Back to Debit Notes
        </Button>
      </div>
    </div>
  );
}
