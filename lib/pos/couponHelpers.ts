import posApi, { POSDiscount } from "@/lib/api/pos";
import { toast } from "sonner";

export async function loadActiveDiscounts(): Promise<POSDiscount[]> {
  try {
    const discounts = await posApi.getActiveDiscounts();
    return discounts;
  } catch (error) {
    console.error('Failed to load discounts:', error);
    toast.error('Failed to load available coupons');
    return [];
  }
}

export function validateAndApplyCoupon(
  couponCode: string,
  availableDiscounts: POSDiscount[],
  subtotal: number
): { success: boolean; discount?: POSDiscount; error?: string } {
  if (!couponCode.trim()) {
    return { success: false, error: 'Please enter a coupon code' };
  }

  const discount = availableDiscounts.find(
    d => d.code.toLowerCase() === couponCode.trim().toLowerCase()
  );

  if (!discount) {
    return { success: false, error: 'Invalid coupon code' };
  }

  if (!discount.is_active) {
    return { success: false, error: 'This coupon is no longer active' };
  }

  const now = new Date();
  if (discount.start_date && new Date(discount.start_date) > now) {
    return { success: false, error: 'This coupon is not yet valid' };
  }
  if (discount.end_date && new Date(discount.end_date) < now) {
    return { success: false, error: 'This coupon has expired' };
  }

  if (discount.min_amount && subtotal < discount.min_amount) {
    return {
      success: false,
      error: `Minimum order amount of Rs. ${discount.min_amount} required`
    };
  }

  return { success: true, discount };
}
