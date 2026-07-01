"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { DashHeader } from "@/components/dashboard/dash-header";
import { taxRulesAPI, accountsAPI, type Account } from "@/lib/api/accounting";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
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
  const [loadingAccounts, setLoadingAccounts] = useState(true);
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
    description: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const data = await accountsAPI.list({ status: "active", ordering: "code" });
      const list = Array.isArray(data) ? data : [];
      const preferred = list.filter((a) => a.type === "Liabilities" || a.type === "Assets");
      setAccounts(preferred.length > 0 ? preferred : list);
    } catch (error) {
      console.error("Failed to load accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoadingAccounts(false);
    }
  };

  const accountOptions = useMemo(
    () =>
      accounts.map((a) => ({
        value: String(a.id),
        label: `${a.code} — ${a.name}`,
        subtitle: a.type,
      })),
    [accounts]
  );

  const showApiErrors = (error: unknown) => {
    const err = error as { response?: { data?: Record<string, unknown> } };
    const data = err.response?.data;
    if (!data) {
      toast.error("Failed to create tax rule");
      return;
    }
    if (typeof data.detail === "string") {
      toast.error(data.detail);
      return;
    }
    Object.entries(data).forEach(([field, value]) => {
      const msg = Array.isArray(value) ? String(value[0]) : String(value);
      toast.error(`${field}: ${msg}`);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Tax name is required");
      return;
    }
    if (!formData.rate || parseFloat(formData.rate) < 0) {
      toast.error("Valid tax rate is required");
      return;
    }
    if (!formData.account) {
      toast.error("Linked account is required");
      return;
    }
    if (accounts.length === 0) {
      toast.error("Create a liability or asset account in Chart of Accounts first");
      return;
    }

    try {
      setLoading(true);
      await taxRulesAPI.create({
        name: formData.name.trim(),
        type: formData.type,
        rate: parseFloat(formData.rate),
        applicable_on: formData.applicable_on,
        account: Number(formData.account) || formData.account,
        status: formData.status,
        description: formData.description.trim(),
      });
      toast.success("Tax rule created successfully");
      router.push("/dashboard/accounting/tax-management");
    } catch (error: unknown) {
      console.error("Failed to create tax rule:", error);
      showApiErrors(error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingAccounts) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Add Tax Rule" subtitle="Create a new tax rule for your organization" />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full min-h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto" />
            <p className="mt-4 text-gray-600">Loading accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Add Tax Rule" subtitle="Create a new tax rule for your organization" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <form onSubmit={handleSubmit} className="space-y-8">
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
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["VAT", "TDS", "Income Tax", "Other"] as const).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Rate (%)" required>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
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
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["Sales", "Purchase", "Both"] as const).map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Linked GL Account" required>
                  {accounts.length === 0 ? (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      No accounts available. Create a liability account (e.g. VAT Payable) in Chart of Accounts.
                    </p>
                  ) : (
                    <Combobox
                      options={accountOptions}
                      value={formData.account || undefined}
                      onValueChange={(v) => setFormData({ ...formData, account: v })}
                      placeholder="Search account..."
                      searchPlaceholder="Code or name..."
                      emptyText="No account found."
                      disabled={loading}
                    />
                  )}
                </Field>
                <Field label="Status">
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Status })}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
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

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
                disabled={loading || accounts.length === 0}
              >
                {loading ? "Saving..." : "Save Tax Rule"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
