"use client";

import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import type { LineItem } from "@/lib/types/sales";
import type { Product } from "@/lib/api/inventory";
import { inventoryApi } from "@/lib/api/inventory";

interface LineItemsTableProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  products?: Product[];
  readOnly?: boolean;
  useBulkPricing?: boolean;
}

function calcAmount(item: LineItem): number {
  const base = item.qty * item.unitPrice;
  const afterDiscount = base - (base * item.discount) / 100;
  return afterDiscount + (afterDiscount * item.tax) / 100;
}

export function LineItemsTable({ items, onChange, products = [], readOnly = false, useBulkPricing = false }: LineItemsTableProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const parseSellingPrice = (product?: Product) => {
    if (!product?.selling_price) return 0;
    return typeof product.selling_price === "string"
      ? parseFloat(product.selling_price)
      : product.selling_price;
  };

  const applyBulkPrice = async (idx: number, productId: string, qty: number, fallback: number) => {
    if (!useBulkPricing || !productId || qty <= 0) return fallback;
    return inventoryApi.bulkPricing.resolveUnitPrice(Number(productId), qty, fallback);
  };

  const update = async (idx: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    const item = { ...updated[idx], [field]: value };

    if (useBulkPricing && item.product && (field === "qty" || field === "product")) {
      const product = products.find((p) => String(p.id) === item.product);
      const fallback = parseSellingPrice(product);
      item.unitPrice = await applyBulkPrice(idx, item.product, Number(item.qty), fallback);
    }

    item.amount = calcAmount(item);
    updated[idx] = item;
    onChange(updated);
  };

  const addRow = () => {
    onChange([...items, {
      id: Date.now().toString(), product: "", description: "",
      qty: 1, unit: "Pcs", unitPrice: 0, discount: 0, tax: 13, amount: 0,
    }]);
  };

  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  const setProduct = async (idx: number, productId: string) => {
    const p = products.find((x) => String(x.id) === productId);
    const sellingPrice = parseSellingPrice(p);
    const qty = items[idx]?.qty || 1;
    const unitPrice = await applyBulkPrice(idx, productId, qty, sellingPrice);

    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      const next = {
        ...item,
        product: productId,
        unit: p?.unit_name ?? item.unit,
        unitPrice,
        tax: 13,
      };
      next.amount = calcAmount(next);
      return next;
    });
    onChange(updated);
  };

  // Get product name for display
  const getProductName = (productId: string) => {
    const product = products.find(p => String(p.id) === productId);
    return product ? `${product.name} (${product.sku})` : productId;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">
          Line Items ({items.length})
        </h3>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Expand
            </>
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 w-8">#</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 min-w-[160px]">Product</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 min-w-[140px]">Description</th>
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
                <td className="px-3 py-3 text-gray-400 text-xs">{idx + 1}</td>
                <td className="px-3 py-3">
                  {readOnly ? <span>{getProductName(item.product)}</span> : (
                    <Combobox
                      options={products
                        .filter((p) => p.total_stock && p.total_stock > 0) // Only show in-stock products
                        .map((p) => ({
                          value: String(p.id),
                          label: `${p.name} (${p.sku})`,
                          subtitle: p.total_stock !== undefined ? `Stock: ${p.total_stock}` : undefined,
                        }))}
                      value={item.product}
                      onValueChange={(v) => setProduct(idx, v)}
                      placeholder="Select product"
                      searchPlaceholder="Search products..."
                      emptyText="No in-stock products found."
                      className="min-w-[200px]"
                    />
                  )}
                </td>
                <td className="px-3 py-3">
                  {readOnly ? <span className="text-gray-500">{item.description}</span> : (
                    <Input value={item.description} onChange={(e) => update(idx, "description", e.target.value)}
                      className="h-8 text-sm border-gray-200" placeholder="Optional" />
                  )}
                </td>
                <td className="px-3 py-3">
                  {readOnly ? <span>{item.qty}</span> : (
                    <Input type="number" value={item.qty} min={1}
                      onChange={(e) => void update(idx, "qty", Number(e.target.value))}
                      className="h-8 text-sm border-gray-200 w-16" />
                  )}
                </td>
                <td className="px-3 py-3 text-gray-600">{item.unit}</td>
                <td className="px-3 py-3">
                  {readOnly ? <span>Rs. {item.unitPrice.toLocaleString()}</span> : (
                    <Input type="number" value={item.unitPrice} min={0}
                      onChange={(e) => update(idx, "unitPrice", Number(e.target.value))}
                      className="h-8 text-sm border-gray-200 w-24" />
                  )}
                </td>
                <td className="px-3 py-3">
                  {readOnly ? <span>{item.discount}%</span> : (
                    <Input type="number" value={item.discount} min={0} max={100}
                      onChange={(e) => update(idx, "discount", Number(e.target.value))}
                      className="h-8 text-sm border-gray-200 w-16" />
                  )}
                </td>
                <td className="px-3 py-3">
                  {readOnly ? <span>{item.tax}%</span> : (
                    <Input type="number" value={item.tax} min={0}
                      onChange={(e) => update(idx, "tax", Number(e.target.value))}
                      className="h-8 text-sm border-gray-200 w-16" />
                  )}
                </td>
                <td className="px-3 py-3 text-right font-medium text-gray-800">
                  Rs. {item.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </td>
                {!readOnly && (
                  <td className="px-2 py-3">
                    <button onClick={() => remove(idx)} className="text-gray-300 hover:text-red-500 transition-colors" aria-label="Remove">
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
      )}
      
      {!readOnly && isExpanded && (
        <Button type="button" variant="outline" size="sm" onClick={addRow}
          className="border-dashed border-[#22C55E] text-[#22C55E] hover:bg-green-50 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Item
        </Button>
      )}
    </div>
  );
}
