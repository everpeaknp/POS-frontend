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

// Mock categories for bills
const MOCK_CATEGORIES = [
  { id: "cat_1", name: "Utilities", type: "expense" },
  { id: "cat_2", name: "Rent/Mortgage", type: "expense" },
  { id: "cat_3", name: "Insurance", type: "expense" },
  { id: "cat_4", name: "Subscriptions", type: "expense" },
  { id: "cat_5", name: "Phone/Internet", type: "expense" },
  { id: "cat_6", name: "Credit Card Payment", type: "expense" },
  { id: "cat_7", name: "Loan Payment", type: "expense" },
  { id: "cat_8", name: "Other Bills", type: "expense" },
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function NewBillPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    billName: "",
    amount: "",
    dueDate: todayIsoDate(),
    categoryId: "",
    recurring: "one-time",
    status: "unpaid",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.billName.trim()) {
      toast.error("Bill name is required");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!formData.dueDate) {
      toast.error("Due date is required");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Replace with actual API call when backend is ready
      // await billAPI.create(formData);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      toast.success("Bill added successfully");
      router.push("/dashboard/personal-finance/bills");
      router.refresh();
    } catch (error: unknown) {
      console.error("Failed to create bill:", error);
      toast.error("Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Add Bill" subtitle="Create a new bill or recurring payment" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Bill Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Field label="Bill Name/Title" required>
                  <Input
                    type="text"
                    className="h-9 text-sm border-gray-200"
                    placeholder="e.g., Electricity Bill"
                    value={formData.billName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, billName: e.target.value }))}
                    required
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

                <Field label="Due Date" required>
                  <DateInput
                    className="h-9 text-sm border-gray-200"
                    value={formData.dueDate}
                    onChange={(date) => setFormData((prev) => ({ ...prev, dueDate: date }))}
                  />
                </Field>

                <Field label="Category">
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

                <Field label="Recurring">
                  <Select value={formData.recurring} onValueChange={(v) => setFormData((prev) => ({ ...prev, recurring: v ?? "one-time" }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Status">
                  <Select value={formData.status} onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v ?? "unpaid" }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Additional Information</h3>
              <Field label="Notes">
                <textarea
                  className="w-full h-20 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]"
                  placeholder="Optional notes about this bill..."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
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
                {submitting ? "Saving..." : "Save Bill"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
