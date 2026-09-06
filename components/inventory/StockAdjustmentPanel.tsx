"use client";

import { useState } from "react";
import { Scan, Plus, Minus } from "@/lib/icons/lucide-react-shim";
import { Button } from "@/components/ui/button";
import { inventoryApi, type Product } from "@/lib/api/inventory";
import { BarcodeScannerModal } from "@/components/pos/BarcodeScannerModal";
import { toast } from "sonner";

interface StockAdjustmentPanelProps {
  warehouseId?: number;
  onStockUpdated?: () => void;
}

export function StockAdjustmentPanel({ warehouseId, onStockUpdated }: StockAdjustmentPanelProps) {
  const [processing, setProcessing] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scanMode, setScanMode] = useState<"add" | "reduce">("add");

  // Handle camera barcode scan
  const handleCameraScan = async (product: Product, action: "received" | "sold") => {
    // Automatically execute the action based on scan mode
    if (!warehouseId) {
      toast.error("Please select a warehouse first");
      setShowCameraScanner(false);
      return;
    }

    setProcessing(true);
    setShowCameraScanner(false);

    try {
      if (scanMode === "add") {
        // Add stock
        await inventoryApi.operations.stockIn({
          product: Number(product.id),
          warehouse: warehouseId,
          quantity: "1",
          reason: "Stock adjustment - barcode scan",
          notes: `Added via barcode: ${product.sku}`,
        });
        toast.success(`Added 1 unit of ${product.name}`);
      } else {
        // Reduce stock
        await inventoryApi.operations.stockOut({
          product: Number(product.id),
          warehouse: warehouseId,
          quantity: "1",
          reason: "Stock adjustment - barcode scan",
          notes: `Reduced via barcode: ${product.sku}`,
        });
        toast.success(`Reduced 1 unit of ${product.name}`);
      }
      
      onStockUpdated?.();
    } catch (error: any) {
      console.error("Stock adjustment error:", error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || "Failed to adjust stock";
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scan className="h-5 w-5 text-[var(--color-accent-custom,#22C55E)]" />
          <h3 className="text-lg font-semibold text-gray-900">Stock Adjustment</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setScanMode("add");
              setShowCameraScanner(true);
            }}
            disabled={!warehouseId || processing}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
          <Button
            onClick={() => {
              setScanMode("reduce");
              setShowCameraScanner(true);
            }}
            disabled={!warehouseId || processing}
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
            size="sm"
          >
            <Minus className="h-4 w-4" />
            Reduce
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Click "Add" or "Reduce" to scan a barcode and adjust inventory instantly.
      </p>

      {!warehouseId && (
        <p className="text-xs text-amber-600 text-center py-2">
          ⚠️ Please select a warehouse to adjust stock
        </p>
      )}

      {processing && (
        <div className="text-center py-4">
          <div className="animate-pulse text-[var(--color-accent-custom,#22C55E)] text-sm">Processing adjustment...</div>
        </div>
      )}
    </div>

    {/* Camera Scanner Modal */}
    <BarcodeScannerModal
      open={showCameraScanner}
      onClose={() => setShowCameraScanner(false)}
      warehouseId={warehouseId || 0}
      onProductScanned={handleCameraScan}
    />
    </>
  );
}
