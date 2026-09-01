import { BarcodeScannerModal } from "@/components/pos/BarcodeScannerModal";
import { CashMovementDialog } from "@/components/pos/CashMovementDialog";
import { HeldOrdersDialog } from "@/components/pos/HeldOrdersDialog";
import { SplitPaymentDialog } from "@/components/pos/SplitPaymentDialog";
import type { Product } from "@/lib/api/inventory";
import type { POSHeldOrder, POSPaymentEntry } from "@/lib/api/pos";
import { toast } from "sonner";

interface POSCheckoutDialogsProps {
  showBarcodeScanner: boolean;
  showHeldOrders: boolean;
  showCashMovement: boolean;
  showSplitPayment: boolean;
  selectedWarehouse: string;
  heldOrders: POSHeldOrder[];
  total: number;
  onDialogChange: (dialog: string, open: boolean) => void;
  onResumeOrder: (order: POSHeldOrder) => void;
  onDeleteHeldOrder: (orderId: string) => void;
  onSplitPaymentConfirm: (payments: POSPaymentEntry[]) => void;
  onBarcodeProductScanned: (product: Product, action: "received" | "sold") => void;
}

export function POSCheckoutDialogs({
  showBarcodeScanner,
  showHeldOrders,
  showCashMovement,
  showSplitPayment,
  selectedWarehouse,
  heldOrders,
  total,
  onDialogChange,
  onResumeOrder,
  onDeleteHeldOrder,
  onSplitPaymentConfirm,
  onBarcodeProductScanned,
}: POSCheckoutDialogsProps) {
  return (
    <>
      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        open={showBarcodeScanner}
        onClose={() => onDialogChange('barcodeScanner', false)}
        warehouseId={Number(selectedWarehouse)}
        onProductScanned={onBarcodeProductScanned}
      />

      {/* Held Orders Dialog */}
      <HeldOrdersDialog 
        open={showHeldOrders} 
        onOpenChange={(open) => onDialogChange('heldOrders', open)}
        heldOrders={heldOrders}
        onResume={(order) => {
          onResumeOrder(order);
          onDialogChange('heldOrders', false);
        }}
        onDelete={onDeleteHeldOrder}
      />

      {/* Cash Movement Dialog */}
      <CashMovementDialog 
        open={showCashMovement} 
        onOpenChange={(open) => onDialogChange('cashMovement', open)}
        onSuccess={async () => {
          toast.success("Cash movement recorded");
          onDialogChange('cashMovement', false);
        }}
      />

      {/* Split Payment Dialog */}
      <SplitPaymentDialog 
        open={showSplitPayment} 
        onOpenChange={(open) => onDialogChange('splitPayment', open)}
        totalAmount={total}
        onConfirm={(paymentEntries) => {
          onSplitPaymentConfirm(paymentEntries);
          onDialogChange('splitPayment', false);
        }}
      />
    </>
  );
}
