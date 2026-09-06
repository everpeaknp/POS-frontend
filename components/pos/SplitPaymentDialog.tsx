"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POS_PAYMENT_METHODS, getPosPaymentMethodLabel, type PosPaymentMethod } from "@/lib/pos/payment-methods";
import { type POSPaymentEntry } from "@/lib/api/pos";
import { Plus, Trash2, Wallet, CreditCard, Smartphone } from "lucide-react";
import toast from "react-hot-toast";

interface SplitPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onConfirm: (payments: POSPaymentEntry[]) => void;
}

export function SplitPaymentDialog({ open, onOpenChange, totalAmount, onConfirm }: SplitPaymentDialogProps) {
  const [payments, setPayments] = useState<POSPaymentEntry[]>([
    { payment_method: 'cash', amount: 0 }
  ]);

  const addPayment = () => {
    setPayments([...payments, { payment_method: 'cash', amount: 0 }]);
  };

  const removePayment = (index: number) => {
    if (payments.length === 1) {
      toast.error("At least one payment method is required");
      return;
    }
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index: number, field: keyof POSPaymentEntry, value: any) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);
  };

  const paidTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const remaining = totalAmount - paidTotal;

  const handleConfirm = () => {
    // Validate
    if (payments.some(p => !p.amount || p.amount <= 0)) {
      toast.error("All payment amounts must be greater than zero");
      return;
    }
    
    if (paidTotal < totalAmount) {
      toast.error(`Total paid (Rs. ${paidTotal.toFixed(2)}) must equal total (Rs. ${totalAmount.toFixed(2)})`);
      return;
    }

    onConfirm(payments);
    onOpenChange(false);
    
    // Reset
    setPayments([{ payment_method: 'cash', amount: 0 }]);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setPayments([{ payment_method: 'cash', amount: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Split Payment</DialogTitle>
          <DialogDescription>
            Accept multiple payment methods for this transaction
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">Rs. {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Total Paid:</span>
              <span className={`font-semibold ${paidTotal >= totalAmount ? 'text-green-600' : 'text-red-600'}`}>
                Rs. {paidTotal.toFixed(2)}
              </span>
            </div>
            {remaining !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{remaining > 0 ? 'Remaining:' : 'Change:'}</span>
                <span className={`font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Rs. {Math.abs(remaining).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {payments.map((payment, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Payment Method</Label>
                  <Select
                    value={payment.payment_method}
                    onValueChange={(v) => updatePayment(index, 'payment_method', v as PosPaymentMethod)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POS_PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    value={payment.amount || ''}
                    onChange={(e) => updatePayment(index, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="mt-1"
                    min={0}
                    step={0.01}
                  />
                </div>
                {payments.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removePayment(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={addPayment}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Payment Method
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={paidTotal < totalAmount}
            className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[#16A34A]"
          >
            Confirm Split Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
