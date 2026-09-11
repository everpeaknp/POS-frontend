"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Building2, Wallet } from "lucide-react";
import { bankAccountsAPI, accountsAPI } from "@/lib/api/accounting";
import { loadBankGlAccounts } from "@/lib/accounting/bank-gl-accounts";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

type AccountTypeSelection = "bank" | "cash";
type BankAccountType = "Current" | "Savings" | "Fixed" | "Overdraft";
type Status = "active" | "inactive";

export default function NewBankAccountPage() {
  const router = useRouter();
  const [accountTypeSelection, setAccountTypeSelection] = useState<AccountTypeSelection>("bank");
  const [loading, setLoading] = useState(false);
  const [loadingGlAccounts, setLoadingGlAccounts] = useState(true);
  const [glAccounts, setGlAccounts] = useState<Awaited<ReturnType<typeof loadBankGlAccounts>>>([]);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [digitalWallets, setDigitalWallets] = useState({
    enable_esewa: false,
    enable_khalti: false,
    enable_fonepay: false,
  });
  const [formData, setFormData] = useState<{
    bank_name: string;
    account_name: string;
    account_number: string;
    type: BankAccountType;
    branch: string;
    swift_code: string;
    gl_account: string;
    balance: string;
    status: Status;
  }>({
    bank_name: "",
    account_name: "",
    account_number: "",
    type: "Current",
    branch: "",
    swift_code: "",
    gl_account: "",
    balance: "0",
    status: "active",
  });
  
  // Cash account form state
  const [cashFormData, setCashFormData] = useState({
    code: "",
    name: "",
    gl_account: "",
    balance: "0",
    status: "active" as Status,
  });

  useEffect(() => {
    fetchGLAccounts();
  }, []);

  const fetchGLAccounts = async () => {
    try {
      setLoadingGlAccounts(true);
      setGlAccounts(await loadBankGlAccounts());
    } catch (error: unknown) {
      console.error("Failed to load GL accounts:", error);
      toast.error("Failed to load GL accounts");
    } finally {
      setLoadingGlAccounts(false);
    }
  };

  const glAccountOptions = useMemo(
    () =>
      glAccounts.map((acc) => ({
        value: String(acc.id),
        label: `${acc.code} — ${acc.name}`,
        subtitle: `${acc.type} · ${acc.sub_type}`,
      })),
    [glAccounts]
  );

  const hasAssetAccounts = glAccounts.some((a) => a.type === "Assets");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (accountTypeSelection === "bank") {
      // Bank Account validation
      if (!formData.bank_name.trim()) {
        toast.error('Bank name is required');
        return;
      }
      if (!formData.account_name.trim()) {
        toast.error('Account name is required');
        return;
      }
      if (!formData.account_number.trim()) {
        toast.error('Account number is required');
        return;
      }

      try {
        setLoading(true);
        const formDataToSend = new FormData();
        formDataToSend.append('bank_name', formData.bank_name.trim());
        formDataToSend.append('account_name', formData.account_name.trim());
        formDataToSend.append('account_number', formData.account_number.trim());
        formDataToSend.append('type', formData.type);
        formDataToSend.append('balance', String(parseFloat(formData.balance) || 0));
        formDataToSend.append('status', 'active'); // Default status to active
        
        // Add QR code image if provided
        if (qrCodeFile) {
          formDataToSend.append('qr_code_image', qrCodeFile);
        }
        
        // Add digital wallet flags
        formDataToSend.append('enable_esewa', String(digitalWallets.enable_esewa));
        formDataToSend.append('enable_khalti', String(digitalWallets.enable_khalti));
        formDataToSend.append('enable_fonepay', String(digitalWallets.enable_fonepay));
        
        await bankAccountsAPI.create(formDataToSend);
        toast.success('Bank account created successfully');
        router.push('/dashboard/accounting/bank-accounts');
      } catch (error: any) {
        console.error('Failed to create bank account:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create bank account';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      // Cash Account creation
      if (!cashFormData.name.trim()) {
        toast.error('Account name is required');
        return;
      }
      if (!cashFormData.gl_account) {
        toast.error("GL account is required");
        return;
      }

      try {
        setLoading(true);
        const payload: Record<string, any> = {
          code: cashFormData.code || `CASH-${Date.now()}`,
          name: cashFormData.name,
          type: 'Assets',
          sub_type: 'Cash',
          status: cashFormData.status,
        };

        if (cashFormData.gl_account) {
          payload.parent = cashFormData.gl_account;
        }

        const openingAmount = parseFloat(cashFormData.balance);
        if (!Number.isNaN(openingAmount) && openingAmount > 0) {
          payload.opening_balance = openingAmount;
          payload.balance_type = 'debit';
        }

        await accountsAPI.create(payload);
        toast.success('Cash account created successfully');
        router.push('/dashboard/accounting/chart-of-accounts');
      } catch (error: any) {
        console.error('Failed to create cash account:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create cash account';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrCodeFile(file);
    }
  };

  return (
    <div className="flex flex-col min-h-0">
      <DashHeader title="Add Account" subtitle="Create a new bank account or cash account" />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
          {/* Account Type Selector */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">Account Type *</Label>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <button
                type="button"
                onClick={() => setAccountTypeSelection("bank")}
                disabled={loading}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  accountTypeSelection === "bank"
                    ? "border-[#22C55E] bg-green-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <Building2 className="h-5 w-5" />
                <span className="text-sm font-medium">Bank Account</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountTypeSelection("cash")}
                disabled={loading}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  accountTypeSelection === "cash"
                    ? "border-[#22C55E] bg-green-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <Wallet className="h-5 w-5" />
                <span className="text-sm font-medium">Cash Account</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bank Account Form */}
            {accountTypeSelection === "bank" && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Bank Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Bank Name" required>
                  <Input 
                    className="h-9 text-sm border-gray-200" 
                    placeholder="e.g. Nabil Bank Ltd."
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    disabled={loading}
                  />
                </Field>
                <Field label="Account Name" required>
                  <Input 
                    className="h-9 text-sm border-gray-200" 
                    placeholder="e.g. FashionNep Current A/C"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    disabled={loading}
                  />
                </Field>
                <Field label="Account Number" required>
                  <Input 
                    className="h-9 text-sm border-gray-200" 
                    placeholder="Account number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    disabled={loading}
                  />
                </Field>
                <Field label="Opening Balance (Rs.)">
                  <Input 
                    type="number" 
                    step="0.01"
                    className="h-9 text-sm border-gray-200" 
                    placeholder="0"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    disabled={loading}
                  />
                </Field>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Payment QR Code (Optional)</h3>
              <Field label="QR Code Image">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleQrCodeChange}
                  disabled={loading}
                  className="h-9 text-sm border-gray-200"
                />
              </Field>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Digital Wallet Sub-Methods (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">Enable digital wallets linked to this bank account for POS checkout</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable_esewa"
                    checked={digitalWallets.enable_esewa}
                    onCheckedChange={(checked) => setDigitalWallets({ ...digitalWallets, enable_esewa: checked as boolean })}
                    disabled={loading}
                  />
                  <label
                    htmlFor="enable_esewa"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Enable eSewa payments via this bank
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable_khalti"
                    checked={digitalWallets.enable_khalti}
                    onCheckedChange={(checked) => setDigitalWallets({ ...digitalWallets, enable_khalti: checked as boolean })}
                    disabled={loading}
                  />
                  <label
                    htmlFor="enable_khalti"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Enable Khalti payments via this bank
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable_fonepay"
                    checked={digitalWallets.enable_fonepay}
                    onCheckedChange={(checked) => setDigitalWallets({ ...digitalWallets, enable_fonepay: checked as boolean })}
                    disabled={loading}
                  />
                  <label
                    htmlFor="enable_fonepay"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Enable FonePay payments via this bank
                  </label>
                </div>
              </div>
            </div>
            </>
            )}

            {/* Cash Account Form */}
            {accountTypeSelection === "cash" && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Cash Account Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Account Name" required>
                      <Input 
                        className="h-9 text-sm border-gray-200" 
                        placeholder="e.g. Cash in Hand"
                        value={cashFormData.name}
                        onChange={(e) => setCashFormData({ ...cashFormData, name: e.target.value })}
                        disabled={loading}
                      />
                    </Field>
                    <Field label="Link to GL Account" required>
                      {loadingGlAccounts ? (
                        <p className="text-sm text-gray-500 py-2">Loading accounts...</p>
                      ) : glAccounts.length === 0 ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                          No GL accounts found.{" "}
                          <Link
                            href="/dashboard/accounting/chart-of-accounts/new"
                            className="font-medium underline text-[#22C55E]"
                          >
                            Create a Cash account
                          </Link>{" "}
                          in Chart of Accounts (type Assets, sub-type Cash).
                        </div>
                      ) : (
                        <Combobox
                          options={glAccountOptions}
                          value={cashFormData.gl_account || undefined}
                          onValueChange={(value) => setCashFormData({ ...cashFormData, gl_account: value })}
                          placeholder="Search GL account..."
                          searchPlaceholder="Code or name..."
                          emptyText="No account found."
                          disabled={loading}
                        />
                      )}
                    </Field>
                    <Field label="Opening Balance (Rs.)">
                      <Input 
                        type="number" 
                        step="0.01"
                        className="h-9 text-sm border-gray-200" 
                        placeholder="0"
                        value={cashFormData.balance}
                        onChange={(e) => setCashFormData({ ...cashFormData, balance: e.target.value })}
                        disabled={loading}
                      />
                    </Field>
                    <Field label="Status">
                      <Select 
                        value={cashFormData.status} 
                        onValueChange={(value) => setCashFormData({ ...cashFormData, status: value as Status })}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => router.back()} 
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
                disabled={loading || (accountTypeSelection === "cash" && (loadingGlAccounts || glAccounts.length === 0))}
              >
                {loading ? "Saving..." : accountTypeSelection === "bank" ? "Save Bank Account" : "Save Cash Account"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
