"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  balance: number;
}

export function PaymentModal({ open, onClose, invoiceId, balance }: Props) {
  const [form, setForm] = useState({ date: "2082-01-15", amount: balance, method: "Bank Transfer", reference: "", notes: "" });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Record Payment — {invoiceId}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Payment Date</Label>
              <Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Amount (Rs.)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="h-9" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Payment Method</Label>
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
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
            <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="h-9" placeholder="Txn ID / Cheque No." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-9" placeholder="Optional" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={() => { alert(`Payment of Rs. ${form.amount} recorded for ${invoiceId}`); onClose(); }}
              className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white">Save Payment</Button>
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
