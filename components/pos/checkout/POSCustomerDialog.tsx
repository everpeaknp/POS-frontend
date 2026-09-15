import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useLanguage } from "@/lib/context/LanguageContext";

interface POSCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerType: "Individual" | "Business";
  onFieldChange: (field: 'name' | 'phone' | 'email' | 'address' | 'type', value: string) => void;
  onAddCustomer: () => void;
  cameFromCheckout: boolean;
  onReturnToCheckout?: () => void;
}

export function POSCustomerDialog({
  open,
  onOpenChange,
  customerName,
  customerPhone,
  customerEmail,
  customerAddress,
  customerType,
  onFieldChange,
  onAddCustomer,
  cameFromCheckout,
  onReturnToCheckout,
}: POSCustomerDialogProps) {
  const { t } = useLanguage();
  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen && cameFromCheckout && onReturnToCheckout) {
      onReturnToCheckout();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('pos.add_customer')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700">
              {t('pos.customer_name')} <span className="text-red-500">*</span>
            </label>
            <Input
              id="customer-name"
              type="text"
              value={customerName}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder={t('pos.customer_name')}
              className="h-9"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customerName.trim() && customerPhone.trim()) {
                  onAddCustomer();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="customer-phone" className="block text-sm font-medium text-gray-700">
              {t('pos.customer_phone')} <span className="text-red-500">*</span>
            </label>
            <Input
              id="customer-phone"
              type="text"
              value={customerPhone}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              placeholder={t('pos.customer_phone')}
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customerName.trim() && customerPhone.trim()) {
                  onAddCustomer();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700">
              {t('pos.customer_email')}
            </label>
            <Input
              id="customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => onFieldChange('email', e.target.value)}
              placeholder="email@example.com"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="customer-address" className="block text-sm font-medium text-gray-700">
              {t('pos.customer_address')}
            </label>
            <Input
              id="customer-address"
              type="text"
              value={customerAddress}
              onChange={(e) => onFieldChange('address', e.target.value)}
              placeholder={t('pos.customer_address')}
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="customer-type" className="block text-sm font-medium text-gray-700">
              {t('pos.customer_type')}
            </label>
            <Select
              value={customerType}
              onValueChange={(v) => onFieldChange('type', v)}
            >
              <SelectTrigger id="customer-type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Individual">{t('pos.individual')}</SelectItem>
                <SelectItem value="Business">{t('pos.business')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={onAddCustomer}
              disabled={!customerName.trim() || !customerPhone.trim()}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('pos.add_customer')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
