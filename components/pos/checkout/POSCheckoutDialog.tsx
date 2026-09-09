import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Wallet, CreditCard, Smartphone, Eye, Plus, Receipt } from "lucide-react";
import type { PaymentMethod } from "@/hooks/usePOSCheckout";
import { useLanguage } from "@/lib/context/LanguageContext";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  type?: string;
}

interface PaymentSettings {
  esewa_enabled: boolean;
  esewa_qr?: string;
  khalti_enabled: boolean;
  khalti_qr?: string;
  fonepay_enabled: boolean;
  fonepay_qr?: string;
  bank_transfer_enabled: boolean;
}

interface AppliedCoupon {
  name: string;
  code: string;
}

interface POSCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  discountValue: number;
  appliedCoupon: AppliedCoupon | null;
  taxRate: number;
  taxAmount: number;
  total: number;
  customers: Customer[];
  selectedCustomer: string;
  onCustomerChange: (value: string) => void;
  onAddCustomerClick: () => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  paymentSettings: PaymentSettings;
  onShowQRCode: (method: string) => void;
  cashAmount: string;
  onCashAmountChange: (value: string) => void;
  cashGiven: number;
  changeAmount: number;
  processing: boolean;
  openSession: any;
  onConfirmSale: () => void;
}

export function POSCheckoutDialog({
  open,
  onOpenChange,
  subtotal,
  discountValue,
  appliedCoupon,
  taxRate,
  taxAmount,
  total,
  customers,
  selectedCustomer,
  onCustomerChange,
  onAddCustomerClick,
  paymentMethod,
  onPaymentMethodChange,
  paymentSettings,
  onShowQRCode,
  cashAmount,
  onCashAmountChange,
  cashGiven,
  changeAmount,
  processing,
  openSession,
  onConfirmSale,
}: POSCheckoutDialogProps) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('pos.complete_sale')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Order Summary */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 rounded-lg p-5 space-y-2.5 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">{t('pos.subtotal')}</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Rs. {subtotal.toFixed(2)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {t('pos.discount')} {appliedCoupon && `(${appliedCoupon.code})`}
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">- Rs. {Number(discountValue).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">{t('pos.tax')} ({(taxRate * 100).toFixed(1)}%)</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Rs. {taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2.5 border-t-2 border-slate-300 dark:border-slate-700">
              <span className="text-gray-900 dark:text-gray-100">{t('pos.total')}</span>
              <span className="text-slate-600 dark:text-slate-400">Rs. {total.toFixed(0)}</span>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('pos.customer')} 
              {paymentMethod === "credit" ? (
                <span className="text-red-500 dark:text-red-400 ml-1">*</span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">({t('common.optional')})</span>
              )}
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Combobox
                  options={customers.map((customer) => ({
                    value: customer.id,
                    label: customer.name,
                    subtitle: [
                      customer.phone,
                      customer.email,
                      customer.type
                    ].filter(Boolean).join(' • ')
                  }))}
                  value={selectedCustomer}
                  onValueChange={onCustomerChange}
                  placeholder={t('pos.search_customers')}
                  searchPlaceholder={t('pos.search_customers')}
                  emptyText={t('pos.no_customer')}
                  className="h-11 text-sm w-full"
                  dropdownWidth={600}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={onAddCustomerClick}
                className="h-11 w-11 p-0 border flex-shrink-0"
                title={t('pos.add_customer')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('pos.payment_method')} <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            
            {/* Row 1: Cash, eSewa, FonePay, Khalti */}
            <div className="grid grid-cols-4 gap-2">
              {/* Cash */}
              <button
                type="button"
                onClick={() => onPaymentMethodChange("cash")}
                className={`flex flex-col items-center justify-center gap-1 h-16 rounded-lg border-2 font-medium text-xs transition-all ${
                  paymentMethod === "cash"
                    ? "border-slate-500 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 ring-2 ring-slate-200 dark:ring-slate-800"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <Wallet className="h-5 w-5" />
                <span>{t('pos.cash')}</span>
              </button>
              
              {/* eSewa */}
              {paymentSettings.esewa_enabled ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => onPaymentMethodChange("esewa")}
                    className={`flex flex-col items-center justify-center gap-1 h-16 w-full rounded-lg border-2 font-medium text-xs transition-all ${
                      paymentMethod === "esewa"
                        ? "border-slate-500 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 ring-2 ring-slate-200 dark:ring-slate-800"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <Smartphone className="h-5 w-5" />
                    <span>eSewa</span>
                  </button>
                  <button
                    type="button"
                    className="absolute right-1 top-1 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowQRCode("esewa");
                    }}
                    title={t('pos.view_qr')}
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                  <span className="text-xs text-gray-400 dark:text-gray-600">eSewa</span>
                </div>
              )}

              {/* FonePay */}
              {paymentSettings.fonepay_enabled ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => onPaymentMethodChange("fonepay")}
                    className={`flex flex-col items-center justify-center gap-1 h-16 w-full rounded-lg border-2 font-medium text-xs transition-all ${
                      paymentMethod === "fonepay"
                        ? "border-slate-500 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 ring-2 ring-slate-200 dark:ring-slate-800"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>FonePay</span>
                  </button>
                  <button
                    type="button"
                    className="absolute right-1 top-1 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowQRCode("fonepay");
                    }}
                    title="View QR Code"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                  <span className="text-xs text-gray-400 dark:text-gray-600">FonePay</span>
                </div>
              )}

              {/* Khalti */}
              {paymentSettings.khalti_enabled ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => onPaymentMethodChange("khalti")}
                    className={`flex flex-col items-center justify-center gap-1 h-16 w-full rounded-lg border-2 font-medium text-xs transition-all ${
                      paymentMethod === "khalti"
                        ? "border-slate-500 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 ring-2 ring-slate-200 dark:ring-slate-800"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <Wallet className="h-5 w-5" />
                    <span>Khalti</span>
                  </button>
                  <button
                    type="button"
                    className="absolute right-1 top-1 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowQRCode("khalti");
                    }}
                    title="View QR Code"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                  <span className="text-xs text-gray-400 dark:text-gray-600">Khalti</span>
                </div>
              )}
            </div>

            {/* Row 2: Bank, Card, Credit */}
            <div className="grid grid-cols-3 gap-2">
              {/* Bank Transfer */}
              {paymentSettings.bank_transfer_enabled ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => onPaymentMethodChange("bank_transfer")}
                    className={`flex flex-col items-center justify-center gap-1 h-16 w-full rounded-lg border-2 font-medium text-xs transition-all ${
                      paymentMethod === "bank_transfer"
                        ? "border-slate-500 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 ring-2 ring-slate-200 dark:ring-slate-800"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Bank</span>
                  </button>
                  <button
                    type="button"
                    className="absolute right-1 top-1 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowQRCode("bank_transfer");
                    }}
                    title="View Bank Details"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                  <span className="text-xs text-gray-400 dark:text-gray-600">Bank</span>
                </div>
              )}

              {/* Card */}
              <button
                type="button"
                onClick={() => onPaymentMethodChange("card")}
                className={`flex flex-col items-center justify-center gap-1 h-16 rounded-lg border-2 font-medium text-xs transition-all ${
                  paymentMethod === "card"
                    ? "border-slate-500 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 ring-2 ring-slate-200 dark:ring-slate-800"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>{t('pos.card')}</span>
              </button>

              {/* Credit */}
              <button
                type="button"
                onClick={() => onPaymentMethodChange("credit")}
                className={`flex flex-col items-center justify-center gap-1 h-16 rounded-lg border-2 font-medium text-xs transition-all ${
                  paymentMethod === "credit"
                    ? "border-slate-500 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 ring-2 ring-slate-200 dark:ring-slate-800"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <Wallet className="h-5 w-5" />
                <span>{t('pos.credit')}</span>
              </button>
            </div>
          </div>

          {/* QR Code Display for Digital Wallets */}
          {(paymentMethod === "esewa" || paymentMethod === "khalti" || paymentMethod === "fonepay") && (
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950 dark:to-gray-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t('pos.scan_qr')}
                </p>
                {paymentMethod === "esewa" && paymentSettings.esewa_qr ? (
                  <div className="flex justify-center">
                    <img 
                      src={paymentSettings.esewa_qr} 
                      alt="eSewa QR Code" 
                      className="w-48 h-48 object-contain rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-white"
                      onError={(e) => {
                        console.error('Failed to load eSewa QR:', paymentSettings.esewa_qr);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : paymentMethod === "khalti" && paymentSettings.khalti_qr ? (
                  <div className="flex justify-center">
                    <img 
                      src={paymentSettings.khalti_qr} 
                      alt="Khalti QR Code" 
                      className="w-48 h-48 object-contain rounded-lg border-2 border-purple-200 dark:border-purple-800 bg-white"
                      onError={(e) => {
                        console.error('Failed to load Khalti QR:', paymentSettings.khalti_qr);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : paymentMethod === "fonepay" && paymentSettings.fonepay_qr ? (
                  <div className="flex justify-center">
                    <img 
                      src={paymentSettings.fonepay_qr} 
                      alt="FonePay QR Code" 
                      className="w-48 h-48 object-contain rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-white"
                      onError={(e) => {
                        console.error('Failed to load FonePay QR:', paymentSettings.fonepay_qr);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center mb-3">
                      <Smartphone className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      No QR code added<br />
                      <span className="text-xs">Add one in Bank Account settings</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cash Amount Input */}
          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('pos.cash_received')} <span className="text-red-500 dark:text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 pointer-events-none">
                  Rs.
                </span>
                <Input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => onCashAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="pl-9 h-12 text-lg text-right font-semibold"
                  min={total}
                  step="10"
                  autoFocus
                />
              </div>
              {cashGiven >= total && changeAmount > 0 && (
                <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 rounded-lg border border-slate-300 dark:border-slate-700">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('pos.change')}</div>
                  <div className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-1">
                    Rs. {changeAmount.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11"
              disabled={processing}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={onConfirmSale}
              disabled={
                processing ||
                !openSession ||
                (paymentMethod === "cash" && cashGiven < total) ||
                (paymentMethod === "credit" && !selectedCustomer)
              }
              className="flex-1 h-11 bg-slate-600 hover:bg-slate-700"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('common.processing')}
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  {t('pos.confirm_sale')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
