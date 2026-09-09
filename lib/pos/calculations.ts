import { CartItem } from "./types";
import { POSDiscount } from "@/lib/api/pos";

export function calculateTotals(
  cart: CartItem[],
  taxRate: number,
  appliedCoupon: POSDiscount | null,
  discountAmount: string
) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * Number(item.product.selling_price),
    0
  );
  
  let discountValue = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountValue = (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      discountValue = appliedCoupon.discount_value;
    }
  } else if (discountAmount) {
    discountValue = parseFloat(discountAmount) || 0;
  }
  
  const netAmount = Math.max(0, subtotal - discountValue);
  const taxAmount = netAmount * taxRate;
  const total = netAmount + taxAmount;

  return {
    subtotal,
    discountValue,
    netAmount,
    taxAmount,
    total,
  };
}

export function calculateChange(cashAmount: string, total: number) {
  const cashGiven = cashAmount ? parseFloat(cashAmount) || 0 : 0;
  const changeAmount = Math.max(0, cashGiven - total);
  return { cashGiven, changeAmount };
}

export function formatDecimal(value: number): number {
  return Math.round(value * 100) / 100;
}
