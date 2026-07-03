export interface LineItem {
  id: string;
  product: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  discount: number;
  tax: number;
  amount: number;
}
