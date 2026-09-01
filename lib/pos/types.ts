import { Product } from "@/lib/api/inventory";

export interface CartItem {
  product: Product;
  quantity: number;
}
