import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/context/LanguageContext";

interface POSQRPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: string;
  paymentNumber: string;
  qrImageUrl: string | null;
  total: number;
}

export function POSQRPaymentDialog({
  open,
  onOpenChange,
  paymentMethod,
  paymentNumber,
  qrImageUrl,
  total,
}: POSQRPaymentDialogProps) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {paymentMethod} {t('pos.payment')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="text-center bg-emerald-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">{t('pos.total_amount')}</p>
            <p className="text-3xl font-bold text-emerald-600">
              Rs. {total.toFixed(2)}
            </p>
          </div>

          {paymentNumber === "Not configured" ? (
            <div className="text-center p-8 bg-amber-50 rounded-lg border-2 border-amber-200">
              <p className="text-amber-800 font-medium mb-2">{t('pos.payment_not_configured')}</p>
              <p className="text-sm text-amber-600">
                {t('pos.configure_payment')} {paymentMethod} {t('pos.in_settings')}
              </p>
            </div>
          ) : (
            <>
              {qrImageUrl ? (
                <div className="flex justify-center bg-white p-6 rounded-lg border-2 border-gray-200">
                  <img 
                    src={qrImageUrl} 
                    alt={`${paymentMethod} QR Code`}
                    className="w-64 h-64 object-contain"
                  />
                </div>
              ) : (
                <div className="flex justify-center bg-white p-6 rounded-lg border-2 border-amber-200">
                  <div className="text-center">
                    <p className="text-amber-700 font-medium mb-2">{t('pos.no_qr')}</p>
                    <p className="text-sm text-amber-600">
                      {t('pos.upload_qr')}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {paymentMethod === "Bank Transfer" ? t('pos.bank_details') : t('pos.merchant_information')}
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  {paymentMethod === "Bank Transfer" ? (
                    <div className="space-y-1 text-sm">
                      {paymentNumber.split('|').map((info, idx) => {
                        const labels = [t('pos.bank_name'), t('pos.account_number'), t('pos.account_name')];
                        return info ? (
                          <p key={idx} className="text-gray-900">
                            <span className="font-semibold">{labels[idx]}:</span> {info}
                          </p>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-lg font-mono text-gray-900">
                      {paymentNumber}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {paymentMethod === "Bank Transfer" 
                    ? t('pos.use_bank_transfer')
                    : qrImageUrl 
                      ? t('pos.scan_qr_code')
                      : t('pos.enter_merchant_id')}
                </p>
              </div>
            </>
          )}

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-[#4A5D7A] hover:bg-[#4A5D7A]/90"
          >
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
