"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { bankAccountsAPI, accountsAPI, type BankAccount, type Account } from "@/lib/api/accounting";

const BANKS = ["Nepal Bank Ltd.", "NIC Asia Bank", "Everest Bank", "Standard Chartered", "Himalayan Bank", "Nabil Bank", "Rastriya Banijya Bank", "Kumari Bank", "Laxmi Bank", "Other"];

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
  const [glAccounts, setGlAccounts] = useState<Account[]>([]);
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
    status: "active",
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch GL accounts
      const glData = await accountsAPI.list({ type: 'Assets', sub_type: 'Bank', status: 'active' });
      const accountsData = Array.isArray(glData) ? glData : (glData as any).results || [];
      setGlAccounts(accountsData);

      // Fetch bank account details
      const accountData = await bankAccountsAPI.get(id);
      setFormData({
        bank_name: accountData.bank_name,
        account_name: accountData.account_name,
        account_number: accountData.account_number,
        type: accountData.type as AccountType,
        branch: accountData.branch || "",
        swift_code: accountData.swift_code || "",
        gl_account: accountData.gl_account,
        status: accountData.status as Status,
      });
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
        gl_account: formData.gl_account,
        status: formData.status,
      });
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

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Edit Bank Account" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#22C55E] mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading account details...</p>
          </div>
        </div>
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
                <Select 
                  value={formData.bank_name} 
                  onValueChange={(value) => setFormData({ ...formData, bank_name: value || "" })}
                  disabled={saving}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
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
              <Select 
                value={formData.gl_account} 
                onValueChange={(value) => setFormData({ ...formData, gl_account: value || "" })}
                disabled={saving}
              >
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue placeholder="Select GL account" />
                </SelectTrigger>
                <SelectContent>
                  {glAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={saving}
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
