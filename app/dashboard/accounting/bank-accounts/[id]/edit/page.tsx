"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
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
type Status = "active" | "inactive" | "closed";

export default function EditBankAccountPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glAccounts, setGlAccounts] = useState<Awaited<ReturnType<typeof loadBankGlAccounts>>>([]);
  const [formData, setFormData] = useState<{
    bank_name: string;
    account_name: string;
    account_number: string;
    type: AccountType;
    branch: string;
    swift_code: string;
    gl_account: string;
    status: Status;
  }>({
    bank_name: "",
    account_name: "",
    account_number: "",
    type: "Current",
    branch: "",
    swift_code: "",
    gl_account: "",
    status: "active" });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const glData = await loadBankGlAccounts();
      setGlAccounts(glData);

      const accountData = await bankAccountsAPI.get(id);
      setFormData({
        bank_name: accountData.bank_name,
        account_name: accountData.account_name,
        account_number: accountData.account_number,
        type: accountData.type as AccountType,
        branch: accountData.branch || "",
        swift_code: accountData.swift_code || "",
        gl_account: String(accountData.gl_account),
        status: accountData.status as Status });
    } catch (error: any) {
      console.error('Failed to load data:', error);
      if (error.response?.status === 404) {
        setError('Bank account not found');
      } else {
        setError('Failed to load bank account details');
      }
      toast.error('Failed to load bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
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
      toast.error('GL account is required');
      return;
    }

    try {
      setSaving(true);
      await bankAccountsAPI.update(id, {
        bank_name: formData.bank_name.trim(),
        account_name: formData.account_name.trim(),
        account_number: formData.account_number.trim(),
        type: formData.type,
        branch: formData.branch.trim(),
        swift_code: formData.swift_code.trim(),
        gl_account: String(formData.gl_account),
        status: formData.status });
      toast.success('Bank account updated successfully');
      router.push(`/dashboard/accounting/bank-accounts/${id}`);
    } catch (error: any) {
      console.error('Failed to update bank account:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update bank account';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const glAccountOptions = useMemo(
    () =>
      glAccounts.map((acc) => ({
        value: String(acc.id),
        label: `${acc.code} — ${acc.name}`,
        subtitle: `${acc.type} · ${acc.sub_type}` })),
    [glAccounts]
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Edit Bank Account" subtitle="Loading..." />
        <PageLoading message="Loading account details…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Edit Bank Account" subtitle="Error" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/dashboard/accounting/bank-accounts')} size="sm" className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
              Back to Bank Accounts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Edit Bank Account" subtitle="Update bank account details" />
      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bank Name" required>
                <BankNameCombobox
                  value={formData.bank_name}
                  onChange={(bank_name) => setFormData({ ...formData, bank_name })}
                  disabled={saving}
                />
              </Field>
              <Field label="Account Name" required>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="e.g. FashionNep Current A/C"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  disabled={saving}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Account Number" required>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Account number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  disabled={saving}
                />
              </Field>
              <Field label="Account Type" required>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value as AccountType })}
                  disabled={saving}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Current", "Savings", "Overdraft", "Fixed"] as const).map((t) => <SelectItem key={t} value={t}>{t === "Fixed" ? "Fixed Deposit" : t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Branch Name">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="e.g. Thamel, Kathmandu"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  disabled={saving}
                />
              </Field>
              <Field label="SWIFT Code">
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="e.g. NEBLNPKA"
                  value={formData.swift_code}
                  onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                  disabled={saving}
                />
              </Field>
            </div>
            <Field label="Link to GL Account" required>
              {glAccounts.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  No GL accounts found.{" "}
                  <Link href="/dashboard/accounting/chart-of-accounts/new" className="font-medium underline text-[#22C55E]">
                    Create a Bank account
                  </Link>{" "}
                  in Chart of Accounts.
                </div>
              ) : (
                <Combobox
                  options={glAccountOptions}
                  value={formData.gl_account || undefined}
                  onValueChange={(value) => setFormData({ ...formData, gl_account: value })}
                  placeholder="Search GL account..."
                  searchPlaceholder="Code or name..."
                  emptyText="No account found."
                  disabled={saving}
                />
              )}
            </Field>
            <Field label="Status" required>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value as Status })}
                disabled={saving}
              >
                <SelectTrigger className="h-9 text-sm border-gray-200 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Button 
                type="button"
                variant="ghost" 
                onClick={() => router.back()} 
                className="gap-1.5 text-gray-500"
                disabled={saving}
              >
                <ArrowLeft className="h-4 w-4" /> Cancel
              </Button>
              <div className="flex-1" />
              <Button 
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
                disabled={saving || glAccounts.length === 0}
              >
                {saving ? 'Saving...' : 'Update Bank Account'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
