"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/shared/DateInput";
import { defaultDateRange } from "@/lib/reports/customReportConfig";

interface CustomReportRunParamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportName?: string;
  onConfirm: (params: { from_date?: string; to_date?: string }) => void;
  loading?: boolean;
}

export function CustomReportRunParamsDialog({
  open,
  onOpenChange,
  reportName,
  onConfirm,
  loading,
}: CustomReportRunParamsDialogProps) {
  const defaults = defaultDateRange();
  const [fromDate, setFromDate] = useState(defaults.from_date);
  const [toDate, setToDate] = useState(defaults.to_date);

  const handleConfirm = () => {
    onConfirm({
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Run Report</DialogTitle>
          {reportName && (
            <p className="text-sm text-muted-foreground">{reportName}</p>
          )}
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div>
            <Label>From date</Label>
            <DateInput value={fromDate} onChange={setFromDate} className="mt-1 h-9" />
          </div>
          <div>
            <Label>To date</Label>
            <DateInput value={toDate} onChange={setToDate} className="mt-1 h-9" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Running..." : "Run Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
