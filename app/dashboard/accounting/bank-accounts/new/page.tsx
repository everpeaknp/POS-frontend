"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { DashHeader } from "@/components/dashboard/dash-header";
import { BankNameCombobox } from "@/components/accounting/BankNameCombobox";
import { bankAccountsAPI } from "@/lib/api/accounting";
import { loadBankGlAccounts } from "@/lib/accounting/bank-gl-accounts";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

type AccountType = "Current" | "Savings" | "Fixed" | "Overdraft";
type Status = "active" | "inactive";

export default function NewBankAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingGlAccounts, setLoadingGlAccounts] = useState(true);
  const [glAccounts, setGlAccounts] = useState<Awaited<ReturnType<typeof loadBankGlAccounts>>>([]);
  const [formData, setFormData] = useState<{
    bank_name: string;
    account_name: string;
    account_number: string;
    type: AccountType;
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
    if (!formData.gl_account) {
      toast.error("GL account is required");
      return;
    }
    if (glAccounts.length === 0) {
      toast.error("Create a Bank or Cash account in Chart of Accounts first");
      return;
    }

    try {
      setLoading(true);
      await bankAccountsAPI.create({
        bank_name: formData.bank_name.trim(),
        account_name: formData.account_name.trim(),
        account_number: formData.account_number.trim(),
        type: formData.type,
        branch: formData.branch.trim(),
        swift_code: formData.swift_code.trim(),
        gl_account: String(formData.gl_account),
        balance: parseFloat(formData.balance) || 0,
        status: formData.status,
      });
      toast.success('Bank account created successfully');
      router.push('/dashboard/accounting/bank-accounts');
    } catch (error: any) {
      console.error('Failed to create bank account:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create bank account';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-0">
      <DashHeader title="Add Bank Account" subtitle="Link a new bank account to your organization" />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Bank Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Field label="Bank Name" required>
                  <BankNameCombobox
                    value={formData.bank_name}
                    onChange={(bank_name) => setFormData({ ...formData, bank_name })}
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
                <Field label="Account Type" required>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value as AccountType })}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["Current", "Savings", "Overdraft", "Fixed"] as const).map((t) => <SelectItem key={t} value={t}>{t === "Fixed" ? "Fixed Deposit" : t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Branch Name">
                  <Input 
                    className="h-9 text-sm border-gray-200" 
                    placeholder="e.g. Thamel, Kathmandu"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    disabled={loading}
                  />
                </Field>
                <Field label="SWIFT Code">
                  <Input 
                    className="h-9 text-sm border-gray-200" 
                    placeholder="e.g. NEBLNPKA"
                    value={formData.swift_code}
                    onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
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
                        Create a Bank account
                      </Link>{" "}
                      in Chart of Accounts (type Assets, sub-type Bank).
                    </div>
                  ) : (
                    <>
                      <Combobox
                        options={glAccountOptions}
                        value={formData.gl_account || undefined}
                        onValueChange={(value) => setFormData({ ...formData, gl_account: value })}
                        placeholder="Search GL account..."
                        searchPlaceholder="Code or name..."
                        emptyText="No account found."
                        disabled={loading}
                      />
                      {!hasAssetAccounts && (
                        <p className="text-xs text-amber-600 mt-1">
                          No Asset accounts yet — showing all active accounts. Prefer creating a Bank account under Assets.
                        </p>
                      )}
                    </>
                  )}
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
                <Field label="Status">
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value as Status })}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

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
                disabled={loading || loadingGlAccounts || glAccounts.length === 0}
              >
                {loading ? "Saving..." : "Save Bank Account"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
