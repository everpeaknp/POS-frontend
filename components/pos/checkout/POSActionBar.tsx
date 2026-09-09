import { Button } from "@/components/ui/button";
import { Pause, Play, DollarSign } from "lucide-react";
import type { POSHeldOrder, POSPaymentEntry } from "@/lib/api/pos";
import { useLanguage } from "@/lib/context/LanguageContext";

interface CartItem {
  product: any;
  quantity: number;
}

interface POSActionBarProps {
  show: boolean;
  cart: CartItem[];
  heldOrdersCount: number;
  splitPaymentMode: boolean;
  payments: POSPaymentEntry[];
  onHoldOrder: () => void;
  onShowHeldOrders: () => void;
  onShowCashMovement: () => void;
  onToggleSplitPayment: () => void;
}

export function POSActionBar({
  show,
  cart,
  heldOrdersCount,
  splitPaymentMode,
  payments,
  onHoldOrder,
  onShowHeldOrders,
  onShowCashMovement,
  onToggleSplitPayment,
}: POSActionBarProps) {
  const { t } = useLanguage();
  
  if (!show || cart.length === 0) return null;

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="p-3 max-w-7xl mx-auto flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onHoldOrder}
          className="gap-1"
        >
          <Pause className="h-4 w-4" />
          {t('pos.hold_order')}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onShowHeldOrders}
          className="gap-1"
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
          className="gap-1"
        >
          <DollarSign className="h-4 w-4" />
          {t('pos.cash_in_out')}
        </Button>
        
        <Button
          size="sm"
          variant={splitPaymentMode ? "default" : "outline"}
          onClick={onToggleSplitPayment}
          className={`gap-1 ${splitPaymentMode ? 'bg-[#4A5D7A] hover:bg-[#2E3E52]' : ''}`}
        >
          {t('pos.split_payment')}
          {splitPaymentMode && payments.length > 0 && (
            <span className="ml-1">({payments.length})</span>
          )}
        </Button>
      </div>
    </div>
  );
}
