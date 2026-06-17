"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { bankAccountsAPI, accountsAPI, type Account } from "@/lib/api/accounting";

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
type Status = "active" | "inactive";

export default function NewBankAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [glAccounts, setGlAccounts] = useState<Account[]>([]);
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
      const data = await accountsAPI.list({ type: 'Assets', sub_type: 'Bank', status: 'active' });
      const accountsData = Array.isArray(data) ? data : (data as any).results || [];
      setGlAccounts(accountsData);
    } catch (error: any) {
      console.error('Failed to load GL accounts:', error);
      toast.error('Failed to load GL accounts');
    }
  };

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
      toast.error('GL account is required');
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
        gl_account: formData.gl_account,
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
                  <Select 
                    value={formData.bank_name} 
                    onValueChange={(value) => setFormData({ ...formData, bank_name: value || "" })}
                    disabled={loading}
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
                  <Select 
                    value={formData.gl_account} 
                    onValueChange={(value) => setFormData({ ...formData, gl_account: value || "" })}
                    disabled={loading}
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
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Bank Account'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
