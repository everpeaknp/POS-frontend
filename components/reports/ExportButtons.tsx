"use client";

import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportTableAsCsv,
  exportTableAsPdf,
  type ExportTableData,
} from "@/lib/utils/export";
import toast from "react-hot-toast";

interface ExportButtonsProps {
  getExportData?: () => ExportTableData | null;
  disabled?: boolean;
}

export function ExportButtons({ getExportData, disabled }: ExportButtonsProps) {
  const runExport = (format: "csv" | "pdf") => {
    if (!getExportData) {
      toast.error("Export is not available on this page");
      return;
    }

    const data = getExportData();
    if (!data || data.rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      if (format === "csv") {
        exportTableAsCsv(data);
        toast.success("CSV exported");
      } else {
        exportTableAsPdf(data);
        toast.success("Print dialog opened — choose Save as PDF as the destination");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export";
      toast.error(message);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={disabled}
        onClick={() => runExport("pdf")}
      >
        <FileText className="h-4 w-4" /> Export PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={disabled}
        onClick={() => runExport("csv")}
      >
        <Download className="h-4 w-4" /> Export CSV
      </Button>
    </div>
  );
}
