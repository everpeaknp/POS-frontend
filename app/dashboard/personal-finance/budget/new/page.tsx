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

// Mock categories (expense categories for budgeting)
const MOCK_CATEGORIES = [
  { id: "cat_5", name: "Groceries" },
  { id: "cat_6", name: "Rent" },
  { id: "cat_7", name: "Utilities" },
  { id: "cat_8", name: "Dining" },
  { id: "cat_9", name: "Entertainment" },
  { id: "cat_10", name: "Transportation" },
  { id: "cat_11", name: "Health" },
  { id: "cat_12", name: "Shopping" },
  { id: "cat_13", name: "Education" },
  { id: "cat_14", name: "Other Expenses" },
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function NewBudgetPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    period: "monthly",
    startDate: todayIsoDate(),
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      toast.error("Category is required");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Budget amount must be greater than 0");
      return;
    }
    if (!formData.startDate) {
      toast.error("Start date is required");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Replace with actual API call when backend is ready
      // await budgetAPI.create(formData);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      toast.success("Budget created successfully");
      router.push("/dashboard/personal-finance/budget");
      router.refresh();
    } catch (error: unknown) {
      console.error("Failed to create budget:", error);
      toast.error("Failed to create budget");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Add Budget" subtitle="Set a spending limit for a category" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Budget Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Field label="Category" required>
                  <Select value={formData.categoryId} onValueChange={(v) => setFormData((prev) => ({ ...prev, categoryId: v ?? "" }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Budget Amount (Rs.)" required>
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

                <Field label="Period" required>
                  <Select value={formData.period} onValueChange={(v) => setFormData((prev) => ({ ...prev, period: v ?? "monthly" }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Start Date" required>
                  <DateInput
                    className="h-9 text-sm border-gray-200"
                    value={formData.startDate}
                    onChange={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
                  />
                </Field>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Description</h3>
              <Field label="Description / Notes">
                <textarea
                  className="w-full h-20 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]"
                  placeholder="Optional notes about this budget..."
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
                {submitting ? "Saving..." : "Save Budget"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
