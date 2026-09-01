import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Pause, Play, DollarSign } from "lucide-react";

interface POSHeaderProps {
  sidebarWidth: number;
  hasOpenSession: boolean;
  hasCartItems: boolean;
  heldOrdersCount: number;
  onHoldOrder: () => void;
  onShowHeldOrders: () => void;
  onShowCashMovement: () => void;
}

export function POSHeader({
  sidebarWidth,
  hasOpenSession,
  hasCartItems,
  heldOrdersCount,
  onHoldOrder,
  onShowHeldOrders,
  onShowCashMovement,
}: POSHeaderProps) {
  return (
    <div style={{ paddingRight: `${sidebarWidth}px` }}>
      <DashHeader 
        title="Point of Sale" 
        subtitle="Scan or search products to add to cart"
        actions={
          hasOpenSession && hasCartItems ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onHoldOrder}
                className="gap-1 h-9"
              >
                <Pause className="h-4 w-4" />
                Hold Order
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onShowHeldOrders}
                className="gap-1 h-9"
              >
                <Play className="h-4 w-4" />
                Held Orders
                {heldOrdersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {heldOrdersCount}
                  </span>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onShowCashMovement}
                className="gap-1 h-9"
              >
                <DollarSign className="h-4 w-4" />
                Cash In/Out
              </Button>
            </div>
          ) : null
        }
      />
    </div>
  );
}
