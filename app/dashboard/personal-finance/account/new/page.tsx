"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { financeAccountAPI } from "@/lib/api/personal-finance";
import toast from "react-hot-toast";

type AccountType = "bank" | "cash" | "credit_card" | "loan" | "investment" | "other";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "bank", label: "Bank Account" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "loan", label: "Loan" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

const NEPALI_BANKS = [
  "Nabil Bank",
  "Nepal Investment Mega Bank",
  "NIC Asia Bank",
  "Global IME Bank",
  "Himalayan Bank",
  "Standard Chartered Nepal",
  "Everest Bank",
  "Prime Commercial Bank",
  "Sanima Bank",
  "Kumari Bank",
  "Machhapuchchhre Bank",
  "Siddhartha Bank",
  "Nepal Bank Limited",
  "Rastriya Banijya Bank",
  "Agricultural Development Bank",
  "Citizens Bank International",
  "NMB Bank",
  "Prabhu Bank",
  "Laxmi Sunrise Bank",
];

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
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "bank" as AccountType,
    bankName: "",
    accountNumber: "",
    balance: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Account name is required");
      return;
    }
    if (formData.type === "bank" && !formData.bankName) {
      toast.error("Bank name is required for bank accounts");
      return;
    }

    setSubmitting(true);
    try {
      // Build account name with bank name for bank accounts
      const accountName = formData.type === "bank" && formData.bankName
        ? `${formData.bankName} - ${formData.name}`
        : formData.name;

      // Build description with account number if provided
      const description = formData.type === "bank" && formData.accountNumber
        ? `Account Number: ${formData.accountNumber}\n${formData.description}`.trim()
        : formData.description;

      await financeAccountAPI.create({
        name: accountName,
        type: formData.type,
        opening_balance: formData.balance,
        description: description,
      });
      
      toast.success("Account created successfully");
      router.push("/dashboard/personal-finance/account");
      router.refresh();
    } catch (error: unknown) {
      console.error("Failed to create account:", error);
      toast.error("Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Add Account" subtitle="Create a new financial account" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Field label="Account Type" required>
                  <Select value={formData.type} onValueChange={(v: AccountType) => setFormData((prev) => ({ ...prev, type: v }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {formData.type === "bank" && (
                  <Field label="Bank Name" required>
                    <Select value={formData.bankName} onValueChange={(v) => setFormData((prev) => ({ ...prev, bankName: v }))}>
                      <SelectTrigger className="h-9 text-sm border-gray-200">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {NEPALI_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                <Field label="Account Name" required>
                  <Input
                    className="h-9 text-sm border-gray-200"
                    placeholder="e.g., My Checking Account"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Field>

                {formData.type === "bank" && (
                  <Field label="Account Number">
                    <Input
                      className="h-9 text-sm border-gray-200"
                      placeholder="e.g., 01234567890123"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    />
                  </Field>
                )}

                <Field label="Opening Balance (Rs.)" required>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-9 text-sm border-gray-200"
                    placeholder="0.00"
                    value={formData.balance}
                    onChange={(e) => setFormData((prev) => ({ ...prev, balance: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For liabilities (credit cards, loans), enter as negative
                  </p>
                </Field>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Description</h3>
              <Field label="Description">
                <textarea
                  className="w-full h-20 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]"
                  placeholder="Optional description for this account..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </Field>
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
                {submitting ? "Saving..." : "Save Account"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
