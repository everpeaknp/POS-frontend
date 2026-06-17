"use client";

import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/api/inventory";

// Simple LineItem interface for purchase requests
export interface PurchaseLineItem {
  id?: string;
  product: string; // Product ID
  description?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  discount: number;
  tax: number;
  amount: number;
}

interface Props {
  items: PurchaseLineItem[];
  onChange: (items: PurchaseLineItem[]) => void;
  readOnly?: boolean;
  products?: Product[];
}

function calcAmount(item: PurchaseLineItem): number {
  const base = item.qty * item.unitPrice;
  const afterDiscount = base - (base * item.discount) / 100;
  return afterDiscount + (afterDiscount * item.tax) / 100;
}

export function LineItemsTable({ items, onChange, readOnly = false, products = [] }: Props) {
  console.log('📋 LineItemsTable rendered:', {
    itemsCount: items.length,
    productsCount: products.length,
    products: products.slice(0, 3).map(p => ({
      id: p.id,
      name: p.name,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      unit_name: p.unit_name,
    })),
  });
  
  const update = (idx: number, field: keyof PurchaseLineItem, value: string | number) => {
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      const next = { ...item, [field]: value };
      next.amount = calcAmount(next);
      return next;
    });
    onChange(updated);
  };

  const addRow = () => {
    const newItem: PurchaseLineItem = {
      id: `item-${Date.now()}`, 
      product: "", 
      description: "",
      qty: 1, 
      unit: "Pcs", 
      unitPrice: 0, 
      discount: 0, 
      tax: 13, 
      amount: 0,
    };
    console.log('➕ Adding new row:', newItem);
    onChange([...items, newItem]);
  };

  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  const setProduct = (idx: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    
    console.log('🔍 Product selected:', {
      productId,
      product: p,
      cost_price: p?.cost_price,
      cost_price_type: typeof p?.cost_price,
      selling_price: p?.selling_price,
      selling_price_type: typeof p?.selling_price,
    });
    
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      
      // Handle unit - use unit_name from API
      let unitValue = item.unit;
      if (p?.unit_name) {
        unitValue = p.unit_name;
      } else if (p?.unit) {
        if (typeof p.unit === 'string') {
          unitValue = p.unit;
        } else if (typeof p.unit === 'object' && 'abbreviation' in p.unit) {
          unitValue = (p.unit as any).abbreviation;
        }
      }
      
      // Get unit price - handle string/number conversion properly
      let unitPrice = 0;
      if (p) {
        // Parse prices - they come as strings from backend
        const costPrice = typeof p.cost_price === 'string' 
          ? parseFloat(p.cost_price) 
          : (typeof p.cost_price === 'number' ? p.cost_price : 0);
        
        const sellingPrice = typeof p.selling_price === 'string' 
          ? parseFloat(p.selling_price) 
          : (typeof p.selling_price === 'number' ? p.selling_price : 0);
        
        console.log('💰 Price parsing:', {
          costPrice,
          costPriceValid: !isNaN(costPrice) && costPrice > 0,
          sellingPrice,
          sellingPriceValid: !isNaN(sellingPrice) && sellingPrice > 0,
        });
        
        // Prefer cost price, fallback to selling price
        if (!isNaN(costPrice) && costPrice > 0) {
          unitPrice = costPrice;
        } else if (!isNaN(sellingPrice) && sellingPrice > 0) {
          unitPrice = sellingPrice;
        } else {
          unitPrice = item.unitPrice; // Keep existing if both are invalid
        }
      }
      
      console.log('✅ Final values:', {
        unitValue,
        unitPrice,
        item: { ...item, product: productId, unit: unitValue, unitPrice }
      });
      
      const next = { 
        ...item, 
        product: productId,
        unit: unitValue, 
        unitPrice: unitPrice, 
        tax: item.tax 
      };
      next.amount = calcAmount(next);
      return next;
    });
    
    console.log('📦 Updated items:', updated);
    onChange(updated);
  };

  // Use API products
  const productList = products;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 w-8">#</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 min-w-[160px]">Product</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 min-w-[130px]">Description</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 w-16">Qty</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 w-16">Unit</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 w-24">Unit Price</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 w-16">Disc %</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 w-16">Tax %</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-gray-500 w-28">Amount</th>
              {!readOnly && <th className="w-8" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                <td className="px-3 py-2">
                  {readOnly ? <span>{productList.find(p => p.id === item.product)?.name || item.product}</span> : (
                    <select 
                      value={item.product} 
                      onChange={(e) => {
                        console.log('🎯 Product dropdown changed:', {
                          idx,
                          selectedValue: e.target.value,
                          availableProducts: productList.length,
                        });
                        setProduct(idx, e.target.value);
                      }}
                      className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:border-[#22C55E]">
                      <option value="">Select product</option>
                      {productList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-3 py-2">
                  {readOnly ? <span className="text-gray-500">{item.description}</span> : (
                    <Input value={item.description} onChange={(e) => update(idx, "description", e.target.value)}
                      className="h-8 text-sm border-gray-200" placeholder="Optional" />
                  )}
                </td>
                <td className="px-3 py-2">
                  {readOnly ? <span>{item.qty}</span> : (
                    <Input type="number" value={item.qty} min={1}
                      onChange={(e) => update(idx, "qty", Number(e.target.value))}
                      className="h-8 text-sm border-gray-200 w-16" />
                  )}
                </td>
                <td className="px-3 py-2 text-gray-600">{item.unit}</td>
                <td className="px-3 py-2">
                  {readOnly ? <span>Rs. {item.unitPrice.toLocaleString()}</span> : (
                    <Input 
                      type="number" 
                      value={item.unitPrice || 0} 
                      min={0}
                      onChange={(e) => {
                        console.log('💵 Unit price changed manually:', e.target.value);
                        update(idx, "unitPrice", Number(e.target.value));
                      }}
                      className="h-8 text-sm border-gray-200 w-24" 
                      placeholder="0.00"
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  {readOnly ? <span>{item.discount}%</span> : (
                    <Input type="number" value={item.discount} min={0} max={100}
                      onChange={(e) => update(idx, "discount", Number(e.target.value))}
                      className="h-8 text-sm border-gray-200 w-16" />
                  )}
                </td>
                <td className="px-3 py-2">
                  {readOnly ? <span>{item.tax}%</span> : (
                    <Input type="number" value={item.tax} min={0}
                      onChange={(e) => update(idx, "tax", Number(e.target.value))}
                      className="h-8 text-sm border-gray-200 w-16" />
                  )}
                </td>
                <td className="px-3 py-2 text-right font-medium text-gray-800">
                  Rs. {item.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </td>
                {!readOnly && (
                  <td className="px-2 py-2">
                    <button onClick={() => remove(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={readOnly ? 9 : 10} className="px-3 py-6 text-center text-sm text-gray-400">No items added yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <Button type="button" variant="outline" size="sm" onClick={addRow}
          className="border-dashed border-[#22C55E] text-[#22C55E] hover:bg-green-50 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Item
        </Button>
      )}
    </div>
  );
}
