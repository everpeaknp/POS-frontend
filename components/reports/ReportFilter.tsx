"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/shared/DateInput";

const DEFAULT_PERIODS = ["week", "month", "quarter", "year"] as const;

interface ReportFilterProps {
  period: string;
  onPeriodChange: (value: string) => void;
  onGenerate: () => void;
  embedded?: boolean;
  fromDate?: string;
  toDate?: string;
  onFromDateChange?: (value: string) => void;
  onToDateChange?: (value: string) => void;
  periods?: readonly string[];
  showDateInputs?: boolean;
  loading?: boolean;
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
  periods = DEFAULT_PERIODS,
  showDateInputs = true,
  loading = false,
}: ReportFilterProps) {
  const content = (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={period} onValueChange={(v) => onPeriodChange(v ?? "month")}>
        <SelectTrigger className="h-9 w-40 text-sm border-gray-200"><SelectValue /></SelectTrigger>
        <SelectContent>
          {periods.map((p) => (
            <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showDateInputs && onFromDateChange && onToDateChange && (
        <>
          <DateInput
            value={fromDate}
            onChange={(v) => onFromDateChange(v)}
            className="w-40"
          />
          <DateInput
            value={toDate}
            onChange={(v) => onToDateChange(v)}
            className="w-40"
          />
        </>
      )}

      <Button
        onClick={onGenerate}
        disabled={loading}
        className="bg-[#22C55E] hover:bg-[#16A34A] text-white h-9"
      >
        {loading ? "Generating..." : "Generate Report"}
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
