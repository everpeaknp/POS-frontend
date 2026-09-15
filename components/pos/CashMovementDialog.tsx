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
import { useLanguage } from "@/lib/context/LanguageContext";

interface CashMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CashMovementDialog({ open, onOpenChange, onSuccess }: CashMovementDialogProps) {
  const { t } = useLanguage();
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
      toast.success(t(`pos.cash_${movementType}_recorded`));
      
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
          <DialogTitle>{t('pos.cash_movement')}</DialogTitle>
          <DialogDescription>
            {t('pos.record_cash_movement')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>{t('pos.movement_type')} *</Label>
            <Select value={movementType} onValueChange={(v) => setMovementType(v as 'in' | 'out')}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">{t('pos.cash_in')}</SelectItem>
                <SelectItem value="out">{t('pos.cash_out')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('pos.amount')} *</Label>
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
            <Label>{t('pos.reason')} *</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('pos.reason_placeholder')}
              className="mt-1"
              maxLength={255}
            />
          </div>

          <div>
            <Label>{t('pos.notes')} ({t('common.optional')})</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('pos.additional_details')}
              className="mt-1 resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-[#4A5D7A] hover:bg-[#2E3E52]"
          >
            {loading ? t('pos.recording') : t('pos.record_movement')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
