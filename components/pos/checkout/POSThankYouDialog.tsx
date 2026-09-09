import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Printer, Eye, FileText } from "lucide-react";
import { useLanguage } from "@/lib/context/LanguageContext";

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
  const { t } = useLanguage();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6 py-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-slate-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">{t('pos.thank_you')}</h2>
            <p className="text-gray-600">{t('status.success')}</p>
            {transaction && (
              <div className="bg-gray-50 rounded-lg p-3 mt-3">
                <p className="text-sm text-gray-600">{t('pos.receipt')}</p>
                <p className="text-lg font-bold text-gray-900">#{transaction.transaction_number}</p>
                <p className="text-2xl font-bold text-slate-600 mt-2">
                  Rs. {Number(transaction.total).toFixed(2)}
                </p>
                {transaction.change_given && transaction.change_given > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm text-gray-600">{t('pos.change')}</p>
                    <p className="text-lg font-bold text-slate-600">
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
              {t('pos.print_receipt')}
            </Button>

            <Button
              onClick={onViewTransaction}
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 hover:border-slate-500 hover:bg-slate-50 font-semibold"
            >
              <Eye className="h-5 w-5 mr-2" />
              {t('pos.view_transaction')}
            </Button>

            <Button
              onClick={onViewInvoice}
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 hover:border-slate-500 hover:bg-slate-50 font-semibold"
            >
              <FileText className="h-5 w-5 mr-2" />
              {t('pos.view_invoice')}
            </Button>

            <Button
              onClick={onNewSale}
              variant="ghost"
              className="w-full h-12 text-gray-600 hover:text-gray-900 font-semibold"
            >
              {t('pos.new_sale')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
