"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { accountsAPI, type Account } from "@/lib/api/accounting";

const SUB_TYPES: Record<string, string[]> = {
  Assets: ["Cash", "Bank", "Receivable", "Current Asset", "Fixed Asset", "Other Asset"],
  Liabilities: ["Payable", "Tax", "Current Liability", "Long-term Liability"],
  Equity: ["Capital", "Retained Earnings", "Drawing"],
  Income: ["Revenue", "Other Income"],
  Expense: ["COGS", "Operating", "Administrative", "Other Expense"],
};

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

export default function EditAccountPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "Assets" as Account["type"],
    sub_type: "",
    parent: "",
    description: "",
    status: "active" as Account["status"],
  });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const [account, allAccounts] = await Promise.all([
          accountsAPI.get(id),
          accountsAPI.list(),
        ]);
        setAccounts(Array.isArray(allAccounts) ? allAccounts : []);
        setFormData({
          code: account.code,
          name: account.name,
          type: account.type,
          sub_type: account.sub_type,
          parent: account.parent ?? "",
          description: account.description ?? "",
          status: account.status,
        });
      } catch (error) {
        console.error("Failed to load account:", error);
        toast.error("Failed to load account");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const parentOptions = useMemo(() => {
    return accounts
      .filter((a) => a.type === formData.type && a.status === "active" && a.id !== id)
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [accounts, formData.type, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || !formData.sub_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Account> = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        type: formData.type,
        sub_type: formData.sub_type,
        status: formData.status,
        description: formData.description,
      };
      if (formData.parent) {
        payload.parent = formData.parent;
      } else {
        payload.parent = undefined;
      }
      await accountsAPI.update(id, payload);
      toast.success("Account updated successfully");
      router.push(`/dashboard/accounting/chart-of-accounts/${id}`);
    } catch (error: unknown) {
      console.error("Failed to update account:", error);
      const err = error as { response?: { data?: Record<string, unknown> } };
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Failed to update account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete account "${formData.code} — ${formData.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await accountsAPI.delete(id);
      toast.success("Account deleted");
      router.push("/dashboard/accounting/chart-of-accounts");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string; error?: string } } };
      const message = err.response?.data?.detail || err.response?.data?.error || "Failed to delete account";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Edit Account" subtitle="Loading..." />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full min-h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto" />
            <p className="mt-4 text-gray-600">Loading account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={`Edit ${formData.code}`} subtitle={formData.name} />
      <div className="flex-1 overflow-y-auto p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full space-y-8"
        >
          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Account Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Field label="Account Code" required>
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={formData.code}
                  onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Account Name" required>
                <Input
                  className="h-9 text-sm border-gray-200"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Account Type" required>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData((p) => ({
                      ...p,
                      type: (v ?? "Assets") as Account["type"],
                      sub_type: "",
                      parent: "",
                    }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Assets", "Liabilities", "Equity", "Income", "Expense"] as const).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Sub Type" required>
                <Select
                  value={formData.sub_type}
                  onValueChange={(v) => setFormData((p) => ({ ...p, sub_type: v ?? "" }))}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder="Select sub type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(SUB_TYPES[formData.type] ?? []).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Parent Account">
                <Select
                  value={formData.parent || "__none__"}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, parent: v === "__none__" ? "" : (v ?? "") }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200 w-full">
                    <SelectValue placeholder="None (top level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None (Top Level) —</SelectItem>
                    {parentOptions.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.code} — {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData((p) => ({ ...p, status: (v ?? "active") as Account["status"] }))}
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
            {parentOptions.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">
                No other {formData.type} accounts available as parent.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Description</h3>
            <Field label="Description">
              <textarea
                className="w-full h-20 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]"
                placeholder="Account description..."
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
            </Field>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="gap-1.5 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleting || submitting}
            >
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
            <div className="flex-1" />
            <Button
              type="submit"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Update Account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}