import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Wallet, CreditCard, Smartphone, Eye, Plus, Receipt } from "lucide-react";
import type { PaymentMethod } from "@/hooks/usePOSCheckout";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  type?: string;
}

interface PaymentSettings {
  esewa_enabled: boolean;
  khalti_enabled: boolean;
  fonepay_enabled: boolean;
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Complete Sale</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Order Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-5 space-y-2.5 border border-green-200 dark:border-green-800">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Subtotal</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Rs. {subtotal.toFixed(2)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Discount {appliedCoupon && `(${appliedCoupon.code})`}
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">- Rs. {Number(discountValue).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Tax ({(taxRate * 100).toFixed(1)}%)</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Rs. {taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2.5 border-t-2 border-green-300 dark:border-green-700">
              <span className="text-gray-900 dark:text-gray-100">Total</span>
              <span className="text-green-600 dark:text-green-400">Rs. {total.toFixed(0)}</span>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Customer 
              {paymentMethod === "credit" ? (
                <span className="text-red-500 dark:text-red-400 ml-1">*</span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(Optional)</span>
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
                  placeholder="Search by name, phone, email..."
                  searchPlaceholder="Search customers..."
                  emptyText="No customer found."
                  className="h-11 text-sm w-full"
                  dropdownWidth={600}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={onAddCustomerClick}
                className="h-11 w-11 p-0 border flex-shrink-0"
                title="Add new customer"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Payment Method <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            
            {/* Row 1: Cash, eSewa, FonePay, Khalti */}
            <div className="grid grid-cols-4 gap-2">
              {/* Cash */}
              <button
                type="button"
                onClick={() => onPaymentMethodChange("cash")}
                className={`flex flex-col items-center justify-center gap-1 h-16 rounded-lg border-2 font-medium text-xs transition-all ${
                  paymentMethod === "cash"
                    ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 ring-2 ring-green-200 dark:ring-green-800"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <Wallet className="h-5 w-5" />
                <span>Cash</span>
              </button>
              
              {/* eSewa */}
              {paymentSettings.esewa_enabled ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => onPaymentMethodChange("esewa")}
                    className={`flex flex-col items-center justify-center gap-1 h-16 w-full rounded-lg border-2 font-medium text-xs transition-all ${
                      paymentMethod === "esewa"
                        ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 ring-2 ring-green-200 dark:ring-green-800"
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
                    title="View QR Code"
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
                        ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 ring-2 ring-green-200 dark:ring-green-800"
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
                        ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 ring-2 ring-green-200 dark:ring-green-800"
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
                        ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 ring-2 ring-green-200 dark:ring-green-800"
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
                    ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 ring-2 ring-green-200 dark:ring-green-800"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Card</span>
              </button>

              {/* Credit */}
              <button
                type="button"
                onClick={() => onPaymentMethodChange("credit")}
                className={`flex flex-col items-center justify-center gap-1 h-16 rounded-lg border-2 font-medium text-xs transition-all ${
                  paymentMethod === "credit"
                    ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 ring-2 ring-green-200 dark:ring-green-800"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <Wallet className="h-5 w-5" />
                <span>Credit</span>
              </button>
            </div>
          </div>

          {/* Cash Amount Input */}
          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cash Received <span className="text-red-500 dark:text-red-400">*</span></label>
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
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-300 dark:border-green-700">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Change to Return</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
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
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onConfirmSale();
              }}
              disabled={
                processing ||
                !openSession ||
                (paymentMethod === "cash" && cashGiven < total) ||
                (paymentMethod === "credit" && !selectedCustomer)
              }
              className="flex-1 h-11 bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Confirm Sale
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
