import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButtons() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="gap-2">
        <FileText className="h-4 w-4" /> Export PDF
      </Button>
      <Button variant="outline" size="sm" className="gap-2">
        <Download className="h-4 w-4" /> Export CSV
      </Button>
    </div>
  );
}
