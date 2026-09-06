import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

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
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="customer-name"
              type="text"
              value={customerName}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="Customer name"
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
              Phone <span className="text-red-500">*</span>
            </label>
            <Input
              id="customer-phone"
              type="text"
              value={customerPhone}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              placeholder="Phone number"
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
              Email
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
              Address
            </label>
            <Input
              id="customer-address"
              type="text"
              value={customerAddress}
              onChange={(e) => onFieldChange('address', e.target.value)}
              placeholder="Customer address"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="customer-type" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <Select
              value={customerType}
              onValueChange={(v) => onFieldChange('type', v)}
            >
              <SelectTrigger id="customer-type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onAddCustomer}
              disabled={!customerName.trim() || !customerPhone.trim()}
              className="flex-1 bg-[var(--color-accent-custom-600,#16a34a)] hover:bg-[var(--color-accent-custom-700,#15803d)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Customer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
