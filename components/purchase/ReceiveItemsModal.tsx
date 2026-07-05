"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { purchaseOrdersAPI, type PurchaseOrder } from "@/lib/api/purchase";
import type { Warehouse } from "@/lib/api/inventory";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  order: PurchaseOrder;
  warehouses?: Warehouse[];
  onSuccess?: () => void;
}

export function ReceiveItemsModal({ open, onClose, order, warehouses = [], onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, number> = {};
    order.lines?.forEach((line) => {
      const remaining = Number(line.quantity) - Number(line.received_quantity || 0);
      if (line.id) initial[line.id] = remaining > 0 ? remaining : 0;
    });
    setQuantities(initial);
    if (warehouses.length > 0) {
      setWarehouseId(String(warehouses[0].id));
    }
  }, [open, order, warehouses]);

  const updateQty = (lineId: string, val: number, max: number) => {
    setQuantities((prev) => ({
      ...prev,
      [lineId]: Math.max(0, Math.min(val, max)),
    }));
  };

  const handleSave = async () => {
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([line_id, quantity]) => ({ line_id, quantity }));

    if (items.length === 0) {
      toast.error("Please enter quantities to receive");
      return;
    }

    setSubmitting(true);
    try {
      await purchaseOrdersAPI.receiveItems(order.id, items, warehouseId || undefined);
      toast.success(`Items received for ${order.po_number}`);
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to receive items");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Items — {order.po_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {warehouses.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <Label className="text-sm">Receive into warehouse</Label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Product", "Ordered", "Received", "Receiving Now", "Remaining"].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.lines?.map((line) => {
                  const lineId = line.id || "";
                  const ordered = Number(line.quantity);
                  const received = Number(line.received_quantity || 0);
                  const receiving = quantities[lineId] ?? 0;
                  const remaining = ordered - received - receiving;
                  if (ordered - received <= 0) return null;

                  return (
                    <tr key={lineId} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2 font-medium text-gray-800">{line.product_name || line.product}</td>
                      <td className="px-3 py-2 text-gray-600">{ordered}</td>
                      <td className="px-3 py-2 text-gray-600">{received}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={receiving}
                          min={0}
                          max={ordered - received}
                          onChange={(e) => updateQty(lineId, Number(e.target.value), ordered - received)}
                          className="h-8 w-20 text-sm border-gray-200"
                        />
                      </td>
                      <td className={`px-3 py-2 font-medium ${remaining > 0 ? "text-orange-500" : "text-green-600"}`}>
                        {remaining}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Receipt
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
