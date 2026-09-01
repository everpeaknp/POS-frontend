import { Product } from "@/lib/api/inventory";
import { CartItem } from "./types";
import { toast } from "sonner";

export function addProductToCart(
  cart: CartItem[],
  product: Product
): CartItem[] {
  // Validate product has valid ID and name
  if (!product || !product.id || !product.name) {
    toast.error("Invalid product - cannot add to cart");
    console.error("Invalid product:", product);
    return cart;
  }

  const stock = product.total_stock || 0;
  
  if (stock <= 0) {
    toast.error(`${product.name} is out of stock`);
    return cart;
  }

  const existing = cart.find((item) => item.product.id === product.id);
  
  if (existing) {
    const newQty = existing.quantity + 1;
    if (newQty > stock) {
      toast.error(`Only ${stock} units available`);
      return cart;
    }
    return cart.map((item) =>
      item.product.id === product.id
        ? { ...item, quantity: newQty }
        : item
    );
  }
  
  return [...cart, { product, quantity: 1 }];
}

export function updateCartQuantity(
  cart: CartItem[],
  productId: string,
  delta: number
): CartItem[] {
  return cart
    .map((item) => {
      if (item.product.id !== productId) return item;
      
      const newQty = item.quantity + delta;
      const stock = item.product.total_stock || 0;
      
      if (newQty <= 0) return null;
      if (newQty > stock) {
        toast.error(`Only ${stock} units available`);
        return item;
      }
      
      return { ...item, quantity: newQty };
    })
    .filter((item): item is CartItem => item !== null);
}

export function removeFromCart(cart: CartItem[], productId: string): CartItem[] {
  return cart.filter((item) => item.product.id !== productId);
}

export function clearCart(): CartItem[] {
  toast.info("Cart cleared");
  return [];
}
