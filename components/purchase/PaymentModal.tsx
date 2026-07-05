"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { purchaseInvoicesAPI } from "@/lib/api/purchase";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber?: string;
  balance: number;
  onSuccess?: () => void;
}

export function PaymentModal({
  open,
  onClose,
  invoiceId,
  invoiceNumber,
  balance,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: balance,
    method: "Bank Transfer",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm((prev) => ({ ...prev, amount: balance }));
    }
  }, [open, balance]);

  const handleSave = async () => {
    if (form.amount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    if (form.amount > balance) {
      toast.error("Payment amount cannot exceed balance due");
      return;
    }

    setSubmitting(true);
    try {
      await purchaseInvoicesAPI.recordPayment(
        invoiceId,
        form.amount,
        form.date,
        form.method,
        form.reference || undefined,
      );
      toast.success(`Payment of ${formatCurrency(form.amount)} recorded`);
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment — {invoiceNumber || invoiceId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Payment Date</Label>
              <DateInput
                value={form.date}
                onChange={(date) => setForm({ ...form, date })}
                className="h-9"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Amount (Rs.)</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="h-9"
                max={balance}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Payment Method</Label>
            <Select
              value={form.method}
              onValueChange={(v) => setForm({ ...form, method: v || "Bank Transfer" })}
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
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              className="h-9"
              placeholder="Txn ID / Cheque No."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="h-9"
              placeholder="Optional"
            />
          </div>
          <p className="text-xs text-gray-500">Balance due: {formatCurrency(balance)}</p>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Payment
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
