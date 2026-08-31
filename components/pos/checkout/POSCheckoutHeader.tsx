"use client";

import { Search, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface POSCheckoutHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  barcodeInput: string;
  setBarcodeInput: (input: string) => void;
  onBarcodeSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onScanClick: () => void;
  warehouseSelected: boolean;
}

export function POSCheckoutHeader({
  searchQuery,
  setSearchQuery,
  barcodeInput,
  setBarcodeInput,
  onBarcodeSubmit,
  onScanClick,
  warehouseSelected,
}: POSCheckoutHeaderProps) {
  return (
    <div className="bg-white border-b shadow-sm">
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            Search products to add to cart
          </div>
          <Button
            onClick={onScanClick}
            disabled={!warehouseSelected}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Scan className="h-4 w-4" />
            Scan Barcode
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Product Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products by name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base border-gray-300 focus:border-green-500 focus:ring-green-500 shadow-sm"
              autoFocus
            />
          </div>

          {/* Barcode Input Field */}
          <div className="relative">
            <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
            <Input
              type="text"
              placeholder="Quick scan: Enter barcode here..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={onBarcodeSubmit}
              className="pl-10 h-12 text-base border-green-300 focus:border-green-500 focus:ring-green-500 bg-green-50/50 shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
