"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    <div className="flex flex-col min-h-0">
      <DashHeader title="Add Tax Rule" subtitle="Create a new tax rule for your organization" />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Tax Rule Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Field label="Tax Name" required>
                  <Input 
                    className="h-9 text-sm border-gray-200" 
                    placeholder="e.g. VAT 13%" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={loading}
                  />
                </Field>
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

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Description</h3>
              <Field label="Description">
                <Textarea 
                  className="text-sm border-gray-200 min-h-[80px]" 
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                />
              </Field>
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
                {loading ? 'Saving...' : 'Save Tax Rule'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
