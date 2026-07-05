"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { DashHeader } from "@/components/dashboard/dash-header";
import { taxRulesAPI, accountsAPI, type Account, type TaxRule } from "@/lib/api/accounting";

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

type TaxType = TaxRule["type"];
type ApplicableOn = TaxRule["applicable_on"];
type Status = TaxRule["status"];

export default function EditTaxRulePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "VAT" as TaxType,
    rate: "",
    applicable_on: "Both" as ApplicableOn,
    account: "",
    status: "active" as Status,
    description: "",
  });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const [tax, accountList] = await Promise.all([
          taxRulesAPI.get(id),
          accountsAPI.list({ status: "active", ordering: "code" }),
        ]);
        const list = Array.isArray(accountList) ? accountList : [];
        const preferred = list.filter((a) => a.type === "Liabilities" || a.type === "Assets");
        setAccounts(preferred.length > 0 ? preferred : list);
        setFormData({
          name: tax.name,
          type: tax.type,
          rate: String(tax.rate),
          applicable_on: tax.applicable_on,
          account: String(tax.account),
          status: tax.status,
          description: tax.description ?? "",
        });
      } catch (error) {
        console.error("Failed to load tax rule:", error);
        toast.error("Failed to load tax rule");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setSubmitting(true);
    try {
      await taxRulesAPI.update(id, {
        name: formData.name.trim(),
        type: formData.type,
        rate: parseFloat(formData.rate),
        applicable_on: formData.applicable_on,
        account: String(formData.account),
        status: formData.status,
        description: formData.description.trim(),
      });
      toast.success("Tax rule updated successfully");
      router.push("/dashboard/accounting/tax-management");
    } catch (error: unknown) {
      console.error("Failed to update tax rule:", error);
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update tax rule");
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Edit Tax Rule" subtitle="Loading..." />
        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={`Edit ${formData.name}`} subtitle="Update tax rule" />
      <div className="flex-1 overflow-y-auto p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full space-y-6"
        >
          <Field label="Tax Name" required>
            <Input
              className="h-9 text-sm border-gray-200"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              disabled={submitting}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tax Type" required>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData((p) => ({ ...p, type: (v ?? "VAT") as TaxType }))}
                disabled={submitting}
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
                className="h-9 text-sm border-gray-200"
                value={formData.rate}
                onChange={(e) => setFormData((p) => ({ ...p, rate: e.target.value }))}
                disabled={submitting}
              />
            </Field>
          </div>
          <Field label="Applicable On" required>
            <Select
              value={formData.applicable_on}
              onValueChange={(v) => setFormData((p) => ({ ...p, applicable_on: (v ?? "Both") as ApplicableOn }))}
              disabled={submitting}
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
            <Combobox
              options={accountOptions}
              value={formData.account || undefined}
              onValueChange={(v) => setFormData((p) => ({ ...p, account: v }))}
              placeholder="Search account..."
              searchPlaceholder="Code or name..."
              emptyText="No account found."
              disabled={submitting}
            />
          </Field>
          <Field label="Status">
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData((p) => ({ ...p, status: (v ?? "active") as Status }))}
              disabled={submitting}
            >
              <SelectTrigger className="h-9 text-sm border-gray-200 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description">
            <Textarea
              className="text-sm border-gray-200 min-h-[80px]"
              placeholder="Optional description"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              disabled={submitting}
            />
          </Field>
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Update Tax Rule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
