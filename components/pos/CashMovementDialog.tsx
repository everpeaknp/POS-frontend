"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import posApi from "@/lib/api/pos";
import toast from "react-hot-toast";

interface CashMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CashMovementDialog({ open, onOpenChange, onSuccess }: CashMovementDialogProps) {
  const [movementType, setMovementType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please enter a reason");
      return;
    }

    setLoading(true);
    try {
      await posApi.createCashMovement({
        movement_type: movementType,
        amount: parseFloat(amount),
        reason,
        notes: notes || undefined,
      });
      toast.success(`Cash ${movementType === 'in' ? 'In' : 'Out'} recorded successfully`);
      
      // Reset form
      setAmount('');
      setReason('');
      setNotes('');
      setMovementType('in');
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to record cash movement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cash Movement</DialogTitle>
          <DialogDescription>
            Record cash in or cash out from the register
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>Movement Type *</Label>
            <Select value={movementType} onValueChange={(v) => setMovementType(v as 'in' | 'out')}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Cash In</SelectItem>
                <SelectItem value="out">Cash Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Amount *</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1"
              min={0}
              step={0.01}
            />
          </div>

          <div>
            <Label>Reason *</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Petty cash refill, Expense payment"
              className="mt-1"
              maxLength={255}
            />
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              className="mt-1 resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-600,#16A34A)]"
          >
            {loading ? "Recording..." : "Record Movement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
