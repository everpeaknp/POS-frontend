"use client";

import { Search, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/context/LanguageContext";

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
  const { t } = useLanguage();
  
  return (
    <div className="bg-white border-b shadow-sm">
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            {t('pos.search_products')}
          </div>
          <Button
            onClick={onScanClick}
            disabled={!warehouseSelected}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Scan className="h-4 w-4" />
            {t('pos.barcode_scan')}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Product Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder={t('pos.search_products')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base border-gray-300 focus:border-slate-500 focus:ring-green-500 shadow-sm"
              autoFocus
            />
          </div>

          {/* Barcode Input Field */}
          <div className="relative">
            <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
            <Input
              type="text"
              placeholder={t('pos.barcode_scan')}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={onBarcodeSubmit}
              className="pl-10 h-12 text-base border-slate-300 focus:border-slate-500 focus:ring-green-500 bg-slate-50/50 shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
