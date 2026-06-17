import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ReportFilterProps {
  period: string;
  onPeriodChange: (value: string) => void;
  onGenerate: () => void;
  embedded?: boolean;
}

export function ReportFilter({ period, onPeriodChange, onGenerate, embedded }: ReportFilterProps) {
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

      <Input type="date" placeholder="From Date" className="h-9 w-40 text-sm border-gray-200" />
      <Input type="date" placeholder="To Date" className="h-9 w-40 text-sm border-gray-200" />

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
