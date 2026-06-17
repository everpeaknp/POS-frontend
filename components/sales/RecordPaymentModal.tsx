"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invoiceAPI } from "@/lib/api/sales";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  balance: number;
  onSuccess?: () => void;
}

export function RecordPaymentModal({ open, onClose, invoiceId, balance, onSuccess }: RecordPaymentModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    amount: balance, 
    method: "cash", 
    reference: "", 
    notes: "" 
  });

  const handleSave = async () => {
    if (!form.amount || form.amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (form.amount > balance) {
      toast.error("Payment amount cannot exceed balance");
      return;
    }

    setSubmitting(true);
    try {
      await invoiceAPI.recordPayment(invoiceId, form.amount);
      toast.success(`Payment of Rs. ${form.amount.toLocaleString()} recorded successfully`);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment — {invoiceId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Payment Date</Label>
              <Input 
                type="date"
                value={form.date} 
                onChange={(e) => setForm({ ...form, date: e.target.value })} 
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
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[
                  { value: "cash", label: "Cash" },
                  { value: "bank", label: "Bank Transfer" },
                  { value: "cheque", label: "Cheque" },
                  { value: "esewa", label: "eSewa" },
                  { value: "khalti", label: "Khalti" },
                  { value: "fonepay", label: "FonePay" },
                  { value: "other", label: "Other" }
                ].map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
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
          <div className="flex gap-2 pt-1">
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Recording...
                </>
              ) : (
                'Save Payment'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
