"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/shared/DateInput";

interface ReportFilterProps {
  period: string;
  onPeriodChange: (value: string) => void;
  onGenerate: () => void;
  embedded?: boolean;
  fromDate?: string;
  toDate?: string;
  onFromDateChange?: (value: string) => void;
  onToDateChange?: (value: string) => void;
}

export function ReportFilter({
  period,
  onPeriodChange,
  onGenerate,
  embedded,
  fromDate = "",
  toDate = "",
  onFromDateChange,
  onToDateChange,
}: ReportFilterProps) {
  const content = (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={period} onValueChange={(v) => onPeriodChange(v ?? "month")}>
        <SelectTrigger className="h-9 w-40 text-sm border-gray-200"><SelectValue /></SelectTrigger>
        <SelectContent>
          {["week", "month", "quarter", "year"].map((p) => (
            <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateInput
        value={fromDate}
        onChange={(v) => onFromDateChange?.(v)}
        className="w-40"
      />
      <DateInput
        value={toDate}
        onChange={(v) => onToDateChange?.(v)}
        className="w-40"
      />

      <Button onClick={onGenerate} className="bg-[#22C55E] hover:bg-[#16A34A] text-white h-9">
        Generate Report
      </Button>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-4 space-y-4">
      {content}
    </div>
  );
}
