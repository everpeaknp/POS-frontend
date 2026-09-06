import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tags } from "lucide-react";

interface Discount {
  id: string;
  name: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  valid_from?: string;
  valid_until?: string;
}

interface POSCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  onApplyCouponCode: () => void;
  availableDiscounts: Discount[];
  loadingDiscounts: boolean;
  subtotal: number;
  onSelectDiscount: (discount: Discount) => void;
}

export function POSCouponDialog({
  open,
  onOpenChange,
  couponCode,
  onCouponCodeChange,
  onApplyCouponCode,
  availableDiscounts,
  loadingDiscounts,
  subtotal,
  onSelectDiscount,
}: POSCouponDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Apply Coupon</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Enter a coupon code or select from available offers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900">Enter Coupon Code</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={couponCode}
                onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g., SAVE10)"
                className="flex-1 h-12 text-base font-mono uppercase"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onApplyCouponCode();
                  }
                }}
              />
              <Button
                onClick={onApplyCouponCode}
                className="h-12 px-6 bg-[var(--color-accent-custom-600,#16a34a)] hover:bg-[var(--color-accent-custom-700,#15803d)]"
              >
                Apply
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">OR CHOOSE FROM AVAILABLE COUPONS</span>
            </div>
          </div>

          <div className="space-y-3">
            {loadingDiscounts ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-custom-600,#16a34a)] mx-auto mb-2"></div>
                Loading coupons...
              </div>
            ) : availableDiscounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Tags className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="font-medium">No active coupons available</p>
                <p className="text-sm">Check back later for offers</p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {availableDiscounts.map((discount) => {
                  const isExpired = discount.valid_until && new Date(discount.valid_until) < new Date();
                  const isNotYetValid = discount.valid_from && new Date(discount.valid_from) > new Date();
                  const isBelowMinimum = discount.min_order_amount && subtotal < discount.min_order_amount;
                  const isDisabled = isExpired || isNotYetValid || isBelowMinimum;

                  return (
                    <button
                      key={discount.id}
                      onClick={() => !isDisabled && onSelectDiscount(discount)}
                      disabled={isDisabled}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        isDisabled
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-[var(--color-accent-custom-200,#bbf7d0)] bg-[var(--color-accent-custom-50,#f0fdf4)] hover:border-[var(--color-accent-custom-400,#4ade80)] hover:shadow-md cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Tags className={`h-4 w-4 ${isDisabled ? 'text-gray-400' : 'text-[var(--color-accent-custom-600,#16a34a)]'}`} />
                            <span className="font-bold text-base text-gray-900">{discount.name}</span>
                          </div>
                          
                          {discount.description && (
                            <p className="text-sm text-gray-600 mb-2">{discount.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="outline" className="bg-white">
                              Code: <span className="font-mono font-bold ml-1">{discount.code}</span>
                            </Badge>
                            
                            {discount.min_order_amount && (
                              <Badge variant="outline" className={isBelowMinimum ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white'}>
                                Min: Rs. {discount.min_order_amount}
                              </Badge>
                            )}
                            
                            {discount.valid_until && (
                              <Badge variant="outline" className={isExpired ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white'}>
                                {isExpired ? 'Expired' : `Valid until ${new Date(discount.valid_until).toLocaleDateString()}`}
                              </Badge>
                            )}
                          </div>

                          {isDisabled && (
                            <div className="mt-2 text-xs text-red-600 font-medium">
                              {isExpired && '⚠️ This coupon has expired'}
                              {isNotYetValid && '⚠️ This coupon is not yet valid'}
                              {isBelowMinimum && `⚠️ Minimum order of Rs. ${discount.min_order_amount} required (Current: Rs. ${subtotal.toFixed(2)})`}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className={`text-2xl font-bold ${isDisabled ? 'text-gray-400' : 'text-[var(--color-accent-custom-600,#16a34a)]'}`}>
                            {discount.discount_type === 'percentage' 
                              ? `${discount.discount_value}%` 
                              : `Rs. ${discount.discount_value}`}
                          </div>
                          <div className="text-xs text-gray-500">OFF</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {availableDiscounts.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Current Order</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">Rs. {subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
