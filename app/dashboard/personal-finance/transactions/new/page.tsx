"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { todayIsoDate } from "@/lib/dates";
import toast from "react-hot-toast";

// Mock categories (matches transactions page)
const MOCK_CATEGORIES = [
  // Income categories
  { id: "cat_1", name: "Salary", type: "income" },
  { id: "cat_2", name: "Freelance", type: "income" },
  { id: "cat_3", name: "Investment Returns", type: "income" },
  { id: "cat_4", name: "Other Income", type: "income" },
  // Expense categories
  { id: "cat_5", name: "Groceries", type: "expense" },
  { id: "cat_6", name: "Rent", type: "expense" },
  { id: "cat_7", name: "Utilities", type: "expense" },
  { id: "cat_8", name: "Dining", type: "expense" },
  { id: "cat_9", name: "Entertainment", type: "expense" },
  { id: "cat_10", name: "Transportation", type: "expense" },
  { id: "cat_11", name: "Health", type: "expense" },
  { id: "cat_12", name: "Shopping", type: "expense" },
  { id: "cat_13", name: "Education", type: "expense" },
  { id: "cat_14", name: "Other Expenses", type: "expense" },
];

// Mock accounts (matches transactions page)
const MOCK_ACCOUNTS = [
  { id: "acc_1", name: "Checking Account", type: "bank" },
  { id: "acc_2", name: "Savings Account", type: "bank" },
  { id: "acc_3", name: "Cash Wallet", type: "cash" },
  { id: "acc_4", name: "Credit Card", type: "credit_card" },
  { id: "acc_5", name: "Investment Account", type: "investment" },
  { id: "acc_6", name: "Personal Loan", type: "loan" },
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function NewTransactionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: todayIsoDate(),
    type: "expense",
    amount: "",
    categoryId: "",
    accountId: "",
    description: "",
  });

  // Filter categories based on selected type
  const availableCategories = MOCK_CATEGORIES.filter(
    (cat) => cat.type === formData.type
  );

  const handleTypeChange = (nextType: string) => {
    setFormData((prev) => ({ ...prev, type: nextType, categoryId: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date) {
      toast.error("Date is required");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!formData.categoryId) {
      toast.error("Category is required");
      return;
    }
    if (!formData.accountId) {
      toast.error("Account is required");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Replace with actual API call when backend is ready
      // await transactionAPI.create(formData);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      toast.success("Transaction added successfully");
      router.push("/dashboard/personal-finance/transactions");
      router.refresh();
    } catch (error: unknown) {
      console.error("Failed to create transaction:", error);
      toast.error("Failed to create transaction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Add Transaction" subtitle="Record a new income or expense transaction" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Transaction Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Field label="Transaction Type" required>
                  <Select value={formData.type} onValueChange={(v) => handleTypeChange(v ?? "expense")}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Transaction In (Income)</SelectItem>
                      <SelectItem value="expense">Transaction Out (Expense)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Date" required>
                  <DateInput
                    className="h-9 text-sm border-gray-200"
                    value={formData.date}
                    onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
                  />
                </Field>

                <Field label="Amount (Rs.)" required>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-9 text-sm border-gray-200"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </Field>

                <Field label="Category" required>
                  <Select value={formData.categoryId} onValueChange={(v) => setFormData((prev) => ({ ...prev, categoryId: v ?? "" }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400 mt-1">
                    {availableCategories.length} {formData.type === "income" ? "income" : "expense"} categories available
                  </p>
                </Field>

                <Field label="Account" required>
                  <Select value={formData.accountId} onValueChange={(v) => setFormData((prev) => ({ ...prev, accountId: v ?? "" }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_ACCOUNTS.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Description</h3>
              <Field label="Description / Notes">
                <textarea
                  className="w-full h-20 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]"
                  placeholder="Optional notes about this transaction..."
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
                {submitting ? "Saving..." : "Save Transaction"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
