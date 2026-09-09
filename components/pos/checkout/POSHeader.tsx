import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Pause, Play, DollarSign } from "lucide-react";
import { useLanguage } from "@/lib/context/LanguageContext";

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
  const { t } = useLanguage();
  
  return (
    <div style={{ paddingRight: `${sidebarWidth}px` }}>
      <DashHeader 
        title={t('pos.title')}
        subtitle={t('pos.barcode_scan')}
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
                {t('pos.hold_order')}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onShowHeldOrders}
                className="gap-1 h-9"
              >
                <Play className="h-4 w-4" />
                {t('pos.held_orders')}
                {heldOrdersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
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
                {t('pos.cash_movement')}
              </Button>
            </div>
          ) : null
        }
      />
    </div>
  );
}
