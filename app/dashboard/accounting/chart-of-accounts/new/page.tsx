"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { accountsAPI, Account } from "@/lib/api/accounting";
import { DEFAULT_CHART_OF_ACCOUNTS } from "@/lib/accounting/default-chart";
import toast from "react-hot-toast";

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
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function NewAccountPage() {
  const router = useRouter();
  const [type, setType] = useState("Assets");
  const [subType, setSubType] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    parent: "",
    description: "",
    status: "active",
    openingBalance: "",
    openingBalanceDate: "",
    balanceType: "Debit",
    taxApplicable: "No",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsAPI.list();
      setAccounts(data);
    } catch (error: unknown) {
      console.error("Failed to fetch accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const existingCodes = useMemo(() => new Set(accounts.map((a) => a.code)), [accounts]);
  const missingCount = DEFAULT_CHART_OF_ACCOUNTS.filter((a) => !existingCodes.has(a.code)).length;

  const parentOptions = useMemo(() => {
    return accounts
      .filter((a) => a.type === type && a.status === "active")
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [accounts, type]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await accountsAPI.seedDefault();
      if (result.created > 0) {
        toast.success(result.message || `Created ${result.created} accounts`);
      } else {
        toast.success(`${result.skipped} accounts ready`);
      }
      router.push("/dashboard/accounting/chart-of-accounts?updated=1");
      router.refresh();
    } catch (error: unknown) {
      console.error("Failed to seed accounts:", error);
      const err = error as { response?: { data?: { detail?: string; message?: string } } };
      toast.error(err.response?.data?.detail || err.response?.data?.message || "Failed to create accounts");
    } finally {
      setSeeding(false);
    }
  };

  const handleTypeChange = (nextType: string) => {
    setType(nextType);
    setSubType("");
    setFormData((prev) => ({ ...prev, parent: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error("Account code is required");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Account name is required");
      return;
    }
    if (!subType) {
      toast.error("Sub type is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        code: formData.code,
        name: formData.name,
        type: type,
        sub_type: subType,
        status: formData.status,
        description: formData.description,
      };

      if (formData.parent) {
        payload.parent = formData.parent;
      }

      const openingAmount = parseFloat(formData.openingBalance);
      if (!Number.isNaN(openingAmount) && openingAmount > 0) {
        payload.opening_balance = openingAmount;
        if (formData.openingBalanceDate) {
          payload.opening_balance_date = formData.openingBalanceDate;
        }
        payload.balance_type = formData.balanceType.toLowerCase();
      }

      await accountsAPI.create(payload);
      toast.success("Account created successfully");
      router.push("/dashboard/accounting/chart-of-accounts?updated=1");
      router.refresh();
    } catch (error: unknown) {
      console.error("Failed to create account:", error);
      const err = error as { response?: { data?: Record<string, unknown> } };
      const data = err.response?.data;
      toast.error(String(data?.detail || data?.message || "Failed to create account"));
      if (data) {
        Object.keys(data).forEach((field) => {
          if (field !== "detail" && field !== "message") {
            const fieldErrors = data[field];
            const errorMsg = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
            toast.error(`${field}: ${errorMsg}`);
          }
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Add Account" subtitle="Loading..." />
        <PageLoading message="Loading form…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Add Account" subtitle="Create a new account in your chart of accounts" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          {missingCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 mb-8 rounded-lg border border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-600">
                Need a full chart? Create {missingCount} standard account{missingCount !== 1 ? "s" : ""} (Cash, Bank, AR, Inventory, VAT, Revenue, COGS, …) in one click.
              </p>
              <Button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white shrink-0"
              >
                {seeding ? "Creating…" : "Create Standard Accounts"}
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Field label="Account Code" required>
                  <Input
                    className="h-9 text-sm border-gray-200"
                    placeholder="e.g. 1140"
                    value={formData.code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                    required
                  />
                </Field>
                <Field label="Account Name" required>
                  <Input
                    className="h-9 text-sm border-gray-200"
                    placeholder="e.g. Prepaid Expenses"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Field>
                <Field label="Account Type" required>
                  <Select value={type} onValueChange={(v) => handleTypeChange(v ?? "Assets")}>
                    <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Assets", "Liabilities", "Equity", "Income", "Expense"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Sub Type" required>
                  <Select value={subType} onValueChange={(v) => setSubType(v ?? "")}>
                    <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue placeholder="Select sub type" /></SelectTrigger>
                    <SelectContent>
                      {(SUB_TYPES[type] ?? []).map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Parent Account">
                  <Select
                    value={formData.parent || "__none__"}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, parent: v === "__none__" ? "" : (v ?? "") }))
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
                  {parentOptions.length === 0 ? (
                    <p className="text-xs text-gray-500 mt-1">
                      No other {type} accounts yet. This will be a top-level account, or create a {type} account first to use as a parent.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      {parentOptions.length} {type} account{parentOptions.length !== 1 ? "s" : ""} available as parent
                    </p>
                  )}
                </Field>
                <Field label="Status">
                  <Select value={formData.status} onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v ?? "active" }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tax Applicable">
                  <Select value={formData.taxApplicable} onValueChange={(v) => setFormData((prev) => ({ ...prev, taxApplicable: v ?? "No" }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Description</h3>
              <Field label="Description">
                <textarea
                  className="w-full h-20 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]"
                  placeholder="Account description..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </Field>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Opening Balance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Field label="Opening Balance (Rs.)">
                  <Input
                    type="number"
                    className="h-9 text-sm border-gray-200"
                    placeholder="0"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData((prev) => ({ ...prev, openingBalance: e.target.value }))}
                  />
                </Field>
                <Field label="Opening Balance Date">
                  <DateInput
                    className="h-9 text-sm border-gray-200"
                    value={formData.openingBalanceDate}
                    onChange={(date) => setFormData((prev) => ({ ...prev, openingBalanceDate: date }))}
                  />
                </Field>
                <Field label="Balance Type">
                  <Select value={formData.balanceType} onValueChange={(v) => setFormData((prev) => ({ ...prev, balanceType: v ?? "Debit" }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Debit">Debit</SelectItem>
                      <SelectItem value="Credit">Credit</SelectItem>
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
                disabled={submitting || seeding}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
                disabled={submitting || seeding}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Saving...
                  </>
                ) : (
                  "Save Account"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
