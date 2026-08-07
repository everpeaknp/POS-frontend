"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type POSHeldOrder } from "@/lib/api/pos";
import { Trash2, Play } from "lucide-react";
import toast from "react-hot-toast";

interface HeldOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heldOrders: POSHeldOrder[];
  onResume: (order: POSHeldOrder) => void;
  onDelete: (orderId: string) => void;
}

export function HeldOrdersDialog({ open, onOpenChange, heldOrders, onResume, onDelete }: HeldOrdersDialogProps) {
  const handleDelete = (order: POSHeldOrder) => {
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Delete held order?</p>
            <p className="text-sm text-gray-600 mt-1">
              {order.customer_name || 'Walk-in customer'} - {order.items.length} item(s)
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onDelete(order.id);
              toast.success("Held order deleted");
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Held Orders</DialogTitle>
          <DialogDescription>
            Resume or delete previously held orders
          </DialogDescription>
        </DialogHeader>
        
        {heldOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No held orders</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3">
              {heldOrders.map((order) => {
                const total = order.items.reduce((sum: number, item: any) => 
                  sum + (item.quantity * item.unit_price), 0
                );
                const itemCount = order.items.length;
                
                return (
                  <div key={order.id} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-sm">
                          {order.customer_name || 'Walk-in Customer'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Held {new Date(order.held_at).toLocaleString()}
                        </div>
                        {order.notes && (
                          <div className="text-xs text-gray-600 mt-1 italic">
                            {order.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#22C55E]">
                          Rs. {total.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {itemCount} item{itemCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-3 mt-3">
                      <div className="text-xs text-gray-600 mb-2">Items:</div>
                      <div className="space-y-1 mb-3">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-gray-700">
                              {item.product_name} × {item.quantity}
                            </span>
                            <span className="text-gray-600">
                              Rs. {(item.quantity * item.unit_price).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          onResume(order);
                          onOpenChange(false);
                        }}
                        className="flex-1 bg-[#22C55E] hover:bg-[#16A34A]"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(order)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
