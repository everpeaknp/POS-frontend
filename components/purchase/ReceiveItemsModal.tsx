"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReceiveItem {
  product: string;
  ordered: number;
  received: number;
  receiving: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  poId: string;
}

const defaultItems: ReceiveItem[] = [
  { product: "Cotton Fabric (per meter)", ordered: 100, received: 0, receiving: 0 },
  { product: "Silk Fabric (per meter)", ordered: 50, received: 20, receiving: 0 },
  { product: "Denim Fabric (per meter)", ordered: 80, received: 80, receiving: 0 },
];

export function ReceiveItemsModal({ open, onClose, poId }: Props) {
  const [items, setItems] = useState<ReceiveItem[]>(defaultItems);

  const update = (idx: number, val: number) => {
    setItems(items.map((item, i) => i === idx ? { ...item, receiving: Math.min(val, item.ordered - item.received) } : item));
  };

  const handleSave = () => {
    alert(`Items received for ${poId}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Receive Items — {poId}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Product", "Ordered", "Previously Received", "Receiving Now", "Remaining"].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => {
                  const remaining = item.ordered - item.received - item.receiving;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2 font-medium text-gray-800">{item.product}</td>
                      <td className="px-3 py-2 text-gray-600">{item.ordered}</td>
                      <td className="px-3 py-2 text-gray-600">{item.received}</td>
                      <td className="px-3 py-2">
                        <Input type="number" value={item.receiving} min={0} max={item.ordered - item.received}
                          onChange={(e) => update(idx, Number(e.target.value))}
                          className="h-8 w-20 text-sm border-gray-200" />
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
            <Button onClick={handleSave} className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white">Confirm Receipt</Button>
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
