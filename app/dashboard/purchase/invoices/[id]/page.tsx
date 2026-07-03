"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer, CreditCard, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { AmountInWords } from "@/components/sales/AmountInWords";
import { purchaseInvoicesAPI, type PurchaseInvoice } from "@/lib/api/purchase";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function PurchaseInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    method: "Bank Transfer",
    reference: "",
  });

  const fetchInvoice = async () => {
    if (!id) return;
    try {
      const data = await purchaseInvoicesAPI.get(id);
      setInvoice(data);
      setPaymentForm((prev) => ({ ...prev, amount: data.balance }));
    } catch (error: any) {
      console.error("Error fetching invoice:", error);
      toast.error("Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleRecordPayment = async () => {
    if (!invoice) return;
    if (paymentForm.amount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    if (paymentForm.amount > invoice.balance) {
      toast.error("Payment amount cannot exceed balance due");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await purchaseInvoicesAPI.recordPayment(
        invoice.id,
        paymentForm.amount,
        paymentForm.date,
        paymentForm.method,
        paymentForm.reference || undefined,
      );
      setInvoice(updated);
      setPayModal(false);
      toast.success(`Payment of ${formatCurrency(paymentForm.amount)} recorded`);
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast.error(error.response?.data?.detail || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Loading..." subtitle="Purchase Invoice" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Invoice Not Found" subtitle="Purchase Invoice" />
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4">The invoice you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/dashboard/purchase/invoices">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Invoices
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const canRecordPayment = invoice.balance > 0 && invoice.status !== "Paid";

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader
        title={invoice.invoice_number}
        subtitle={`Purchase Invoice · ${invoice.date}`}
      />
      <div className="flex-1 p-6 space-y-4 max-w-5xl">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={invoice.status} />
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          {canRecordPayment && (
            <Button
              size="sm"
              className="h-8 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
              onClick={() => {
                setPaymentForm((prev) => ({ ...prev, amount: invoice.balance }));
                setPayModal(true);
              }}
            >
              <CreditCard className="h-3.5 w-3.5" /> Record Payment
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice Info</h3>
            {[
              ["Invoice #", invoice.invoice_number],
              ["Date", <FormattedDate key="date" value={invoice.date} />],
              ["Due Date", invoice.due_date ? <FormattedDate key="due" value={invoice.due_date} /> : "—"],
              ["PO Reference", invoice.purchase_order_number || invoice.purchase_order || "—"],
              ["Supplier", invoice.supplier_name || invoice.supplier],
              ["Status", <StatusBadge key="status" status={invoice.status} />],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Summary</h3>
            {[
              ["Subtotal", formatCurrency(invoice.subtotal)],
              ["Tax", formatCurrency(invoice.tax_amount)],
              ["Total Amount", formatCurrency(invoice.total_amount)],
              ["Paid", formatCurrency(invoice.paid_amount)],
              ["Balance Due", formatCurrency(invoice.balance)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className={`font-medium ${k === "Balance Due" && invoice.balance > 0 ? "text-red-500" : "text-gray-800"}`}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex justify-end">
            <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3 space-y-1 min-w-[200px]">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-1">
                <span className="text-gray-700 font-semibold">Total</span>
                <span className="font-bold text-[#22C55E]">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>
          <div className="mt-3"><AmountInWords amount={invoice.total_amount} /></div>
        </div>

        {invoice.notes && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        <Link href="/dashboard/purchase/invoices">
          <Button variant="ghost" className="gap-1.5 text-gray-500">
            <ArrowLeft className="h-4 w-4" /> Back to Invoices
          </Button>
        </Link>
      </div>

      <Dialog open={payModal} onOpenChange={setPayModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment — {invoice.invoice_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Payment Date</Label>
                <Input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Amount (Rs.)</Label>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="h-9"
                  max={invoice.balance}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Payment Method</Label>
              <Select
                value={paymentForm.method}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, method: v || "Bank Transfer" })}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Cash", "Bank Transfer", "Cheque", "eSewa", "Khalti"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Reference Number</Label>
              <Input
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                className="h-9"
                placeholder="Txn ID / Cheque No."
              />
            </div>
            <p className="text-xs text-gray-500">Balance due: {formatCurrency(invoice.balance)}</p>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleRecordPayment}
                disabled={submitting}
                className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Payment
              </Button>
              <Button variant="outline" onClick={() => setPayModal(false)} className="flex-1" disabled={submitting}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
