"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Printer, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { LineItemsTable } from "@/components/purchase/LineItemsTable";
import { SummaryBox } from "@/components/purchase/SummaryBox";
import { PaymentModal } from "@/components/purchase/PaymentModal";
import { AmountInWords } from "@/components/sales/AmountInWords";
import { mockPurchaseInvoices } from "@/lib/mock-data/purchase";

const mockItems = [
  { id: "1", product: "Cotton Fabric (per meter)", description: "White, 60 GSM", qty: 100, unit: "Meter", unitPrice: 450, discount: 5, tax: 13, amount: 48217 },
  { id: "2", product: "Silk Fabric (per meter)", description: "Red", qty: 30, unit: "Meter", unitPrice: 1200, discount: 0, tax: 13, amount: 40680 },
];

export default function PurchaseInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoice = mockPurchaseInvoices.find((i) => i.id === id) ?? mockPurchaseInvoices[0];
  const [printView, setPrintView] = useState(false);
  const [payModal, setPayModal] = useState(false);

  const subtotal = mockItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalDiscount = mockItems.reduce((s, i) => s + (i.qty * i.unitPrice * i.discount) / 100, 0);
  const totalTax = mockItems.reduce((s, i) => { const b = i.qty * i.unitPrice - (i.qty * i.unitPrice * i.discount) / 100; return s + (b * i.tax) / 100; }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  if (printView) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-start justify-center py-8 px-4">
        <div className="bg-white w-full max-w-[794px] p-12 shadow-lg print:shadow-none">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-2xl font-bold text-[#22C55E]">Khata</p>
              <p className="text-sm text-gray-600 mt-1">FashionNep Pvt. Ltd.</p>
              <p className="text-xs text-gray-500">Thamel, Kathmandu, Nepal</p>
              <p className="text-xs text-gray-500">VAT: 123456789</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800 uppercase tracking-wide">Purchase Invoice</p>
              <p className="text-sm text-gray-600 mt-1">Invoice #: {invoice.id}</p>
              <p className="text-xs text-gray-500">Date: {invoice.date}</p>
              <p className="text-xs text-gray-500">Due: {invoice.dueDate}</p>
              <p className="text-xs text-gray-500">PO Ref: {invoice.poRef}</p>
            </div>
          </div>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Bill From</p>
            <p className="font-semibold text-gray-800">{invoice.supplier}</p>
            <p className="text-sm text-gray-600">Kathmandu, Nepal</p>
            <p className="text-sm text-gray-600">PAN: 301234567</p>
          </div>
          <LineItemsTable items={mockItems} onChange={() => {}} readOnly />
          <div className="flex justify-end mt-6">
            <SummaryBox subtotal={subtotal} totalDiscount={totalDiscount} totalTax={totalTax} grandTotal={grandTotal} />
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <AmountInWords amount={grandTotal} />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-8">
            <div className="text-center"><div className="border-t border-gray-300 pt-2 mt-12"><p className="text-xs text-gray-500">Received By</p></div></div>
            <div className="text-center"><div className="border-t border-gray-300 pt-2 mt-12"><p className="text-xs text-gray-500">Authorized By</p></div></div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-8">Thank you for your business!</p>
          <div className="flex gap-2 mt-6 print:hidden">
            <Button variant="outline" onClick={() => setPrintView(false)}>← Normal View</Button>
            <Button onClick={() => window.print()} className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={invoice.id} subtitle={`Purchase Invoice · ${invoice.date}`} />
      <div className="flex-1 p-6 space-y-4 max-w-5xl">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={invoice.status} />
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setPrintView(true)}>
            <Printer className="h-3.5 w-3.5" /> Print View
          </Button>
          <Button size="sm" className="h-8 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => setPayModal(true)}>
            <CreditCard className="h-3.5 w-3.5" /> Record Payment
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice Info</h3>
            {[["Invoice #", invoice.id], ["Date", invoice.date], ["Due Date", invoice.dueDate], ["PO Reference", invoice.poRef], ["Status", invoice.status]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span><span className="font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Summary</h3>
            {[["Total Amount", `Rs. ${invoice.amount.toLocaleString()}`], ["Paid", `Rs. ${invoice.paid.toLocaleString()}`], ["Balance Due", `Rs. ${invoice.balance.toLocaleString()}`]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className={`font-medium ${k === "Balance Due" && invoice.balance > 0 ? "text-red-500" : "text-gray-800"}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <LineItemsTable items={mockItems} onChange={() => {}} readOnly />
          <div className="flex justify-end mt-4">
            <SummaryBox subtotal={subtotal} totalDiscount={totalDiscount} totalTax={totalTax} grandTotal={grandTotal} />
          </div>
          <div className="mt-3"><AmountInWords amount={grandTotal} /></div>
        </div>
      </div>
      <PaymentModal open={payModal} onClose={() => setPayModal(false)} invoiceId={invoice.id} balance={invoice.balance} />
    </div>
  );
}
