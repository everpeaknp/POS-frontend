"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DashHeader } from "@/components/dashboard/dash-header";
import { taxRulesAPI, accountsAPI, type Account } from "@/lib/api/accounting";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

type TaxType = "VAT" | "TDS" | "Income Tax" | "Other";
type ApplicableOn = "Sales" | "Purchase" | "Both";
type Status = "active" | "inactive";

export default function NewTaxRulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<{
    name: string;
    type: TaxType;
    rate: string;
    applicable_on: ApplicableOn;
    account: string;
    status: Status;
    description: string;
  }>({
    name: "",
    type: "VAT",
    rate: "",
    applicable_on: "Both",
    account: "",
    status: "active",
    description: ""
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await accountsAPI.list({ type: 'Liabilities', status: 'active' });
      const accountsData = Array.isArray(data) ? data : (data as any).results || [];
      setAccounts(accountsData);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      toast.error('Failed to load accounts');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Tax name is required');
      return;
    }
    if (!formData.rate || parseFloat(formData.rate) < 0) {
      toast.error('Valid tax rate is required');
      return;
    }
    if (!formData.account) {
      toast.error('Linked account is required');
      return;
    }

    try {
      setLoading(true);
      await taxRulesAPI.create({
        name: formData.name.trim(),
        type: formData.type,
        rate: parseFloat(formData.rate),
        applicable_on: formData.applicable_on,
        account: formData.account,
        status: formData.status,
        description: formData.description.trim()
      });
      toast.success('Tax rule created successfully');
      router.push('/dashboard/accounting/tax-management');
    } catch (error: any) {
      console.error('Failed to create tax rule:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create tax rule';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Add Tax Rule" subtitle="Create a new tax rule" />
      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-lg">
            <Field label="Tax Name" required>
              <Input 
                className="h-9 text-sm border-gray-200" 
                placeholder="e.g. VAT 13%" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tax Type" required>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value as TaxType })}
                  disabled={loading}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["VAT", "TDS", "Income Tax", "Other"] as const).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Rate (%)" required>
                <Input 
                  type="number" 
                  step="0.01"
                  className="h-9 text-sm border-gray-200" 
                  placeholder="13" 
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  disabled={loading}
                />
              </Field>
            </div>
            <Field label="Applicable On" required>
              <Select 
                value={formData.applicable_on} 
                onValueChange={(value) => setFormData({ ...formData, applicable_on: value as ApplicableOn })}
                disabled={loading}
              >
                <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Sales", "Purchase", "Both"] as const).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Linked Account" required>
              <Select 
                value={formData.account} 
                onValueChange={(value) => setFormData({ ...formData, account: value || "" })}
                disabled={loading}
              >
                <SelectTrigger className="h-9 text-sm border-gray-200">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Description">
              <Textarea 
                className="text-sm border-gray-200 min-h-[80px]" 
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
              />
            </Field>
            <Field label="Status">
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value as Status })}
                disabled={loading}
              >
                <SelectTrigger className="h-9 text-sm border-gray-200 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Button 
                type="button"
                variant="ghost" 
                onClick={() => router.back()} 
                className="gap-1.5 text-gray-500"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4" /> Cancel
              </Button>
              <div className="flex-1" />
              <Button 
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Tax Rule'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
