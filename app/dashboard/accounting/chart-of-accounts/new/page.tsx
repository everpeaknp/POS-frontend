"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { accountsAPI, Account } from "@/lib/api/accounting";
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
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    parent: "",
    description: "",
    status: "Active",
    openingBalance: "",
    openingBalanceDate: "",
    balanceType: "Debit",
    taxApplicable: "No"
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsAPI.list();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
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
      const payload: any = {
        code: formData.code,
        name: formData.name,
        type: type,
        sub_type: subType,
        level: formData.parent ? 1 : 0,
        status: formData.status,
        description: formData.description
      };

      if (formData.parent) {
        payload.parent = formData.parent;
      }

      await accountsAPI.create(payload);
      toast.success("Account created successfully");
      router.push("/dashboard/accounting/chart-of-accounts");
    } catch (error: any) {
      console.error('Failed to create account:', error);
      const message = error.response?.data?.detail 
        || error.response?.data?.message
        || 'Failed to create account';
      toast.error(message);
      
      if (error.response?.data) {
        Object.keys(error.response.data).forEach((field) => {
          if (field !== 'detail' && field !== 'message') {
            const fieldErrors = error.response.data[field];
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full min-h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Add Account" subtitle="Create a new account in your chart of accounts" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Field label="Account Code" required>
                  <Input 
                    className="h-9 text-sm border-gray-200" 
                    placeholder="e.g. 1140" 
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    required
                  />
                </Field>
                <Field label="Account Name" required>
                  <Input 
                    className="h-9 text-sm border-gray-200" 
                    placeholder="e.g. Prepaid Expenses" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Field>
                <Field label="Account Type" required>
                  <Select value={type} onValueChange={(v) => { setType(v ?? "Assets"); setSubType(""); }}>
                    <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Assets", "Liabilities", "Equity", "Income", "Expense"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Sub Type" required>
                  <Select value={subType} onValueChange={(v) => setSubType(v ?? "")}>
                    <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue placeholder="Select sub type" /></SelectTrigger>
                    <SelectContent>
                      {(SUB_TYPES[type] ?? []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Parent Account">
                  <select 
                    className="h-9 w-full text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]"
                    value={formData.parent}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent: e.target.value }))}
                  >
                    <option value="">— None (Top Level) —</option>
                    {accounts.filter((a) => a.type === type && a.level < 2).map((a) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v ?? "Active" }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tax Applicable">
                  <Select value={formData.taxApplicable} onValueChange={(v) => setFormData(prev => ({ ...prev, taxApplicable: v ?? "No" }))}>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, openingBalance: e.target.value }))}
                  />
                </Field>
                <Field label="Opening Balance Date">
                  <Input 
                    type="date"
                    className="h-9 text-sm border-gray-200" 
                    value={formData.openingBalanceDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, openingBalanceDate: e.target.value }))}
                  />
                </Field>
                <Field label="Balance Type">
                  <Select value={formData.balanceType} onValueChange={(v) => setFormData(prev => ({ ...prev, balanceType: v ?? "Debit" }))}>
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
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Saving...
                  </>
                ) : (
                  'Save Account'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
