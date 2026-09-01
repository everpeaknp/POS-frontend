import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import POSInvoice from "@/components/pos/POSInvoice";
import { RefObject } from "react";
import type { User } from "@/lib/api/auth";
import type { POSTransaction } from "@/lib/api/pos";

interface POSInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: POSTransaction | null;
  user: User | null;
  invoiceRef: RefObject<HTMLDivElement>;
  onPrint: () => void;
  onDownloadPDF: () => void;
  onCloseAndNewSale: () => void;
}

export function POSInvoiceDialog({
  open,
  onOpenChange,
  transaction,
  user,
  invoiceRef,
  onPrint,
  onDownloadPDF,
  onCloseAndNewSale,
}: POSInvoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice: {transaction?.transaction_number}</span>
            <div className="flex gap-2">
              <Button
                onClick={onPrint}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={onDownloadPDF}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {transaction && (
          <div className="mt-4">
            <POSInvoice
              ref={invoiceRef}
              transaction={transaction}
              businessName={user?.tenant?.name || "Your Business"}
              businessAddress={user?.tenant?.address || ""}
              businessPhone={(user?.tenant as any)?.phone || ""}
              businessEmail={user?.tenant?.email || ""}
              businessPAN={(user?.tenant as any)?.pan_vat_number || ""}
            />
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            onClick={onCloseAndNewSale}
            variant="outline"
          >
            Close & New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
