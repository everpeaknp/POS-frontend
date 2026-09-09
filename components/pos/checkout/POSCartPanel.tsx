import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2, Receipt, X, Tags, MoreVertical } from "lucide-react";
import type { Product } from "@/lib/api/inventory";
import type { POSDiscount, POSSession } from "@/lib/api/pos";
import { useLanguage } from "@/lib/context/LanguageContext";

interface CartItem {
  product: Product;
  quantity: number;
}

interface POSCartPanelProps {
  cart: CartItem[];
  subtotal: number;
  discountValue: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  appliedCoupon: POSDiscount | null;
  discountAmount: string;
  openSession: POSSession | null;
  width?: number;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onResetForm: () => void;
  onShowCouponDialog: () => void;
  onRemoveCoupon: () => void;
  onDiscountAmountChange: (amount: string) => void;
  onShowCheckoutDialog: () => void;
  onResizeStart?: () => void;
}

export function POSCartPanel({
  cart,
  subtotal,
  discountValue,
  taxAmount,
  taxRate,
  total,
  appliedCoupon,
  discountAmount,
  openSession,
  width = 340,
  onUpdateQuantity,
  onRemoveFromCart,
  onResetForm,
  onShowCouponDialog,
  onRemoveCoupon,
  onDiscountAmountChange,
  onShowCheckoutDialog,
  onResizeStart,
}: POSCartPanelProps) {
  const { t } = useLanguage();
  return (
    <div 
      className="bg-white dark:bg-gray-900 border-l dark:border-gray-800 shadow-2xl flex flex-col fixed right-0 top-0 bottom-0 overflow-hidden z-40"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 hover:w-1.5 bg-transparent hover:bg-slate-500 cursor-col-resize transition-all group z-10"
        onMouseDown={onResizeStart}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-6 w-6 text-slate-600 dark:text-slate-400" />
        </div>
      </div>
      {/* Cart Header */}
      <div className="p-3 border-b dark:border-gray-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-600 dark:bg-slate-700 p-1.5 rounded-lg">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('pos.cart')}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">{cart.length} {t('pos.item')}{cart.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={onResetForm}
              className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 px-2 py-1 rounded-lg transition-colors"
            >
              {t('common.clear')}
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <Receipt className="h-10 w-10 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">{t('pos.cart_empty')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">{t('pos.add_products')}</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">
                  {item.product.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Rs. {Number(item.product.selling_price).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-600">×</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.quantity}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7 rounded-md hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400"
                  onClick={() => onUpdateQuantity(item.product.id, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-7 text-center text-xs font-bold text-gray-900 dark:text-gray-100">
                  {item.quantity}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7 rounded-md hover:bg-slate-50 dark:hover:bg-slate-950 hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-xs font-bold w-16 text-right text-gray-900 dark:text-gray-100">
                Rs. {(item.quantity * Number(item.product.selling_price)).toFixed(0)}
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                onClick={() => onRemoveFromCart(item.product.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Cart Footer - Totals & Checkout */}
      {cart.length > 0 && (
        <div className="border-t dark:border-gray-800 bg-white dark:bg-gray-900 p-3 space-y-3 shadow-inner flex-shrink-0">
          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{t('pos.subtotal')}</span>
              <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
            </div>
            
            {/* Discount Section */}
            <div className="space-y-2">
              {/* Applied Coupon Display */}
              {appliedCoupon && (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Tags className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{appliedCoupon.name}</div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        {appliedCoupon.discount_type === 'percentage' 
                          ? `${appliedCoupon.discount_value}% ${t('pos.off')}` 
                          : `Rs. ${appliedCoupon.discount_value} ${t('pos.off')}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onRemoveCoupon}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-1"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Apply Coupon Button or Manual Discount */}
              {!appliedCoupon && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onShowCouponDialog}
                    className="flex-1 h-8 text-xs border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950"
                  >
                    <Tags className="h-3 w-3 mr-1" />
                    {t('pos.apply_coupon')}
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">or Rs.</span>
                    <Input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => onDiscountAmountChange(e.target.value)}
                      placeholder="0"
                      className="w-16 h-8 text-right text-xs border-gray-300 dark:border-gray-700 focus:border-slate-500 focus:ring-green-500"
                      min="0"
                      step="10"
                      disabled={!!appliedCoupon}
                    />
                  </div>
                </div>
              )}

              {/* Discount Amount */}
              {discountValue > 0 && (
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>{t('pos.discount')}</span>
                  <span className="font-medium">- Rs. {Number(discountValue).toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{t('pos.tax')} ({(taxRate * 100).toFixed(1)}%)</span>
              <span className="font-medium">Rs. {taxAmount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-gray-100">{t('pos.total')}</span>
              <span className="text-slate-600 dark:text-slate-400">Rs. {total.toFixed(0)}</span>
            </div>
          </div>

          {/* Checkout Button - Opens Dialog */}
          <Button
            onClick={onShowCheckoutDialog}
            disabled={!openSession}
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Receipt className="h-5 w-5 mr-2" />
            {t('pos.complete_sale')} · Rs. {total.toFixed(0)}
          </Button>
        </div>
      )}
    </div>
  );
}
