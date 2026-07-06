"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CustomReportRunResult } from "@/lib/api/reports";
import { formatNPR } from "@/lib/utils";

interface CustomReportRunModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: CustomReportRunResult | null;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return formatNPR(value);
  return String(value);
}

function downloadCsv(result: CustomReportRunResult) {
  const { columns, rows } = result.data;
  const escape = (v: unknown) => {
    const s = formatCell(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  const lines = [
    columns.map((c) => `"${c}"`).join(","),
    ...rows.map((row) => columns.map((col) => escape(row[col])).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${result.report_name.replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CustomReportRunModal({
  open,
  onOpenChange,
  result,
}: CustomReportRunModalProps) {
  if (!result) return null;

  const { columns, rows, summary } = result.data;
  const chartData = result.chart_data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-6">
            <div>
              <DialogTitle>{result.report_name}</DialogTitle>
              <p className="text-sm text-muted-foreground capitalize mt-1">
                {result.module} module · {rows.length} rows ·{" "}
                {new Date(result.executed_at).toLocaleString()}
              </p>
              {(result.parameters.from_date || result.parameters.to_date) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Period: {result.parameters.from_date ?? "…"} — {result.parameters.to_date ?? "…"}
                </p>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => downloadCsv(result)}>
              Export CSV
            </Button>
          </div>
        </DialogHeader>

        {Object.keys(summary).length > 0 && (
          <div className="flex flex-wrap gap-3">
            {Object.entries(summary).map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/40 px-3 py-2 text-sm"
              >
                <span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}: </span>
                <span className="font-medium text-gray-900 dark:text-foreground">
                  {typeof value === "number" && key.includes("amount")
                    ? formatNPR(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {chartData.length > 0 && (
          <div className="h-48 w-full border rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatNPR(Number(v ?? 0))} />
                <Bar dataKey="value" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex-1 overflow-auto border rounded-lg min-h-[200px]">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No rows returned for this report and date range.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-muted sticky top-0">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-4 py-2.5 text-gray-700 dark:text-foreground whitespace-nowrap"
                      >
                        {formatCell(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
