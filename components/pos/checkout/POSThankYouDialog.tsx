import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Printer, Eye, FileText } from "lucide-react";

interface Transaction {
  id?: string;
  transaction_number?: string;
  total: number;
  change_given?: number;
}

interface POSThankYouDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onPrintReceipt: () => void;
  onViewTransaction: () => void;
  onViewInvoice: () => void;
  onNewSale: () => void;
}

export function POSThankYouDialog({
  open,
  onOpenChange,
  transaction,
  onPrintReceipt,
  onViewTransaction,
  onViewInvoice,
  onNewSale,
}: POSThankYouDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6 py-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-[var(--color-accent-custom-100,#dcfce7)] rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-[var(--color-accent-custom-600,#16a34a)]" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
            <p className="text-gray-600">Your transaction was completed successfully</p>
            {transaction && (
              <div className="bg-gray-50 rounded-lg p-3 mt-3">
                <p className="text-sm text-gray-600">Receipt Number</p>
                <p className="text-lg font-bold text-gray-900">#{transaction.transaction_number}</p>
                <p className="text-2xl font-bold text-[var(--color-accent-custom-600,#16a34a)] mt-2">
                  Rs. {Number(transaction.total).toFixed(2)}
                </p>
                {transaction.change_given && transaction.change_given > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm text-gray-600">Change Given</p>
                    <p className="text-lg font-bold text-[var(--color-accent-custom-600,#16a34a)]">
                      Rs. {Number(transaction.change_given).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={onPrintReceipt}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print Receipt
            </Button>

            <Button
              onClick={onViewTransaction}
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 hover:border-[var(--color-accent-custom-500,#22c55e)] hover:bg-[var(--color-accent-custom-50,#f0fdf4)] font-semibold"
            >
              <Eye className="h-5 w-5 mr-2" />
              View Transaction
            </Button>

            <Button
              onClick={onViewInvoice}
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 hover:border-[var(--color-accent-custom-500,#22c55e)] hover:bg-[var(--color-accent-custom-50,#f0fdf4)] font-semibold"
            >
              <FileText className="h-5 w-5 mr-2" />
              View Invoice
            </Button>

            <Button
              onClick={onNewSale}
              variant="ghost"
              className="w-full h-12 text-gray-600 hover:text-gray-900 font-semibold"
            >
              New Sale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
