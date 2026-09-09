import posApi, { POSHeldOrder } from "@/lib/api/pos";
import { Product } from "@/lib/api/inventory";
import { CartItem } from "./types";
import { toast } from "sonner";

export async function holdOrder(
  cart: CartItem[],
  selectedCustomer: string
): Promise<POSHeldOrder[] | null> {
  if (cart.length === 0) {
    toast.error("Cart is empty");
    return null;
  }
  
  try {
    await posApi.createHeldOrder({
      customer: selectedCustomer || null,
      items: cart.map(item => ({
        product: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku || '',
        quantity: item.quantity,
        unit_price: Number(item.product.selling_price),
        discount_amount: 0,
        line_total: item.quantity * Number(item.product.selling_price),
      })),
      notes: undefined,
    });
    toast.success("Order held successfully");
    
    const updated = await posApi.getHeldOrders();
    return updated;
  } catch (error: any) {
    toast.error(error.response?.data?.detail || "Failed to hold order");
    return null;
  }
}

export function resumeHeldOrder(
  order: POSHeldOrder,
  products: Product[]
): CartItem[] {
  const resumedCart: CartItem[] = order.items.map((item: any) => {
    const product = products.find(p => p.id === item.product);
    return {
      product: product || {
        id: item.product,
        name: item.product_name,
        sku: item.product_sku,
        selling_price: item.unit_price,
        total_stock: 999,
      } as Product,
      quantity: item.quantity,
    };
  });
  
  toast.success("Order resumed");
  return resumedCart;
}

export async function deleteHeldOrder(orderId: string): Promise<POSHeldOrder[] | null> {
  try {
    await posApi.deleteHeldOrder(orderId);
    const updated = await posApi.getHeldOrders();
    toast.success("Held order deleted");
    return updated;
  } catch (error: any) {
    toast.error(error.response?.data?.detail || "Failed to delete held order");
    return null;
  }
}
