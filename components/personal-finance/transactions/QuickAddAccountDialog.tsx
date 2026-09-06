import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Wallet, CreditCard, Banknote, TrendingUp } from "lucide-react";

const NEPALI_BANKS = [
  "Nabil Bank",
  "Nepal Investment Mega Bank",
  "NIC Asia Bank",
  "Global IME Bank",
  "Himalayan Bank",
  "Standard Chartered Nepal",
  "Everest Bank",
  "Prime Commercial Bank",
  "Sanima Bank",
  "Kumari Bank",
  "Machhapuchchhre Bank",
  "Siddhartha Bank",
  "Nepal Bank Limited",
  "Rastriya Banijya Bank",
  "Agricultural Development Bank",
  "Citizens Bank International",
  "NMB Bank",
  "Prabhu Bank",
  "Laxmi Sunrise Bank",
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: "bank", label: "Bank Account", icon: Building2 },
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "loan", label: "Loan", icon: Banknote },
  { value: "investment", label: "Investment", icon: TrendingUp },
] as const;

interface QuickAddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    name?: string;
    type?: "bank" | "cash" | "credit_card" | "loan" | "investment";
    balance?: string;
    description?: string;
    bankName?: string;
    accountNumber?: string;
  };
  onFormDataChange: (data: Partial<QuickAddAccountDialogProps["formData"]>) => void;
  onAdd: () => void;
}

export function QuickAddAccountDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onAdd,
}: QuickAddAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>
              Account Type <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {ACCOUNT_TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = formData.type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onFormDataChange({ type: option.value })}
                    className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-lg border text-xs font-medium transition-all ${
                      active
                        ? "border-[var(--color-accent-custom,#22C55E)] bg-green-50 text-[#16A34A]"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-center leading-tight px-1">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bank Name - only show for bank accounts */}
          {formData.type === "bank" && (
            <div>
              <Label>
                Bank Name <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.bankName || ""}
                onValueChange={(value) => onFormDataChange({ bankName: value ?? "" })}
              >
                <SelectTrigger className="mt-1 focus-visible:ring-0 focus-visible:border-input">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {NEPALI_BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>
              Account Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => onFormDataChange({ name: e.target.value })}
              placeholder="e.g., My Checking Account, Main Credit Card"
              className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              autoFocus={formData.type !== "bank"}
            />
          </div>

          {/* Account Number - only show for bank accounts */}
          {formData.type === "bank" && (
            <div>
              <Label>Account Number</Label>
              <Input
                value={formData.accountNumber}
                onChange={(e) => onFormDataChange({ accountNumber: e.target.value })}
                placeholder="e.g., 01234567890123"
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional. Only last 4 digits will be displayed in the list.
              </p>
            </div>
          )}

          <div>
            <Label>
              Current Balance <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                Rs.
              </span>
              <Input
                type="number"
                step="0.01"
                value={formData.balance || "0"}
                onChange={(e) => onFormDataChange({ balance: e.target.value })}
                placeholder="0.00"
                className="pl-9 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              For liabilities (credit cards, loans), enter as negative number (e.g., -25000)
            </p>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
              placeholder="Optional description"
              className="mt-1 focus-visible:ring-0 focus-visible:border-input"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={onAdd} className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90">
            Add Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
